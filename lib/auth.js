'use strict';
/* ============================================================================
   Auth shared — AUTORITÉ VIP CÔTÉ SERVEUR (Vercel functions).

   La liste des clés est DUPLIQUÉE ici volontairement :
   - js/app.js  : copie CLIENT, utilisée uniquement pour l'UX immédiate
                  (auto-remplissage opérateur, thème) — jamais pour accorder le VIP.
   - lib/auth.js: copie SERVEUR, seule autorité. Elle signe un token HMAC-SHA256
                  qui est le SEUL marqueur VIP persistant accepté au chargement.

   MAINTENANCE : pour ajouter une clé, mettre à jour ce fichier ET js/app.js.
   Env (Vercel) : QUITTANCE_SECRET (obligatoire, >= 16 caractères),
                  QUITTANCE_TOKEN_TTL_DAYS (défaut 30).
   ============================================================================ */

const crypto = require('crypto');

const SECRET_KEYS = [
  { id: 'hamza',     hash: 'd9940f9d77ab60f49d3955e43f93026b0d2d2d5dd924d38868464b7862cdb951', operator: 'Hamza',     theme: 'snake',     anim: 'snake',     msg: 'Fiiin a lhnach, Marhba bik !' },
  { id: 'douae',     hash: '4b7cf120a62dd74d6cadfbd7f078a069479b76c017d348a95a54444c29faeee6', operator: 'Douae',     theme: 'love',      anim: 'love',      msg: 'Salam Ostada Douae, Marhba bik !' },
  { id: 'riad',      hash: 'd91d3db640487b66f08dd1d82d81b1ec7dc708a8971dbd6e854cddfed81b6b54', operator: 'Riad',      theme: 'wolf',      anim: 'wolf',      msg: 'Bonjour Riad, Marhba bik !' },
  { id: 'sifeddine', hash: '3c7e6480c3bfce90d42d27b6c6c38ce037ab4fd867e1838c1f919013a7e37ecd', operator: 'Sifeddine', theme: 'fire',      anim: 'fire',      msg: 'Bonjour Sifeddine, Marhba bik! Tfrej f Breaking Bad.' },
  { id: 'rachid',    hash: '2d4adb7cee13dc9df1b1ad9f3a60c495838e09fff4779ababc6ddc58d8314338', operator: 'Rachid',    theme: 'cyber',     anim: 'cyber',     msg: 'Bonjour Rachid. Marhba bik !' },
  { id: 'asmae',     hash: '75be56db79ade3165669121ee64d126e6ad0cd0de360e97be6a3f3aabb93017b', operator: 'Asmae',     theme: 'unicorn',   anim: 'unicorn',   msg: 'Bonjour Asmae, Marhba bik !' },
  { id: 'sunflower', hash: '9e6128b7804868af157c2c8efabe2aaab1651635b535c414682f60bbe60aee96', operator: 'Sunflower', theme: 'sunflower', anim: 'sunflower', msg: 'Rayonne, Marhba bik !' },
  { id: 'bunny',     hash: 'e441f9baee99ba89af98883c109515a7344f17aa94f81efb2fb4b017b92f27f6', operator: 'Bunny',     theme: 'bunny',     anim: 'bunny',     msg: 'Adorable, Marhba bik !' },
];

/* ---- Base64url ---------------------------------------------------------- */

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4 !== 0) b += '=';
  return Buffer.from(b, 'base64').toString('utf8');
}

/* ---- Secret & tokens ---------------------------------------------------- */

function authSecret() {
  const s = process.env.QUITTANCE_SECRET;
  if (!s || s.length < 16) {
    throw new Error('QUITTANCE_SECRET env var missing or too short (< 16 chars)');
  }
  return s;
}
function sigOf(body) {
  return crypto.createHmac('sha256', authSecret()).update(body, 'utf8').digest();
}
function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  return body + '.' + b64url(sigOf(body));
}
function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const i = token.indexOf('.');
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sigPart = token.slice(i + 1);
  try {
    const supplied = Buffer.from(sigPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const expected = sigOf(body);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) return null;
    const payload = JSON.parse(b64urlDecode(body));
    if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
function makeToken(id) {
  const ttlDays = parseInt(process.env.QUITTANCE_TOKEN_TTL_DAYS || '30', 10);
  const iat = Math.floor(Date.now() / 1000);
  return signToken({ iat: iat, exp: iat + ttlDays * 86400, id: id });
}

/* ---- Key matching (même normalisation que le client) -------------------- */

function normalizeKey(v) { return String(v || '').trim().toLowerCase(); }
function sha256Hex(val) { return crypto.createHash('sha256').update(val, 'utf8').digest('hex'); }
function findKeyByHash(hash) {
  for (let i = 0; i < SECRET_KEYS.length; i++) if (SECRET_KEYS[i].hash === hash) return i;
  return -1;
}
function findKeyById(id) {
  for (let i = 0; i < SECRET_KEYS.length; i++) if (SECRET_KEYS[i].id === id) return i;
  return -1;
}
function publicProfile(k) {
  return { id: k.id, operator: k.operator, theme: k.theme, anim: k.anim, msg: k.msg };
}

/* ---- Rate limiting (mémoire par instance — barre, pas rempart) ---------- */

const buckets = new Map();
function rateLimited(ip, limitPerMin) {
  const key = String(ip || '?');
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < 60000);
  if (arr.length >= limitPerMin) { buckets.set(key, arr); return true; }
  arr.push(now);
  buckets.set(key, arr);
  return false;
}

/* ---- Parsing de corps (objet ou string JSON) ---------------------------- */

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'string') { try { return JSON.parse(body); } catch (e) { return null; } }
  return body;
}
function ipOf(req) {
  if (!req) return '';
  return req.ip || (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'])) || '';
}

/* ---- Handlers (purs, testables sans Vercel) ----------------------------- */

function verifyHandler(req) {
  if (req && req.method && req.method !== 'POST') return { status: 405, json: { ok: false } };
  if (rateLimited(ipOf(req), 15)) return { status: 429, json: { ok: false, reason: 'rate' } };
  const body = parseBody(req && req.body);
  const key = body && typeof body.key === 'string' ? body.key : '';
  if (!key) return { status: 200, json: { ok: false } };
  const idx = findKeyByHash(sha256Hex(normalizeKey(key)));
  if (idx < 0) return { status: 200, json: { ok: false } };
  const k = SECRET_KEYS[idx];
  return { status: 200, json: Object.assign({ ok: true, token: makeToken(k.id) }, publicProfile(k)) };
}

function checkHandler(req) {
  const body = parseBody(req && req.body);
  const token = body && typeof body.token === 'string' ? body.token : '';
  if (!token) return { status: 200, json: { ok: false } };
  const payload = verifyToken(token);
  if (!payload) return { status: 200, json: { ok: false } };
  const idx = findKeyById(payload.id);
  if (idx < 0) return { status: 200, json: { ok: false } };
  return { status: 200, json: Object.assign({ ok: true }, publicProfile(SECRET_KEYS[idx])) };
}

module.exports = {
  SECRET_KEYS,
  signToken,
  verifyToken,
  makeToken,
  normalizeKey,
  sha256Hex,
  findKeyByHash,
  findKeyById,
  publicProfile,
  rateLimited,
  verifyHandler,
  checkHandler,
};