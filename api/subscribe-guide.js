// ============================================================================
// "3 TIPP" FELIRATKOZÁS — Vercel serverless függvény, Brevo API-val
// ============================================================================
// Az oktatoanyag.html ide POST-olja a feliratkozó e-mail címét és a
// marketing-hozzájárulás állapotát. A függvény:
//   1) elmenti a feliratkozást a Firestore "leads" gyűjteménybe,
//   2) értesítő e-mailt küld a stúdiónak (hogy lásd, ki iratkozott fel),
//   3) egy rövid visszaigazoló e-mailt küld a feliratkozónak.
//
// FONTOS: a tényleges "3 tipp" tartalom még nincs megírva (a landing
// oldalon is csak cím-szinten szerepeltek a tippek, a végleges szöveg
// nélkül). Emiatt a feliratkozónak most csak egy visszaigazolás megy ki
// ("hamarosan megkapod"), NEM a kész anyag — azt a
// SUBSCRIBER_TIPS_HTML konstansba kell majd beírni, utána minden
// további feliratkozó automatikusan megkapja.
//
// BEÁLLÍTÁS: ugyanaz a BREVO_API_KEY és FIREBASE_SERVICE_ACCOUNT env var
// kell hozzá, mint a foglalási rendszerhez (lásd api/send-booking.js).
// ============================================================================

const { getDb } = require('./_lib/firebase-admin');
const admin = require('firebase-admin');

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER = { name: 'Loft of Beauty', email: 'foglalas@loftofbeauty.hu' };
const STUDIO_EMAIL = 'mullerdanielev@gmail.com';

// Ide kerül majd a végleges "3 tipp" e-mail HTML-je, amikor elkészül.
const SUBSCRIBER_TIPS_HTML = null;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail(headline, title, bodyHtml) {
  return `<div style="margin:0;padding:0;background-color:#FCE9ED;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FCE9ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(122,26,52,0.10);">
          <tr>
            <td style="background-color:#3A0E1C;padding:28px 32px;text-align:center;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:2px;color:#FFFFFF;">
                LOFT <span style="color:#E03E63;">&middot;</span> OF BEAUTY
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;text-align:center;">
              <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E03E63;margin-bottom:10px;">${esc(headline)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#3A0E1C;">${esc(title)}</div>
            </td>
          </tr>
          <tr><td style="padding:12px 32px 28px;font-size:15px;line-height:1.7;color:#3A0E1C;">${bodyHtml}</td></tr>
          <tr>
            <td style="background-color:#FCE9ED;padding:20px 32px;text-align:center;">
              <div style="font-size:11px;color:#A85C72;line-height:1.6;">
                Loft of Beauty &middot; Nyíregyháza, Meggyes u. 11.<br>
                Ez az email a weboldal "3 tipp" feliratkozási formájából érkezett automatikusan.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

async function sendViaBrevo(payload) {
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Brevo ' + res.status + ': ' + (await res.text()));
  }
}

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY nincs beállítva a környezeti változók között');
    return res.status(500).json({ error: 'Email küldés nincs konfigurálva' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const email = clean(body.email, 150);
  const consent = body.consent === true;
  const source = clean(body.source, 60) || 'oktatoanyag';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Érvénytelen email cím' });
  }
  if (!consent) {
    // A hozzájárulás nélkül nem tároljuk és nem is küldünk semmit —
    // a kliens oldali validáció mellett szerveroldalon is kikényszerítjük.
    return res.status(400).json({ error: 'Hozzájárulás szükséges' });
  }

  // 1) Mentés a Firestore "leads" gyűjteménybe.
  try {
    const db = getDb();
    const key = email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 120);
    await db.collection('leads').doc(key).set({
      email: email,
      consent: true,
      source: source,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('A feliratkozás mentése nem sikerült:', err);
  }

  // 2) Értesítés a stúdiónak.
  try {
    await sendViaBrevo({
      sender: SENDER,
      to: [{ email: STUDIO_EMAIL, name: 'Loft of Beauty' }],
      replyTo: { email: email },
      subject: 'Új feliratkozó a "3 tipp" anyagra: ' + email,
      htmlContent: wrapEmail('Új feliratkozó', email,
        '<p style="margin:0 0 10px">Forrás: ' + esc(source) + '</p>' +
        '<p style="margin:0">Marketing-hozzájárulás (hírlevél / Facebook célközönség): <b>igen</b></p>')
    });
  } catch (err) {
    console.error('A stúdiónak szóló értesítő nem ment el:', err);
  }

  // 3) Visszaigazolás a feliratkozónak.
  try {
    var subscriberBody = SUBSCRIBER_TIPS_HTML || (
      '<p style="margin:0 0 14px">Köszönjük a feliratkozást! Hamarosan (pár napon belül) megkapod tőlünk a 3 tippet — most állítjuk össze a legfrissebb tartalommal.</p>' +
      '<p style="margin:0">Addig is, ha szeretnéd, foglalj időpontot: <a href="https://loftofbeauty.hu/foglalas.html" style="color:#E03E63;font-weight:700;">loftofbeauty.hu/foglalas.html</a></p>'
    );
    await sendViaBrevo({
      sender: SENDER,
      to: [{ email: email }],
      replyTo: { email: STUDIO_EMAIL, name: 'Loft of Beauty' },
      subject: 'Köszönjük a feliratkozást — Loft of Beauty',
      htmlContent: wrapEmail('Feliratkozás megerősítve', 'Köszönjük!', subscriberBody)
    });
  } catch (err) {
    console.error('A feliratkozónak szóló visszaigazolás nem ment el:', err);
  }

  return res.status(200).json({ ok: true });
};
