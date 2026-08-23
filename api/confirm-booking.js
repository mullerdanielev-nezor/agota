// api/confirm-booking.js
const { getDb } = require('./_lib/firebase-admin');

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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send(htmlPage('Hiba', 'Érvénytelen kérés.'));
  }

  var id = typeof req.query.id === 'string' ? req.query.id : '';
  var token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!id || !token) {
    return res.status(400).send(htmlPage('Hiba', 'Hiányzó adatok a visszaigazoló linkben.'));
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
    return res.status(403).send(htmlPage('Érvénytelen link', 'Ez a visszaigazoló link nem érvényes.'));
  }

  if (booking.status === 'cancelled') {
    return res.status(410).send(htmlPage('Foglalás lemondva', 'Ez a foglalás már le lett mondva.'));
  }

  await bookingRef.update({ status: 'confirmed' });

  return res.status(200).send(htmlPage(
    'Visszaigazolva!',
    'Köszönjük, ' + (booking.name || '') + '! Az időpontod (' + (booking.date || '') + ' ' + (booking.time || '') + ') megerősítve. Várunk szeretettel!'
  ));
};
