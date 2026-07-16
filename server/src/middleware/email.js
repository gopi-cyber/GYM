// Email utility for VigorGMS.
// Currently uses logger-based simulated sending to avoid mandatory SMTP setup.
// Swap in real transport without changing route code.
const nodemailer = require('nodemailer');

let transport = null;

function getTransport() {
  if (transport) return transport;
  // Default to a streamed ethereal test account unless config is provided.
  const host = process.env.SMTP_HOST;
  if (host) {
    transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransport();
  const message = {
    from: process.env.MAIL_FROM || 'VigorGMS <no-reply@vigorgms.local>',
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await t.sendMail(message);
    const preview = typeof info.message === 'string' ? info.message : JSON.stringify(info, null, 2);
    console.log(`[email] sent -> ${to} | ${subject}`);
    console.log(preview);
    return { status: 'sent', to, subject };
  } catch (err) {
    console.error('[email] failed', err);
    return { status: 'failed', to, subject, error: err.message };
  }
}

module.exports = {
  sendEmail,
};
