/* =====================================================
   guardian.js — « Le Gardien » : vérification des prix
   des quittances (correct / warning / mistake)
   ===================================================== */

/* Valeurs connues par type + règle (fixe | multiple | combo | free).
   Un type peut avoir PLUSIEURS règles alternatives (tableau) :
   il est correct s'il respecte AU MOINS une règle. */
var GUARDIAN_RULES = {
  /* Fixe : valeur unique exacte */
  C1:   { mode: 'fixed',  values: [40] },
  C2:   { mode: 'fixed',  values: [60] },
  CML:  { mode: 'fixed',  values: [100] },
  CMD:  { mode: 'fixed',  values: [40] },
  /* Multiple : valeur de base x n */
  ACC:  { mode: 'multiple', base: 80 },
  /* Combo : somme de valeurs connues (multiples de chaque) */
  RX:   { mode: 'combo',  values: [112.5, 120, 30, 90, 75] },
  LABO: { mode: 'combo',  values: [22.5, 30, 52.5, 75, 37.5, 60, 150, 187.5] },
  HOSP: { mode: 'combo',  values: [400, 150] },
  /* EXP : plusieurs montants possibles — SANS combinaison :
     50 fixe, ou multiples de 700, ou multiples de 2000 ;
     + prix combinables/multipliables entre eux : 165,150,200,225,300,337,120,450 */
  EXP:   [
    { mode: 'fixed',    values: [50] },
    { mode: 'multiple', base: 700 },
    { mode: 'multiple', base: 2000 },
    { mode: 'combo',    values: [165, 150, 200, 225, 300, 337, 120, 450] }
  ],
  /* Types sans règle → toujours OK */
  ANNUL: { mode: 'free'  }
};

var GUARDIAN_VERIFIED = []; /* valeurs combo validées à la main → ne plus avertir */

/* --- Valeurs combinables : les trier par ordre décroissant --- */
function _comboVals(rule) {
  return rule.values.slice().sort(function(a, b) { return b - a; });
}

/* Mémoisation par (sig des valeurs, amount) */
var _comboCache = {};

/* Garde-fou anti-explosion : les combos réels se trouvent rapidement ; une
   valeur hors combos sur un gros montant forcerait un balayage quasi infini.
   On borne à la fois le multiplicateur de chaque valeur et le travail total
   (au-delà de la limite, on considère « pas un combo » et on purge le cache
   pour ne garder que les preuves complètes). */
var _comboWork = 0;
var _comboWorkLimit = 300000;
var _comboCapHit = false;
var _comboMaxMult = 40;

/* Teste si `amount` peut être composé comme somme de multiples des valeurs connues.
   Limite à 8 groupes combinés (un prix = somme réaliste de 2-6 prestations). */
function _isCombo(values, amount, left) {
  var EPS = 1e-6;
  if (typeof left === 'undefined') left = 8;
  if (amount < -EPS) return false;
  if (Math.abs(amount) < EPS) return true;
  if (left <= 0) return false;
  if (!isFinite(amount)) return false;
  if (++_comboWork > _comboWorkLimit) { _comboCapHit = true; return false; }

  var key = values.join('|') + '#' + amount;
  if (key in _comboCache) return _comboCache[key];

  var res = false;
  for (var i = 0; i < values.length; i++) {
    var v = values[i];
    if (v > amount + EPS) continue;
    var maxN = Math.min(Math.floor(amount / v + EPS), _comboMaxMult);
    for (var n = 1; n <= maxN; n++) {
      var rest = amount - n * v;
      if (rest < -EPS) break;
      if (_isCombo(values, rest, left - 1)) { res = true; break; }
    }
    if (res) break;
  }
  if (!_comboCapHit) _comboCache[key] = res;
  return res;
}

function _comboCheck(rule, amount) {
  if (!isFinite(amount)) return false;
  _comboWork = 0;
  _comboCapHit = false;
  var res = _isCombo(_comboVals(rule), amount);
  if (_comboCapHit) _comboCache = {};
  return res;
}

/* --- Règles : normalisation à un tableau --- */
function _rulesFor(type) {
  var r = GUARDIAN_RULES[type];
  if (!r) return [];
  return Array.isArray(r) ? r : [r];
}

