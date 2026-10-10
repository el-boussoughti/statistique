const fs = require('fs');
const path = require('path');
const assert = require('assert');
const G = global;

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond) {
  if (cond) { passed++; console.log('  PASS  ' + name); }
  else { failed++; failures.push(name); console.log('  FAIL  ' + name); }
}
function eq(name, got, want) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  ok(name + (g === w ? '' : '  [got ' + g + ', want ' + w + ']'), g === w);
}

const store = new Map();
G.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
};

if (!G.crypto) G.crypto = require('crypto').webcrypto;

const ctx2d = new Proxy({}, {
  get(t, k) { if (t[k] !== undefined) return t[k]; return () => {}; },
  set(t, k, v) { t[k] = v; return true; },
});

const elRegistry = new Map();
function makeEl(id) {
  const classes = new Set();
  const attrs = {};
  const listeners = {};
  const style = {};
  const back = { value: '', text: '' };
  const el = {
    id,
    innerHTML: '',
    placeholder: '',
    readOnly: false,
    title: '',
    disabled: false,
    type: 'text',
    selectionStart: 0,
    className: '',
    dataset: {},
    parentNode: null,
    offsetWidth: 0,
    style,
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, f) => { if (f === undefined) { if (classes.has(c)) classes.delete(c); else classes.add(c); } else if (f) classes.add(c); else classes.delete(c); },
      contains: c => classes.has(c),
    },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: k => (k in attrs ? attrs[k] : null),
    removeAttribute: k => { delete attrs[k]; },
    focus() {},
    blur() {},
    click() {},
    addEventListener(ev, fn) { (listeners[ev] || (listeners[ev] = [])).push(fn); },
    dispatch(ev, e) { (listeners[ev] || []).forEach(fn => fn(e || {})); },
    querySelector() { return makeEl('q:' + id); },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    contains() { return false; },
    closest() { return null; },
    getBoundingClientRect() { return { width: 200, height: 30, left: 0, top: 0, right: 200, bottom: 30 }; },
    scrollIntoView() {},
    appendChild(ch) { if (ch && typeof ch === 'object' && ch.innerHTML) this.innerHTML += ch.innerHTML; },
    removeChild() {},
    getContext() { return ctx2d; },
    _set: classes,
    _attrs: attrs,
    _listeners: listeners,
  };
  Object.defineProperty(el, 'value', { get: () => back.value, set: v => { back.value = String(v); }, enumerable: true });
  Object.defineProperty(el, 'textContent', { get: () => back.text, set: v => { back.text = String(v); }, enumerable: true });
  return el;
}
function el(id) {
  if (!elRegistry.has(id)) elRegistry.set(id, makeEl(id));
  return elRegistry.get(id);
}

const docLs = {};
G.document = {
  getElementById: el,
  querySelector: sel => el('sel:' + sel),
  querySelectorAll: () => [],
  createElement: tag => makeEl('made:' + tag),
  addEventListener(ev, fn) { (docLs[ev] || (docLs[ev] = [])).push(fn); },
  body: el('body'),
  documentElement: el('html'),
  activeElement: undefined,
};
function docEmit(ev, e) { (docLs[ev] || []).forEach(fn => { try { fn(e); } catch (err) {} }); }
function keyEv(k) { return { key: k, preventDefault() {}, stopPropagation() {}, target: null }; }

G.window = {
  addEventListener() {},
  removeEventListener() {},
  innerWidth: 1600,
  innerHeight: 900,
  matchMedia: () => ({ matches: false }),
  crypto: G.crypto,
};
G.getComputedStyle = () => ({ getPropertyValue: () => '' });
if (!G.URL.createObjectURL) G.URL.createObjectURL = () => 'blob:test';
if (!G.URL.revokeObjectURL) G.URL.revokeObjectURL = () => {};

const root = path.resolve(__dirname, '..');
const files = ['js/app.js', 'js/render.js', 'js/ui.js', 'js/azkar.js'];
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  (0, eval)(code);
}

function get(id) { return G.document.getElementById(id); }

function resetAll() {
  G.entries = [];
  G.nextN = null;
  G.editIndex = -1;
  G.editOriginalN = null;
  G.sortBy = null;
  G.sortAsc = true;
  G.pageSize = 15;
  G.currentPage = 1;
  G.showAll = false;
  G.fullscreen = false;
  G.graphicsFullscreen = false;
  G.searchQuery = '';
  G.autoTotale = { enabled: false, firstCount: 5 };
  G.applyKeyState(-1);
  get('inp-type').value = '';
  get('inp-montant').value = '';
  get('inp-search').value = '';
}

