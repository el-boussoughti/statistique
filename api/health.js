'use strict';
/* Vercel function: /api/health — diagnostic de déploiement/fonctions.
   Ne révèle pas le secret, seulement s'il est configuré (>=16 chars). */
module.exports = function (req, res) {
  const s = process.env.QUITTANCE_SECRET || '';
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json({ ok: true, secretConfigured: s.length >= 16, secretLength: s.length });
};