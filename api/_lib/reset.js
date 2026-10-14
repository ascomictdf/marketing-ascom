const { randomToken, sha256 } = require('./auth');

function appBase(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${req.headers.host || ''}`;
}

// Gera um token de redefinição (o banco guarda só o hash) e devolve o link.
async function issueResetLink(db, req, email, minutes) {
  const token = randomToken();
  const tokenHash = sha256(token);
  const expires = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await db`
    update app_users
    set reset_token_hash = ${tokenHash}, reset_expires_at = ${expires}, updated_at = now()
    where email = ${email}
  `;
  return `${appBase(req)}/?reset=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

function resetEmailHtml(link, minutes) {
  return `<p>Recebemos um pedido para redefinir a sua senha do Hub de Agentes IA (Marketing ICTDF).</p>
<p><a href="${link}">Clique aqui para criar uma nova senha</a></p>
<p>Ou copie o link: ${link}</p>
<p>O link vale ${minutes} minutos. Se você não pediu, ignore este e-mail.</p>`;
}

module.exports = { issueResetLink, resetEmailHtml };
