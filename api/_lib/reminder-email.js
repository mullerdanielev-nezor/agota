// api/_lib/reminder-email.js
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER = { name: 'Loft of Beauty', email: 'foglalas@loftofbeauty.hu' };
const STUDIO_PHONE = '+36305039156';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderReminderEmail(d) {
  var confirmButton = d.confirmUrl
    ? '<tr><td style="padding:0 32px 24px;text-align:center;">' +
      '<a href="' + esc(d.confirmUrl) + '" style="display:inline-block;background-color:#E03E63;color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">Erősítsd meg az időpontod</a>' +
      '</td></tr>'
    : '';

  var cancelLink = d.cancelUrl
    ? '<tr><td style="padding:0 32px 24px;text-align:center;">' +
      '<a href="' + esc(d.cancelUrl) + '" style="font-size:12px;color:#A85C72;text-decoration:underline;">Nem tudok jönni, lemondom az időpontot</a>' +
      '</td></tr>'
    : '';

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
              <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E03E63;margin-bottom:10px;">${esc(d.headline)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#3A0E1C;">${esc(d.name)}</div>
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
          ${confirmButton}
          ${cancelLink}
          <tr>
            <td style="background-color:#FCE9ED;padding:20px 32px;text-align:center;">
              <div style="font-size:11px;color:#A85C72;line-height:1.6;">
                Loft of Beauty &middot; Nyíregyháza, Meggyes u. 11.<br>
                Kérdés esetén hívj minket: <a href="tel:${esc(STUDIO_PHONE)}" style="color:#E03E63;text-decoration:none;">${esc(STUDIO_PHONE)}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

async function sendReminderEmail(booking, opts) {
  var payload = {
    sender: SENDER,
    to: [{ email: booking.email, name: booking.name }],
    subject: opts.subject,
    htmlContent: renderReminderEmail({
      headline: opts.headline,
      svc: booking.svc,
      date: booking.date,
      time: booking.time,
      name: booking.name,
      confirmUrl: opts.confirmUrl || null,
      cancelUrl: opts.cancelUrl || null
    })
  };
  var res = await fetch(BREVO_ENDPOINT, {
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

module.exports = { sendReminderEmail };
