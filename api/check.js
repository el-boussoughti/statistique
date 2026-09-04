'use strict';
/* Vercel function: /api/check — vérifie un token VIP signé (chargement session). */
const auth = require('../lib/auth');

module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const r = auth.checkHandler({ method: req.method, body: req.body, ip: req.headers['x-forwarded-for'] });
    res.status(r.status).json(r.json);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server' });
  }
};