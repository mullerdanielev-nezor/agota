// api/send-reminders.js
const { getDb } = require('./_lib/firebase-admin');
const { sendReminderEmail } = require('./_lib/reminder-email');

const SITE_URL = 'https://loftofbeauty.hu';

function pad2(n){ return n < 10 ? '0' + n : '' + n; }
function dateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }

function bookingDateTime(b) {
  var parts = String(b.date || '').split('-');
  var t = String(b.time || '00:00').split(':');
  if (parts.length !== 3) return null;
  return new Date(
    parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10),
    parseInt(t[0], 10) || 0, parseInt(t[1], 10) || 0, 0, 0
  );
}

var WINDOWS = [
  { key: 'r48', hours: 48, headline: 'Közelgő időpontod', needsConfirm: true,
    subject: function(b){ return 'Emlékeztető: ' + b.date + ' ' + b.time + ' — Loft of Beauty'; } },
  { key: 'r24', hours: 24, headline: 'Erősítsd meg az időpontod', needsConfirm: true,
    subject: function(b){ return 'Kérünk erősítsd meg: holnap ' + b.time + ' — Loft of Beauty'; } },
  { key: 'r3', hours: 3, headline: 'Hamarosan itt az időpontod', needsConfirm: false,
    subject: function(b){ return 'Ma ' + b.time + '-kor várunk — Loft of Beauty'; } },
  { key: 'r1', hours: 1, headline: 'Egy óra múlva várunk', needsConfirm: false,
    subject: function(b){ return 'Egy óra múlva ('+ b.time +') várunk — Loft of Beauty'; } }
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var expectedSecret = process.env.CRON_SECRET;
  var providedSecret = req.headers['x-cron-secret'];
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var db;
  try {
    db = getDb();
  } catch (err) {
    console.error('Firebase Admin nincs konfigurálva:', err);
    return res.status(500).json({ error: 'Firebase Admin nincs konfigurálva' });
  }

  var now = new Date();
  var todayKey = dateKey(now);
  var horizon = new Date(now.getTime() + 50 * 60 * 60 * 1000);
  var horizonKey = dateKey(horizon);

  var snap = await db.collection('bookings')
    .where('date', '>=', todayKey)
    .where('date', '<=', horizonKey)
    .get();

  var sent = { r48: 0, r24: 0, r3: 0, r1: 0 };
  var errors = [];

  for (var i = 0; i < snap.docs.length; i++) {
    var docSnap = snap.docs[i];
    var booking = docSnap.data();

    if (booking.status === 'cancelled') continue;

    var dt = bookingDateTime(booking);
    if (!dt) continue;
    var hoursUntil = (dt.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursUntil < 0) continue;

    var remindersSent = booking.remindersSent || {};

    for (var w = 0; w < WINDOWS.length; w++) {
      var win = WINDOWS[w];
      if (hoursUntil > win.hours) continue;
      if (remindersSent[win.key]) continue;
      if (win.needsConfirm && !booking.confirmToken) continue;
      if (win.needsConfirm && booking.status === 'confirmed') continue;

      var confirmUrl = win.needsConfirm
        ? SITE_URL + '/api/confirm-booking?id=' + encodeURIComponent(docSnap.id) + '&token=' + encodeURIComponent(booking.confirmToken)
        : null;
      var cancelUrl = (win.needsConfirm && booking.confirmToken)
        ? SITE_URL + '/api/guest-cancel?id=' + encodeURIComponent(docSnap.id) + '&token=' + encodeURIComponent(booking.confirmToken)
        : null;

      try {
        await sendReminderEmail(booking, {
          headline: win.headline,
          subject: win.subject(booking),
          confirmUrl: confirmUrl,
          cancelUrl: cancelUrl
        });
        var update = {};
        update['remindersSent.' + win.key] = true;
        await docSnap.ref.update(update);
        sent[win.key]++;
      } catch (err) {
        console.error('Emlékeztető küldése sikertelen (' + docSnap.id + ', ' + win.key + '):', err);
        errors.push({ id: docSnap.id, window: win.key, error: String(err) });
      }
    }
  }

  return res.status(200).json({ ok: errors.length === 0, sent: sent, errors: errors });
};
