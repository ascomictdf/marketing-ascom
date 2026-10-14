// Envio de e-mail: Resend (RESEND_API_KEY + EMAIL_FROM) ou SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS...).
// Sem nenhum dos dois configurado, mailConfigured() retorna false e quem chama decide o plano B.

function mailFrom() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '';
}

function mailProvider() {
  if (process.env.RESEND_API_KEY && mailFrom()) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return '';
}

function mailConfigured() {
  return !!mailProvider();
}

async function sendMail({ to, subject, html, text }) {
  const provider = mailProvider();
  if (provider === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: mailFrom(), to, subject, html, text })
    });
    if (!r.ok) throw new Error('Resend respondeu ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return true;
  }
  if (provider === 'smtp') {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transport.sendMail({ from: mailFrom(), to, subject, html, text });
    return true;
  }
  return false;
}

module.exports = { mailConfigured, sendMail };
