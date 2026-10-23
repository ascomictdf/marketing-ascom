const { ensureDb } = require('../_lib/db');
const { sessionUser, renewSession } = require('../_lib/auth');
const { method } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    await ensureDb();
    const user = await sessionUser(req);
    if (user) renewSession(req, res, user);
    return res.status(200).json({ authenticated: !!user, user: user ? { email: user.email, name: user.name, role: user.role } : null });
  } catch (err) {
    console.error(err);
    // 503 = não deu para verificar agora (banco/rede) — o navegador tenta de novo em vez de deslogar
    return res.status(503).json({ error: 'AUTH_CHECK_FAILED', message: err.message });
  }
};