/* Description courte d'une règle (pour le message d'aide) */
function _ruleSummary(rule) {
  if (rule.mode === 'fixed')    return rule.values.join(' ou ') + ' dh';
  if (rule.mode === 'multiple') return 'multiple de ' + rule.base + ' dh';
  if (rule.mode === 'combo')    return 'combinaison de valeurs connues';
  return 'libre';
}

/* La valeur `m` respecte-t-elle cette règle ? */
function _matchRule(rule, m) {
  if (rule.mode === 'fixed') {
    return rule.values.some(function(v) { return Math.abs(v - m) < 1e-6; });
  }
  if (rule.mode === 'multiple') {
    var k = m / rule.base;
    return Math.abs(k - Math.round(k)) < 1e-6 && k >= 1;
  }
  if (rule.mode === 'combo') {
    return m > 1e-6 && _comboCheck(rule, m);
  }
  return true; /* free */
}

/* --- Classification d'une quittance --- */
function classifyEntry(entry) {
  var rules = _rulesFor(entry.type);
  if (!rules.length) return { status: 'correct', reason: 'Type libre' };
  var m = parseFloat(entry.montant);
  if (!isFinite(m)) return { status: 'mistake', reason: 'Montant invalide' };
  var hasCombo = false;

  for (var i = 0; i < rules.length; i++) {
    if (rules[i].mode === 'combo') hasCombo = true;
    if (_matchRule(rules[i], m)) {
      return { status: 'correct', reason: 'Valeur conforme (' + _ruleSummary(rules[i]) + ')' };
    }
  }

  if (GUARDIAN_VERIFIED.indexOf(entry.type + ':' + m) > -1) {
    return { status: 'correct', reason: 'Validée manuellement' };
  }

  /* Si une règle « combo » existe, la valeur pourrait être une combinaison inconnue → alerte */
  if (hasCombo) {
    return { status: 'warning', reason: 'Valeur possible mais non reconnue — à vérifier' };
  }
  return { status: 'mistake', reason: 'Attendu: ' + rules.map(_ruleSummary).join(', ou ') };
}

/* Verrouille et re-verrouille une quittance : la marque comme vérifiée */
function guardianMarkVerified(entry) {
  if (GUARDIAN_VERIFIED.indexOf(entry.type + ':' + entry.montant) === -1) {
    GUARDIAN_VERIFIED.push(entry.type + ':' + entry.montant);
  }
  try { localStorage.setItem('quittance_guardian_verified', JSON.stringify(GUARDIAN_VERIFIED)); } catch (e) {}
}

function guardianLoadVerified() {
  try {
    var raw = localStorage.getItem('quittance_guardian_verified');
    if (raw) GUARDIAN_VERIFIED = JSON.parse(raw) || [];
  } catch (e) { GUARDIAN_VERIFIED = []; }
}

/* Fait un tri / rendu des warnings : chaque warning peut être marqué correct ou corrigé */
function guardianComputeStats() {
  var stats = { correct: 0, warning: 0, mistake: 0 };
  for (var i = 0; i < entries.length; i++) stats[classifyEntry(entries[i]).status]++;
  return stats;
}

/* Rafraîchit la couleur du bouton review selon les stats (VIP uniquement) */
function guardianRefreshButton() {
  if (document.body.classList.contains('no-key')) return;
  var btn = document.getElementById('guardian-btn');
  if (!btn) return;
  var s = guardianComputeStats();
  btn.classList.remove('status-correct', 'status-warning', 'status-mistake');
  btn.setAttribute('data-correct', s.correct);
  btn.setAttribute('data-warning', s.warning);
  btn.setAttribute('data-mistake', s.mistake);
  if (s.mistake > 0) {
    btn.classList.add('status-mistake');
    btn.title = 'Mistakes: ' + s.mistake + ' · Warnings: ' + s.warning + ' · OK: ' + s.correct;
  } else if (s.warning > 0) {
    btn.classList.add('status-warning');
    btn.title = 'Warnings: ' + s.warning + ' · OK: ' + s.correct;
  } else {
    btn.classList.add('status-correct');
    btn.title = 'Tout est correct (' + s.correct + ')';
  }
}

/* --- Rendering dans le modal --- */
var guardianActiveTab = 'correct';

function guardianOpenModal() {
  guardianLoadVerified();
  document.getElementById('guardian-modal').classList.add('open');
  guardianRender();
}

