'use strict';
/* Vercel function: /api/check — vérifie un token VIP signé (chargement session). */
const auth = require('../lib/auth');

module.exports = function (req, res) {
  const r = auth.checkHandler({ method: req.method, body: req.body, ip: req.headers['x-forwarded-for'] });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(r.status).json(r.json);
};