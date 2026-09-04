'use strict';
/* Vercel function: /api/verify — valide une clé et délivre un token VIP signé. */
const auth = require('../lib/auth');

module.exports = function (req, res) {
  const r = auth.verifyHandler({ method: req.method, body: req.body, ip: req.headers['x-forwarded-for'] });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(r.status).json(r.json);
};