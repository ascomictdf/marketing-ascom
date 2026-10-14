const bcrypt = require('bcryptjs');
const { ensureDb, sql } = require('../_lib/db');
const { requireUser } = require('../_lib/auth');
const { method, readBody } = require('../_lib/http');

// Usuário logado troca a própria senha (precisa informar a senha atual).
module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    await ensureDb();
    const user = await requireUser(req, res);
    if (!user) return;
    const body = await readBody(req);
    const current = String(body.currentPassword || '');
    const next = String(body.newPassword || '');
    if (next.length < 6) return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });

    const db = sql();
    const rows = await db`select id, email, password_hash, role from app_users where email = ${user.email} limit 1`;
    if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
      return res.status(400).json({ error: 'WRONG_PASSWORD' });
    }
    const hash = await bcrypt.hash(next, 12);
    await db`
      update app_users
      set password_hash = ${hash}, reset_token_hash = null, reset_expires_at = null, reset_requested_at = null, updated_at = now()
      where id = ${rows[0].id}
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'CHANGE_PASSWORD_FAILED', message: err.message });
  }
};
