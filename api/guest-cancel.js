// api/guest-cancel.js
// A vendégnek szóló emailekben (visszaigazolás, emlékeztető) szereplő
// "Lemondom az időpontot" link ide mutat. Token alapú azonosítás, mint a
// confirm-booking.js-nél — bejelentkezés nem kell hozzá.
// A foglalás időpontja előtt 24 órán belül már nem engedi lemondani innen.

const { getDb } = require('./_lib/firebase-admin');

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER = { name: 'Loft of Beauty', email: 'foglalas@loftofbeauty.hu' };
const STUDIO_EMAIL = 'hajdoagota@gmail.com';
const CUTOFF_HOURS = 24;

function htmlPage(title, message) {
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8">
<title>${title} — Loft of Beauty</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#FCE9ED;color:#3A0E1C;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .card{max-width:420px;background:#fff;border-radius:16px;padding:40px 32px;text-align:center;
        box-shadow:0 12px 30px rgba(122,26,52,0.10);}
  h1{font-family:Georgia,serif;font-size:22px;margin:0 0 12px;}
  p{font-size:15px;line-height:1.6;color:#A85C72;margin:0;}
  a{color:#E03E63;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

function bookingDateTime(booking) {
  var parts = String(booking.date || '').split('-');
  var t = String(booking.time || '00:00').split(':');
  if (parts.length !== 3) return null;
  return new Date(
    parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10),
    parseInt(t[0], 10) || 0, parseInt(t[1], 10) || 0, 0, 0
  );
}

async function notifyStudio(booking) {
  try {
    await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: STUDIO_EMAIL, name: 'Loft of Beauty' }],
        subject: 'Vendég lemondta az időpontját — ' + booking.date + ' ' + booking.time,
        htmlContent: '<p>' + (booking.name || 'Egy vendég') + ' lemondta a foglalását (' +
          booking.date + ' ' + booking.time + ', ' + (booking.svc || '') + ').</p>' +
          '<p>Az időpont újra szabaddá vált.</p>'
      })
    });
  } catch (err) {
    console.error('A stúdió-értesítés nem ment el:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send(htmlPage('Hiba', 'Érvénytelen kérés.'));
  }

  var id = typeof req.query.id === 'string' ? req.query.id : '';
  var token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!id || !token) {
    return res.status(400).send(htmlPage('Hiba', 'Hiányzó adatok a lemondó linkben.'));
  }

  var db;
  try {
    db = getDb();
  } catch (err) {
    console.error('Firebase Admin nincs konfigurálva:', err);
    return res.status(500).send(htmlPage('Hiba', 'A rendszer jelenleg nem elérhető. Kérünk hívj minket telefonon.'));
  }

  var bookingRef = db.collection('bookings').doc(id);
  var snap = await bookingRef.get();

  if (!snap.exists) {
    return res.status(404).send(htmlPage('Nem található', 'Ez a foglalás nem található — lehet, hogy már törölve lett.'));
  }

  var booking = snap.data();

  if (!booking.confirmToken || booking.confirmToken !== token) {
    return res.status(403).send(htmlPage('Érvénytelen link', 'Ez a lemondó link nem érvényes.'));
  }

  if (booking.status === 'cancelled') {
    return res.status(410).send(htmlPage('Foglalás már lemondva', 'Ez a foglalás már le lett mondva korábban.'));
  }

  var dt = bookingDateTime(booking);
  var hoursUntil = dt ? (dt.getTime() - Date.now()) / (60 * 60 * 1000) : null;

  if (hoursUntil !== null && hoursUntil < CUTOFF_HOURS) {
    return res.status(403).send(htmlPage(
      'Ezt már nem lehet innen lemondani',
      'Az időpontodig kevesebb, mint 24 óra van hátra, ezért ezt a linket már nem fogadjuk el. Kérünk hívj minket telefonon, ha mégsem tudsz jönni: <a href="tel:+36305039156">+36 30 503 9156</a>.'
    ));
  }

  await bookingRef.delete();
  await db.collection('slots').doc(id).delete();
  await notifyStudio(booking);

  return res.status(200).send(htmlPage(
    'Lemondva',
    'Rendben, ' + (booking.name || '') + ', a ' + (booking.date || '') + ' ' + (booking.time || '') + '-i időpontodat töröltük. Bármikor foglalhatsz újat a weboldalunkon!'
  ));
};