function guardianCloseModal() {
  document.getElementById('guardian-modal').classList.remove('open');
}

function guardianSwitchTab(tab) {
  guardianActiveTab = tab;
  guardianRender();
}

function _guardianRow(entry, status, actions) {
  var icon =
    status === 'correct' ? '<i class="ti ti-circle-check g-row-icon g-row-icon-correct"></i>'
    : status === 'warning' ? '<i class="ti ti-alert-triangle g-row-icon g-row-icon-warning"></i>'
    : '<i class="ti ti-alert-circle g-row-icon g-row-icon-mistake"></i>';
  var badge =
    status === 'correct' ? '<span class="g-badge g-correct">Correct</span>'
    : status === 'warning' ? '<span class="g-badge g-warning">À vérifier</span>'
    : '<span class="g-badge g-mistake">Erreur</span>';
  var cls = status === 'correct' ? 'g-correct' : status === 'warning' ? 'g-warning' : 'g-mistake';
  return '<div class="guardian-row ' + cls + '">' +
    icon +
    '<span class="guardian-num">N° <b>' + entry.n + '</b></span>' +
    '<span class="guardian-type">' + escHtml(entry.type) + '</span>' +
    '<span class="guardian-amount">' + escHtml(String(entry.montant)) + ' <small>dh</small></span>' +
    badge +
    '<span class="guardian-reason g-reason-' + status + '">' + escHtml(classifyEntry(entry).reason) + '</span>' +
    (actions || '') +
  '</div>';
}

function _guardianEmpty() {
  var msg = {
    correct: 'Aucune quittance correcte.',
    warning: 'Aucune valeur à vérifier. Tout est reconnu.',
    mistake: 'Aucune erreur détectée. Bravo !'
  }[guardianActiveTab] || 'Aucune entrée.';
  return '<div class="guardian-empty">' +
    '<i class="ti ti-shield-check" aria-hidden="true"></i>' +
    '<div>' + msg + '</div>' +
  '</div>';
}

function guardianRender() {
  var list = document.getElementById('guardian-list');
  var st = guardianComputeStats();
  var rows = '';

  var tabs = document.querySelectorAll('.guardian-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === guardianActiveTab);
  }

  var badgeCorrect = document.getElementById('g-count-correct');
  var badgeWarning = document.getElementById('g-count-warning');
  var badgeMistake = document.getElementById('g-count-mistake');
  if (badgeCorrect) badgeCorrect.textContent = st.correct;
  if (badgeWarning) badgeWarning.textContent = st.warning;
  if (badgeMistake) badgeMistake.textContent = st.mistake;

  for (var i = 0; i < entries.length; i++) {
    var s = classifyEntry(entries[i]).status;
    if (s !== guardianActiveTab) continue;
    var actions = '';
    if (s === 'warning') {
      actions = '<div class="guardian-actions">' +
        '<button class="g-btn g-btn-confirm" onclick="guardianVerify(' + entries[i].n + ')">C\'est correct</button>' +
        '<button class="g-btn g-btn-fix" onclick="guardianFix(' + entries[i].n + ')">Corriger…</button>' +
        '</div>';
    } else if (s === 'mistake') {
      actions = '<div class="guardian-actions">' +
        '<button class="g-btn g-btn-fix" onclick="guardianFix(' + entries[i].n + ')">Corriger…</button>' +
        '</div>';
    }
    rows += _guardianRow(entries[i], s, actions);
  }

  if (!rows) rows = _guardianEmpty();

  list.innerHTML = rows;

  var ft = document.getElementById('guardian-footer-total');
  if (ft) {
    var sum = 0;
    for (var k = 0; k < entries.length; k++) sum += entries[k].montant;
    ft.innerHTML = '<i class="ti ti-clipboard-list" aria-hidden="true"></i> ' +
      entries.length + ' quittance' + (entries.length > 1 ? 's' : '') +
      ' analysée' + (entries.length > 1 ? 's' : '') + ' · ' +
      '<b>' + guardianFmt(sum) + '</b> dh';
  }

  guardianRefreshButton();
}

function guardianFmt(n) {
  var neg = n < 0;
  var s = Math.abs(n).toFixed(1).replace(/\.0$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '-' : '') + s;
}

/* --- Actions --- */
function guardianVerify(n) {
  var idx = -1;
  for (var i = 0; i < entries.length; i++) if (entries[i].n == n) idx = i;
  if (idx < 0) return;
  guardianMarkVerified(entries[idx]);
  guardianRender();
}