function fillInfo() {
  get('inp-operator').value = 'OPER';
  get('inp-service').value = 'SERV';
  get('inp-registre').value = 'R1';
  get('inp-quitt-du').value = '100';
  get('inp-date').value = '05/09/2026';
}

function setVip(vip) {
  G.applyKeyState(vip ? 0 : -1);
}

function flush() { return new Promise(r => setTimeout(r, 30)); }

function rowNs(html) {
  const re = /font-weight:500;">(\d+)<\/td>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(parseInt(m[1], 10));
  return out;
}

async function suiteSecurity() {
  console.log('\n== Security ==');

  eq('escHtml escapes <>', G.escHtml('<a b="c" d=\'e\'>'), '&lt;a b=&quot;c&quot; d=&#39;e&#39;&gt;');
  eq('escHtml null-safe', G.escHtml(null), '');
  ok('no plaintext keys (64 hex hashes only)', G.secretKeys.length >= 7 && G.secretKeys.every(k => /^[0-9a-f]{64}$/.test(k.hash)));
  eq('EXPORT_PASSWORD default', G.EXPORT_PASSWORD, 'CHR2026');

  eq('normalizeKey lowercases+trims', G.normalizeKey('  HAMZA  '), 'hamza');
  eq('sha256("abc") known digest', await G.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  eq('findSecretKey invalid -> -1', await G.findSecretKey('garbage'), -1);
  eq('findSecretKey empty -> -1', await G.findSecretKey(''), -1);
  ok('findKeyById valid id found', G.findKeyById('douae') >= 0);
  eq('findKeyById invalid -> -1', G.findKeyById('nope'), -1);

  resetAll();
  G.applyKeyState(G.findKeyById('douae'));
  eq('applyKeyState sets theme attr', get('html').getAttribute('data-keytheme'), 'love');
  eq('applyKeyState stores id', store.get('quittance_secret_key'), 'douae');
  ok('applyKeyState VIP removes no-key', !get('body')._set.has('no-key'));
  G.applyKeyState(-1);
  eq('applyKeyState(-1) removes theme', get('html').getAttribute('data-keytheme'), null);
  ok('applyKeyState(-1) adds no-key', get('body')._set.has('no-key'));
  eq('applyKeyState(-1) clears stored key', store.get('quittance_secret_key'), undefined);

  resetAll();
  fillInfo();
  G.entries = [{ n: 7, type: '<b>x</b><script>alert(1)</script>', montant: 40 }];
  G.render();
  const tbl = get('entries-container').innerHTML;
  ok('render escapes type (XSS)', tbl.includes('&lt;script&gt;') && !tbl.includes('<script>') && !tbl.includes('onerror'));
  ok('breakdown escapes type name', get('type-breakdown').innerHTML.includes('&lt;script&gt;'));
}

async function suiteCalculs() {
  console.log('\n== Calculs ==');
  resetAll();
  fillInfo();
  G.entries = [
    { n: 10, type: 'ANNUL', montant: 999 },
    { n: 9, type: 'C1', montant: 40 },
    { n: 8, type: 'C2', montant: 60 },
    { n: 7, type: 'ACC', montant: 80 },
    { n: 6, type: 'CML', montant: 100 },
    { n: 5, type: 'CMD', montant: 40 },
    { n: 4, type: 'RX', montant: 112.5 },
    { n: 3, type: 'LABO', montant: 187.5 },
    { n: 2, type: 'HOSP', montant: 550 },
    { n: 1, type: 'EXP', montant: 165 },
  ];
  const expectedSum = 40 + 60 + 80 + 100 + 40 + 112.5 + 187.5 + 550 + 165;
  G.render();
  eq('total excludes ANNUL', get('s-total').textContent, expectedSum.toFixed(2) + ' dh');
  eq('entry count', get('s-count').textContent, '10');
  eq('average', get('s-avg').textContent, (expectedSum / 9).toFixed(2) + ' dh');
  eq('updateQuittAu = max N', get('inp-quitt-au').value, '10');
  const bd = get('type-breakdown').innerHTML;
  ok('breakdown per type count', bd.includes('C1') && bd.includes('1 quittance'));
  ok('breakdown per type total', bd.includes('40.00 dh'));
  ok('breakdown includes ANNUL', bd.includes('ANNUL'));

  resetAll();
  eq('findMissingQuittances', G.findMissingQuittances(), []);

  resetAll();
  G.entries = G._sanitizeEntries([
    { n: 100, type: 'C1', montant: 1 }, { n: 98, type: 'C1', montant: 1 }, { n: 95, type: 'C1', montant: 1 },
  ]);
  eq('findMissingQuittances gaps', G.findMissingQuittances().join(','), '99,97,96');

  resetAll();
  fillInfo();
  G.nextN = null;
  get('inp-n').value = '393501';
  get('inp-type').value = 'C1';
  get('inp-montant').value = '40';
  G.addEntry();
  eq('addEntry adds entry', G.entries.length, 1);
  eq('nextN auto-increment', G.nextN, 393502);
  get('inp-type').value = 'C2';
  get('inp-montant').value = '60';
  G.addEntry();
  eq('second addEntry auto-N', G.entries[0].n, 393502);
  eq('nextN after second', G.nextN, 393503);
  get('inp-n').value = '393501';
  get('inp-type').value = 'C1';
  get('inp-montant').value = '40';
  G.addEntry();
  eq('duplicate N rejected', get('modal-msg').textContent, 'La quittance N° 393501 a déjà été ajoutée.');
  eq('duplicate did not add', G.entries.length, 2);
  get('inp-n').value = '393504';
  get('inp-montant').value = '0';
  G.addEntry();
  eq('zero montant rejected', get('modal-msg').textContent, 'Montant invalide.');
  get('inp-n').value = '393504';
  get('inp-montant').value = 'abc';
  G.addEntry();
  eq('NaN montant rejected', get('modal-msg').textContent, 'Montant invalide.');
  get('inp-operator').value = '';
  get('inp-type').value = 'C1';
  get('inp-montant').value = '40';
  G.addEntry();
  eq('missing operator blocked', get('modal-msg').textContent, 'Champ obligatoire : Opérateur.');
  get('inp-operator').value = 'OPER';
  get('inp-n').value = '600';
  G.nextN = 599;
  G.addEntry();
  eq('N differs -> confirm shown', get('modal-msg').textContent.indexOf('le numéro auto était 599') > -1, true);
  get('modal-confirm').onclick();
  ok('confirm path adds N 600', G.entries.some(e => e.n === 600));
  eq('nextN stays at max (never recedes)', G.nextN, 393503);

  resetAll();
  fillInfo();
  G.entries = [{ n: 5, type: 'C1', montant: 40 }, { n: 3, type: 'C2', montant: 60 }];
  G.nextN = 6;
  G.deleteEntry(0);
  get('modal-confirm').onclick();
  eq('delete keeps other', G.entries.length, 1);
  eq('delete resyncs nextN', G.nextN, 4);

  resetAll();
  fillInfo();
  G.entries = [{ n: 5, type: 'C1', montant: 40 }];
  G.nextN = 6;
  G.annulerEntry(0);
  get('modal-confirm').onclick();
  eq('annuler sets ANNUL', G.entries[0].type, 'ANNUL');
  G.render();
  eq('ANNUL excluded from total', get('s-total').textContent, '0.00 dh');
}

async function suiteAutoTotale() {
  console.log('\n== Auto totale ==');
  resetAll();
  setVip(true);
  fillInfo();
  G.entries = [
    { n: 7, type: 'ANNUL', montant: 999 },
    { n: 6, type: 'LABO', montant: 60 },
    { n: 5, type: 'C1', montant: 50 },
    { n: 4, type: 'C1', montant: 40 },
    { n: 3, type: 'C1', montant: 30 },
    { n: 2, type: 'C1', montant: 20 },
    { n: 1, type: 'C1', montant: 10 },
  ];
  G.fullscreen = true;
  G.showAll = true;
  G.autoTotale = { enabled: true, firstCount: 2 };
  G.render();
  let html = get('entries-container').innerHTML;
  ok('page1 total row', html.includes('Total page 1'));
  ok('page1 exclusive sum', html.includes('Cette page : <b>30.00 dh</b>'));
  ok('page2 total row', html.includes('Total page 2'));
  ok('page2 exclusive sum (ANNUL=0)', html.includes('Cette page : <b>180.00 dh</b>'));
  ok('page2 running total', html.includes('Précédente : <b>30.00 dh</b>'));
  ok('page2 cumulative sum', html.includes('>210.00 dh'));
  eq('auto-totale total in stats', get('s-total').textContent, '210.00 dh');

  get('inp-search').value = 'LABO';
  G.searchQuery = 'labo';
  G.render();
  html = get('entries-container').innerHTML;
  ok('search filters to LABO only', html.indexOf('LABO') > -1 && html.indexOf('>C1<') === -1);

  get('inp-search').value = '';
  G.searchQuery = '';
  G.sortBy = null;
  G.sortEntries('montant');
  ok('sort blocked in fullscreen+auto', G.sortBy === null && get('toast-container').innerHTML.indexOf('Tri bloqué') > -1);
  G.resetSort();
  ok('resetSort blocked too', G.sortBy === null);
  G.fullscreen = false;
  G.showAll = false;
  G.autoTotale = { enabled: false, firstCount: 5 };
  setVip(false);
}

async function suiteTriPagination() {
  console.log('\n== Tri / pagination / recherche ==');
  resetAll();
  fillInfo();
  const entries = [];
  for (let n = 1; n <= 40; n++) entries.push({ n: n, type: n % 2 ? 'C1' : 'C2', montant: n % 2 ? 40 : 60 });
  G.entries = entries;
  G.render();
  ok('pagination shown with count', get('pagination').innerHTML.includes('40 entrées'));
  G.goPage(2);
  eq('goPage moves page', G.currentPage, 2);
  ok('page 2 active', get('pagination').innerHTML.includes('class="active">2'));
  G.goPage(3);
  ok('last page few rows', (get('entries-container').innerHTML.match(/<tr>/g) || []).length === 10);

  resetAll();
  fillInfo();
  G.entries = [
    { n: 1, type: 'C1', montant: 40 },
    { n: 3, type: 'C1', montant: 40 },
    { n: 2, type: 'C2', montant: 60 },
  ];
  G.render();
  G.sortEntries('montant');
  eq('sort asc by montant', rowNs(get('entries-container').innerHTML), [1, 3, 2]);
  G.sortEntries('montant');
  eq('sort desc by montant', rowNs(get('entries-container').innerHTML), [2, 1, 3]);
  G.sortEntries('n');
  eq('sort by n (first: desc like registre)', rowNs(get('entries-container').innerHTML), [3, 2, 1]);
  G.sortEntries('n');
  eq('sort by n (second: asc)', rowNs(get('entries-container').innerHTML), [1, 2, 3]);
  G.resetSort();
  G.sortBy = null;
}

async function suiteNouvelleSession() {
  console.log('\n== Nouvelle session ==');
  resetAll();
  fillInfo();
  G.entries = [{ n: 900, type: 'C1', montant: 40 }];
  G.nextN = 901;
  G.openClearSessionModal();
  eq('modal opens, all empty except date', get('cm-operator').value === '' && get('cm-quitt-du').value === '', true);
  get('cm-operator').value = 'OP';
  get('cm-service').value = 'SERV';
  get('cm-registre').value = 'R5';
  get('cm-quitt-du').value = '';
  get('clear-modal-confirm').dispatch('click');
  eq('empty quitt-du blocked', get('modal-msg').textContent, 'Champ obligatoire : Quittances N° Du.');
  get('cm-quitt-du').value = '500';
  get('clear-modal-confirm').dispatch('click');
  eq('new session clears entries', G.entries.length, 0);
  eq('new session sets nextN = Du', G.nextN, 500);
  eq('new session fills sidebar', get('inp-quitt-du').value, '500');
  eq('new session writes operator', get('inp-operator').value, 'OP');
  eq('new session disables auto totale', G.autoTotale.enabled, false);
}

async function suiteStockage() {
  console.log('\n== Stockage (données corrompues / inattendues) ==');
  resetAll();
  store.clear();
  store.set('quittances_data', '{oops');
  eq('corrupt JSON tolerated', G.loadState(), false);
  eq('corrupt JSON -> empty entries', G.entries.length, 0);

  resetAll();
  store.clear();
  store.set('quittances_data', JSON.stringify({
    entries: [
      { n: 5, type: 'C1', montant: 40 },
      { n: 'x', type: 'C1', montant: 40 },
      { n: 6, type: null, montant: 40 },
      { n: 7, type: 'C2', montant: '60' },
      { n: 8, type: '<b>x</b>', montant: 40 },
      { n: 9, type: 'C3', montant: NaN },
      { n: 10, type: 'C1', montant: -40 },
      { n: 11, type: '', montant: 40 },
      { n: 12, type: 'LABO', montant: 5 },
    ],
    nextN: 500,
  }));
  G.loadState();
  eq('sanitizes entries', G.entries.length, 4);
  eq('sanitized sorted desc + coerced montant',
    JSON.stringify(G.entries.map(e => [e.n, e.type, e.montant])),
    JSON.stringify([[12, 'PEXT', 5], [8, '<b>x</b>', 40], [7, 'CONS', 60], [5, 'CONS', 40]]));
  eq('nextN kept when valid', G.nextN, 500);

  resetAll();
  store.clear();
  store.set('quittances_data', JSON.stringify({ entries: [{ n: 10, type: 'C1', montant: 40 }], nextN: 3 }));
  G.loadState();
  eq('nextN self-heals when stale low', G.nextN, 11);

  resetAll();
  store.clear();
  store.set('quittances_data', JSON.stringify({ entries: {}, nextN: 'zzz' }));
  G.loadState();
  eq('entries object garbage -> []', G.entries.length, 0);
  eq('nextN garbage -> null', G.nextN, null);

  resetAll();
  G.entries = [{ n: 5, type: 'C1', montant: 40 }, { n: 6, type: 'ANNUL', montant: 40 }, { n: 7, type: 'C2', montant: 60 }];
  G.nextN = 8;
  G.saveState();
  const round = JSON.parse(store.get('quittances_data'));
  eq('saveState persists entries', round.entries.length, 3);
  eq('saveState persists nextN', round.nextN, 8);
  resetAll();
  G.loadState();
  eq('loadState restores entries count', G.entries.length, 3);
  eq('loadState restores nextN', G.nextN, 8);
}

async function suiteDonneesInattendues() {
  console.log('\n== Données inattendues (render) ==');
  resetAll();
  fillInfo();
  G.entries = [
    { n: 1, type: 'C1', montant: 40 },
    { n: 2, type: 'C1', montant: -40 },
    { n: 3, type: 'C1', montant: 1e9 },
    { n: 4, type: 'c1', montant: 40 },
    { n: 5, type: 'ANNUL', montant: 0 },
  ];
  G.render();
  eq('negative montant renders', get('entries-container').innerHTML.includes('-40.00'), true);
  eq('huge montant renders', get('s-total').textContent, '1000000040.00 dh');
  ok('lowercase type escapes fine', get('entries-container').innerHTML.includes('c1'));
}

async function suiteGrandesDonnees() {
  console.log('\n== Grandes données (10 000) ==');
  const types = [];
  for (let i = 0; i < 500; i++) { types.push(['C1', 40]); types.push(['C2', 60]); types.push(['CML', 100]); types.push(['CMD', 40]); types.push(['ACC', 160]); }
  for (let i = 0; i < 300; i++) { types.push(['RX', 165]); types.push(['LABO', 187.5]); types.push(['HOSP', 550]); types.push(['EXP', 2700]); }
  for (let i = 0; i < 150; i++) { types.push(['LABO', 123]); types.push(['EXP', 75]); }
  for (let i = 0; i < 100; i++) { types.push(['RX', 40]); }
  for (let i = 0; i < 100; i++) { types.push(['C1', 41]); types.push(['C2', 61]); types.push(['ACC', 73]); types.push(['CML', 44]); types.push(['CMD', 39]); }
  const entries = types.map((t, i) => ({ n: i + 1, type: t[0], montant: t[1] }));

  resetAll();
  G.entries = entries;
  const expectedTotal = entries.reduce((s, e) => (e.type === 'ANNUL' ? s : s + e.montant), 0);
  G.currentPage = 1;
  G.showAll = false;
  G.render();
  eq('large: paginated total exact', get('s-total').textContent, expectedTotal.toFixed(2) + ' dh');
  let t0 = performance.now();
  G.showAll = true;
  G.fullscreen = true;
  G.render();
  const renderMs = performance.now() - t0;
  ok('large: fullscreen render ok (<5000ms, got ' + renderMs.toFixed(0) + 'ms)', renderMs < 5000);
  ok('large: all rows rendered', (get('entries-container').innerHTML.match(/<tr>/g) || []).length === 4600);

  resetAll();
  G.entries = entries;
  G.nextN = entries[0].n + 1;
  G.saveState();
  G.entries = [];
  resetAll();
  G.loadState();
  eq('large: save/load roundtrip count', G.entries.length, 4600);

  const extra = [];
  for (let i = 0; i < 5400; i++) extra.push({ n: (i % 4600) + 4601, type: entries[i % 4600].type, montant: entries[i % 4600].montant });
  const expanded = entries.concat(extra);
  G.entries = expanded;
  eq('10K pool size', expanded.length, 10000);
  t0 = performance.now();
  G.showAll = true;
  G.fullscreen = true;
  G.render();
  const ms2 = performance.now() - t0;
  ok('10 000 entries render fast (<2000ms, got ' + ms2.toFixed(0) + 'ms)', ms2 < 2000);
}

async function suiteAzkar() {
  console.log('\n== Azkar ==');
  ok('azkar list >= 14 entries', G.AZKAR_LIST.length >= 14);
  ok('all azkar are arabic strings', G.AZKAR_LIST.every(s => typeof s === 'string' && s.length > 5 && /[\u0600-\u06FF]/.test(s)));
  let last = -1; let okRandom = true;
  for (let i = 0; i < 60; i++) {
    const idx = G.AZKAR_LIST.indexOf(G._pickAzkar());
    if (idx === -1) okRandom = false;
    if (i > 0 && idx === last) okRandom = false;
    last = idx;
  }
  ok('pickAzkar never repeats consecutively', okRandom);
  G._azkarShowing = false;
  G._showAzkar();
  ok('showAzkar opens dialog', get('azkar-dialog')._set.has('open'));
  ok('showAzkar picks valid azkar', G.AZKAR_LIST.indexOf(get('azkar-ar').textContent) > -1);
  G._hideAzkar();
  ok('hideAzkar closes dialog', !get('azkar-dialog')._set.has('open'));
}

async function suiteExport() {
  console.log('\n== Export Excel ==');
  resetAll();
  fillInfo();
  G.entries = [{ n: 2, type: 'C1', montant: 40 }, { n: 1, type: 'ANNUL', montant: 999 }];

  let protectArgs = null;
  const cells = {};
  const ws = {
    getCell(r, c) {
      const key = typeof c === 'undefined' ? String(r) : String(r) + ':' + String(c);
      if (!cells[key]) cells[key] = { value: undefined, protection: null };
      return cells[key];
    },
    protect(...a) { protectArgs = a; },
  };
  G.ExcelJS = { Workbook: function () { return { worksheets: [ws], xlsx: { load: () => Promise.resolve(wb), writeBuffer: () => Promise.resolve(new Uint8Array([0])) } }; } };
  let wb = null;
  G.ExcelJS = { Workbook: function () { wb = { worksheets: [ws], xlsx: { load: () => Promise.resolve(wb), writeBuffer: () => Promise.resolve(new Uint8Array([0])) } }; return wb; } };

  G.exportExcel(true);
  await flush(); await flush();
  eq('export rows in ascending order', cells['2:1'].value, 1);
  eq('export header N', cells['1:1'].value, 'N°');
  eq('export service cell', cells['G6'].value, 'SERV');
  eq('export date cell', cells['H8'].value, '05/09/2026');
  eq('export operator cell', cells['G10'].value, 'OPER');
  eq('export total row', cells['20:8'].value, 40);
  ok('protection applied with EXPORT_PASSWORD', protectArgs && protectArgs[0] === 'CHR2026');
  ok('selectLockedCells disabled', protectArgs && protectArgs[1].selectLockedCells === false);
  ok('selectUnlockedCells disabled', protectArgs && protectArgs[1].selectUnlockedCells === false);

  protectArgs = null;
  G.exportExcel(false);
  await flush(); await flush();
  eq('no protection when protect=false', protectArgs, null);
}

(async function main() {
  resetAll();
  await suiteSecurity();
  await suiteCalculs();
  await suiteAutoTotale();
  await suiteTriPagination();
  await suiteNouvelleSession();
  await suiteStockage();
  await suiteDonneesInattendues();
  await suiteGrandesDonnees();
  await suiteAzkar();
  await suiteExport();

  (docLs['DOMContentLoaded'] || []).forEach(fn => { try { fn(); } catch (e) {} });
  console.log('\n========================================');
  console.log('Résultats : ' + passed + ' passés, ' + failed + ' échoués');
  if (failed) {
    console.log('Échecs :');
    failures.forEach(f => console.log('  - ' + f));
  }
  process.exit(failed ? 1 : 0);
})();
