'use strict';
/* Vercel function: /api/verify — valide une clé et délivre un token VIP signé. */
const auth = require('../lib/auth');

module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const r = auth.verifyHandler({ method: req.method, body: req.body, ip: req.headers['x-forwarded-for'] });
    res.status(r.status).json(r.json);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server' });
  }
};