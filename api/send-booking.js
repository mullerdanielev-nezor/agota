// ============================================================================
// FOGLALÁSI EMAIL KÜLDÉS — Vercel serverless függvény, Brevo API-val
// ============================================================================
// A foglalas.html ide POST-olja a foglalás adatait, ez a függvény pedig
// kiküld két levelet: egyet a stúdiónak (értesítő), egyet a vendégnek
// (visszaigazolás).
//
// BEÁLLÍTÁS:
//   1) Brevo fiók (https://www.brevo.com) — ingyenes csomag: 300 email/nap.
//   2) Domains → Authenticate a domain → loftofbeauty.hu, és a kapott DNS
//      rekordokat (DKIM, brevo-code) fel kell venni a domain DNS-ébe.
//   3) SMTP & API → API Keys → új v3 kulcs.
//   4) Vercel → Project → Settings → Environment Variables:
//         BREVO_API_KEY = <a kulcs>
//      majd újradeploy. A kulcs SOHA nem kerül a kódba.
// ============================================================================

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const SENDER = { name: 'Loft of Beauty', email: 'foglalas@loftofbeauty.hu' };
const STUDIO_EMAIL = 'hajdoagota@gmail.com';
const STUDIO_PHONE = '+36305039156';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A levél sablonja — a korábbi EmailJS-template dizájnja, változatlanul.
function renderEmail(d) {
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
              <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E03E63;margin-bottom:10px;">
                ${esc(d.headline)}
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#3A0E1C;">
                ${esc(d.name)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FCE9ED;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;width:120px;">Kezelés</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.svc)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;">Dátum</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.date)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;">Időpont</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.time)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;width:120px;">Név</td>
                  <td style="padding:8px 0;font-size:15px;color:#3A0E1C;">${esc(d.name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;">Telefon</td>
                  <td style="padding:8px 0;font-size:15px;">
                    <a href="tel:${esc(d.phone)}" style="color:#E03E63;text-decoration:none;font-weight:600;">${esc(d.phone)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;vertical-align:top;">Megjegyzés</td>
                  <td style="padding:8px 0;font-size:15px;color:#3A0E1C;">${esc(d.note)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px;text-align:center;">
              <a href="tel:${esc(d.ctaPhone)}" style="display:inline-block;background-color:#E03E63;color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">
                ${esc(d.ctaLabel)}
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FCE9ED;padding:20px 32px;text-align:center;">
              <div style="font-size:11px;color:#A85C72;line-height:1.6;">
                Loft of Beauty &middot; Nyíregyháza, Meggyes u. 11.<br>
                Ez az email automatikusan érkezett a weboldal foglalási rendszeréből.
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

// Egyszerű mezővalidáció — a foglalás maga már rögzült a Firestore-ban,
// itt csak azt akadályozzuk meg, hogy szemetet vagy túl hosszú tartalmat
// lehessen a levélbe injektálni.
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

  const svc = clean(body.svc, 100);
  const date = clean(body.date, 40);
  const time = clean(body.time, 10);
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 150);
  const note = clean(body.note, 1000) || '—';

  if (!name || !phone || !email || !date || !time) {
    return res.status(400).json({ error: 'Hiányzó adatok' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Érvénytelen email cím' });
  }

  const base = { svc: svc || 'Időpontfoglalás', date, time, name, phone, note };
  const results = { studio: false, guest: false };

  // 1) Értesítő a stúdiónak — a válasz gomb egyből a vendégnek megy.
  try {
    await sendViaBrevo({
      sender: SENDER,
      to: [{ email: STUDIO_EMAIL, name: 'Loft of Beauty' }],
      replyTo: { email: email, name: name },
      subject: 'Új foglalás: ' + name + ' — ' + date + ' ' + time,
      htmlContent: renderEmail(Object.assign({}, base, {
        headline: 'Új foglalás érkezett',
        ctaPhone: phone,
        ctaLabel: 'Vendég felhívása'
      }))
    });
    results.studio = true;
  } catch (err) {
    console.error('A stúdiónak szóló értesítő nem ment el:', err);
  }

  // 2) Visszaigazolás a vendégnek.
  try {
    await sendViaBrevo({
      sender: SENDER,
      to: [{ email: email, name: name }],
      replyTo: { email: STUDIO_EMAIL, name: 'Loft of Beauty' },
      subject: 'Foglalásod visszaigazolva — ' + date + ' ' + time,
      htmlContent: renderEmail(Object.assign({}, base, {
        headline: 'Foglalásod visszaigazolva',
        ctaPhone: STUDIO_PHONE,
        ctaLabel: 'Hívjon minket'
      }))
    });
    results.guest = true;
  } catch (err) {
    console.error('A vendégnek szóló visszaigazolás nem ment el:', err);
  }

  return res.status(200).json({ ok: results.studio || results.guest, sent: results });
};