/* --- Correction : modal dédié --- */
var guardianFixN = null;

function guardianFix(n) {
  var idx = -1;
  for (var i = 0; i < entries.length; i++) if (entries[i].n == n) idx = i;
  if (idx < 0) return;

  guardianFixN = n;
  var e = entries[idx];

  document.getElementById('guardian-fix-target').innerHTML =
    '<span class="fix-chip fix-chip-num">N° ' + e.n + '</span>' +
    '<span class="fix-chip fix-chip-type">' + escHtml(e.type) + '</span>' +
    '<span class="fix-chip fix-chip-old">' + escHtml(String(e.montant)) + ' dh</span>' +
    '<i class="ti ti-arrow-right fix-chip-arrow"></i>' +
    '<span class="fix-chip fix-chip-new" id="fix-chip-new">?</span>';

  var input = document.getElementById('guardian-fix-input');
  input.value = '';
  guardianFixClearError();

  document.getElementById('guardian-fix-error').textContent = '';
  document.getElementById('guardian-fix-modal').classList.add('open');
  setTimeout(function() { input.focus(); }, 50);
}

function guardianFixClearError() {
  document.getElementById('guardian-fix-error').textContent = '';
  document.getElementById('guardian-fix-input').classList.remove('fix-input-error');
}

function guardianFixCancel() {
  document.getElementById('guardian-fix-modal').classList.remove('open');
  guardianFixN = null;
}

function guardianFixConfirm() {
  if (guardianFixN === null) return;
  var idx = -1;
  for (var i = 0; i < entries.length; i++) if (entries[i].n == guardianFixN) idx = i;
  if (idx < 0) { guardianFixCancel(); return; }

  var input = document.getElementById('guardian-fix-input');
  var raw = input.value.trim();
  if (!raw) {
    guardianFixShowError('Veuillez saisir un montant.');
    return;
  }
  var newVal = parseFloat(String(raw).replace(',', '.'));
  if (isNaN(newVal) || newVal <= 0) {
    guardianFixShowError('Montant invalide. Entrez un nombre positif (ex. 75 ou 187,5).');
    return;
  }

  entries[idx] = { n: entries[idx].n, type: entries[idx].type, montant: newVal };
  saveState();
  render();
  guardianFixCancel();
  guardianRender();
}

function guardianFixShowError(msg) {
  document.getElementById('guardian-fix-error').textContent = msg;
  document.getElementById('guardian-fix-input').classList.add('fix-input-error');
}

/* --- Init hooks --- */
function guardianInit() {
  guardianLoadVerified();

  /* Feature VIP uniquement : sans clé valide, rien n'est branché */
  if (document.body.classList.contains('no-key')) return;

  /* Bouton review : ouvrir le modal */
  var btn = document.getElementById('guardian-btn');
  if (btn) btn.addEventListener('click', guardianOpenModal);
  /* Fermer overlay */
  var ov = document.getElementById('guardian-modal');
  if (ov) ov.addEventListener('click', function(e) { if (e.target === this) guardianCloseModal(); });
  /* Modal de correction : fermeture backdrop + raccourcis */
  var fixOv = document.getElementById('guardian-fix-modal');
  var fixIn = document.getElementById('guardian-fix-input');
  if (fixOv) fixOv.addEventListener('click', function(e) { if (e.target === this) guardianFixCancel(); });
  if (fixIn) {
    fixIn.addEventListener('input', function() {
      guardianFixClearError();
      var chip = document.getElementById('fix-chip-new');
      var raw = fixIn.value.trim().replace(',', '.');
      var v = parseFloat(raw);
      chip.textContent = (!isNaN(v) && v > 0) ? v + ' dh' : '?';
    });
    fixIn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); guardianFixConfirm(); }
      else if (e.key === 'Escape') { e.preventDefault(); guardianFixCancel(); }
    });
  }
  /* Échap ferme le modal principal */
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('guardian-fix-modal').classList.contains('open')) return;
    if (document.getElementById('guardian-modal').classList.contains('open')) guardianCloseModal();
  });
  /* Rafraîchir le bouton à chaque render */
  guardianRefreshButton();
}

document.addEventListener('DOMContentLoaded', guardianInit);