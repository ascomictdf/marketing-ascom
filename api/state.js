const { ensureDb, sql } = require('./_lib/db');
const { requireUser, requireAdmin } = require('./_lib/auth');
const { method, readBody } = require('./_lib/http');
const { mergeApprovalHistory } = require('./_lib/history');

// "version" = updated_at como texto (opaco). O cliente manda ?since=<version> na sincronização
// periódica e, se nada mudou, recebe só { unchanged: true } em vez do estado inteiro.
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET', 'PUT'])) return;
  try {
    await ensureDb();
    const user = req.method === 'GET' ? await requireUser(req, res) : await requireAdmin(req, res);
    if (!user) return;

    const db = sql();

    if (req.method === 'GET') {
      const since = String((req.query && req.query.since) || new URL(req.url || '/', 'http://x').searchParams.get('since') || '');
      if (since) {
        const v = await db`select updated_at::text as version from app_state where id = 'main' limit 1`;
        if (v[0] && v[0].version === since) return res.status(200).json({ unchanged: true, version: since });
      }
      const rows = await db`select data, updated_at::text as version from app_state where id = 'main' limit 1`;
      return res.status(200).json({ data: rows[0] ? rows[0].data : null, version: rows[0] ? rows[0].version : '' });
    }

    const rows = await db`select data from app_state where id = 'main' limit 1`;
    const current = rows[0] ? rows[0].data : null;
    const body = await readBody(req);
    const data = mergeApprovalHistory(current, body && body.data ? body.data : {});
    const saved = await db`
      insert into app_state (id, data, updated_at)
      values ('main', ${JSON.stringify(data)}::jsonb, now())
      on conflict (id) do update set data = excluded.data, updated_at = now()
      returning updated_at::text as version
    `;
    return res.status(200).json({ ok: true, version: saved[0] ? saved[0].version : '' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'STATE_FAILED', message: err.message });
  }
};
