// IDEIGLENES, csak email-sablon előnézethez — törlésre kerül tesztelés után.
const { sendReminderEmail } = require('./_lib/reminder-email');

module.exports = async function handler(req, res) {
  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: 'Email küldés nincs konfigurálva' });
  }
  var to = typeof req.query.to === 'string' ? req.query.to : '';
  if (!to) return res.status(400).json({ error: 'Hiányzó "to" paraméter' });

  try {
    await sendReminderEmail(
      { email: to, name: 'Teszt Miklós', svc: 'Teszt kezelés', date: '2026-08-31', time: '09:00' },
      {
        headline: 'Közelgő időpontod',
        subject: 'ELŐNÉZET — így néz ki a lemondás linkes emlékeztető',
        confirmUrl: 'https://loftofbeauty.hu/api/confirm-booking?id=demo&token=demo',
        cancelUrl: 'https://loftofbeauty.hu/api/guest-cancel?id=demo&token=demo'
      }
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
