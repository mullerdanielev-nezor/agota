// ============================================================================
// FOGLALÁS-TÖRLÉS ÉRTESÍTŐ — Vercel serverless függvény, Brevo API-val
// ============================================================================
// Az admin.html ide POST-olja a törölt foglalás adatait, mielőtt törli a
// Firestore-ból, ez a függvény pedig kiküld egy emailt a vendégnek, hogy a
// foglalását lemondták.
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

// Ugyanaz a sablon, mint a send-booking.js-ben.
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
  const email = clean(body.email, 150);

  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Hiányzó adatok' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Érvénytelen email cím' });
  }

  try {
    await sendViaBrevo({
      sender: SENDER,
      to: [{ email: email, name: name }],
      replyTo: { email: STUDIO_EMAIL, name: 'Loft of Beauty' },
      subject: 'Foglalásod lemondva — ' + date + ' ' + time,
      htmlContent: renderEmail({
        svc: svc || 'Időpontfoglalás',
        date, time, name,
        headline: 'Foglalásod lemondva',
        ctaPhone: STUDIO_PHONE,
        ctaLabel: 'Hívjon minket'
      })
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('A lemondó email nem ment el:', err);
    return res.status(200).json({ ok: false });
  }
};
