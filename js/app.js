/* =====================================================
   app.js — State, storage & business logic
   ===================================================== */

var STORAGE_KEY = 'quittances_data';

/* Echappe les données avant interpolation dans l'HTML (anti-XSS) */
function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
var TEMPLATE_B64 = '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';

/* ---- State ---- */
var entries   = [];
var nextN     = null;
var editIndex = -1;
var editOriginalN = null;

var sortBy  = null;
var sortAsc = true;

var pageSize    = 15;
var currentPage = 1;
var showAll     = false;
var fullscreen         = false;
var graphicsFullscreen = false;

/* ---- Type definitions ---- */
var typeGroups = [
  { label: 'Montant fixe', items: [
    { value: 'CONS',  text: 'CONS',  hint: '40 / 60 / 100 dh' },
  ]},
  { label: 'Montant variable', items: [
    { value: 'PEXT',  text: 'PEXT',       hint: '' },
    { value: 'HOSP',  text: 'Hospitalisation', hint: '' },
    { value: 'ANNUL', text: 'Annulation', hint: '' },
  ]},
];

var fixedMontants = {};

var fixedOpts = {
  '4': { type: 'CONS', montant: 40  },
  '6': { type: 'CONS', montant: 60  },
  '1': { type: 'CONS', montant: 100 },
  '8': { type: 'HOSP', montant: 80  },
};

var typeKeys = { '1': 'CONS', '2': 'PEXT', '3': 'HOSP', '4': 'ANNUL' };

/* Anciens codes de type → nouveaux (migration des données existantes) */
var TYPE_MIGRATION = {
  C1: 'CONS', C2: 'CONS', CML: 'CONS', CMD: 'CONS',
  ACC: 'HOSP', RX: 'PEXT', EXP: 'PEXT', LABO: 'PEXT'
};

/* Filtrer/normaliser des entrées issues du stockage (données corrompues) */
function _sanitizeEntries(arr) {
  var out = [];
  if (!Array.isArray(arr)) return out;
  for (var i = 0; i < arr.length; i++) {
    var e = arr[i];
    if (!e || typeof e !== 'object') continue;
    var n = Math.floor(Number(e.n));
    var m = Number(e.montant);
    if (!isFinite(n) || n < 1) continue;
    if (typeof e.type !== 'string' || !e.type.trim()) continue;
    if (!isFinite(m) || m <= 0) continue;
    var t = e.type.trim();
    if (TYPE_MIGRATION[t]) t = TYPE_MIGRATION[t];
    out.push({ n: n, type: t, montant: m });
  }
  out.sort(function(a, b) { return b.n - a.n; });
  return out;
}

/* ---- Storage ---- */
function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var data = JSON.parse(saved);
      entries = _sanitizeEntries(data.entries || []);
      if (entries.length) {
        var maxN = entries[0].n + 1;
        nextN = (typeof data.nextN === 'number' && data.nextN >= maxN) ? data.nextN : maxN;
      } else {
        nextN = (typeof data.nextN === 'number' && data.nextN >= 1) ? data.nextN : null;
      }
      sortBy  = data.sortBy  !== undefined ? data.sortBy  : null;
      sortAsc = data.sortAsc !== undefined ? data.sortAsc : true;
      if (data.operator)  document.getElementById('inp-operator').value  = data.operator.toUpperCase();
      if (data.service)   document.getElementById('inp-service').value   = data.service.toUpperCase();
      if (data.date)      document.getElementById('inp-date').value      = data.date;
      if (data.registre)  document.getElementById('inp-registre').value  = data.registre;
      if (data.quittDu)   document.getElementById('inp-quitt-du').value  = data.quittDu;
      if (data.quittAu)   document.getElementById('inp-quitt-au').value  = data.quittAu;
      return true;
    }
  } catch (e) { /* ignore */ }
  entries = [];
  nextN   = null;
  return false;
}

function saveState() {
  var state = {
    entries:  entries,
    nextN:    nextN,
    sortBy:   sortBy,
    sortAsc:  sortAsc,
    operator: document.getElementById('inp-operator').value,
    service:  document.getElementById('inp-service').value,
    date:     document.getElementById('inp-date').value,
    registre: document.getElementById('inp-registre').value,
    quittDu:  document.getElementById('inp-quitt-du').value,
    quittAu:  document.getElementById('inp-quitt-au').value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSidebar() { saveState(); }

/* ---- Custom quick prices (per type) ---- */
var QUICK_PRICES_KEY = 'quittance_custom_prices';
var customPrices = {};

function loadCustomPrices() {
  try {
    var raw = localStorage.getItem(QUICK_PRICES_KEY);
    customPrices = raw ? JSON.parse(raw) : {};
  } catch (e) {
    customPrices = {};
  }
}

function saveCustomPrices() {
  try {
    localStorage.setItem(QUICK_PRICES_KEY, JSON.stringify(customPrices));
  } catch (e) { /* ignore */ }
}

loadCustomPrices();

/* ---- Page-totale (VIP) : total automatique par page du registre ----
   Premier pageSize pré-réglable, puis groupes de 5. */
var AUTO_TOTALE_KEY = 'quittance_auto_totale';
var autoTotale = { enabled: false, firstCount: 5 };

function loadAutoTotale() {
  try {
    var raw = localStorage.getItem(AUTO_TOTALE_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      autoTotale.enabled = !!d.enabled;
      autoTotale.firstCount =
        (d.firstCount >= 1 && d.firstCount <= 5) ? d.firstCount : 5;
    }
  } catch (e) { /* ignore */ }
}

function saveAutoTotale() {
  try {
    localStorage.setItem(AUTO_TOTALE_KEY, JSON.stringify(autoTotale));
  } catch (e) { /* ignore */ }
}

loadAutoTotale();

/* ---- Product secret keys ----
   Les clés ne sont PAS stockées en clair : seul un hash SHA-256
   (de la clé en minuscules) est embarqué. Impossible de retrouver
   la clé depuis le code source (F12).
   Pour ajouter une clé :
     1. choisissez une clé secrète (ex : 'ma-cle')
     2. calculez son SHA-256 en minuscules, ex dans la console :
        async h=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(h.trim().toLowerCase()))
            .then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))
        puis h('ma-cle')
     3. copiez le hash ci-dessous + id, operator, theme, anim, msg. */
var KEY_STORAGE    = 'quittance_secret_key';
var secretKeys     = [
  {
    id:       'hamza',                                         // identifiant interne (stocké en localStorage)
    hash:     'd9940f9d77ab60f49d3955e43f93026b0d2d2d5dd924d38868464b7862cdb951',
    operator: 'Hamza',
    theme:    'snake',
    anim:     'snake',
    msg:      'Fiiin a lhnach, Marhba bik !',
  },
  {
    id:       'douae',
    hash:     '4b7cf120a62dd74d6cadfbd7f078a069479b76c017d348a95a54444c29faeee6',
    operator: 'Douae',
    theme:    'love',
    anim:     'love',
    msg:      'Salam Ostada Douae, Marhba bik !',
  },
  /* ---- Thèmes Homme ---- */
  {
    id:       'riad',
    hash:     'd91d3db640487b66f08dd1d82d81b1ec7dc708a8971dbd6e854cddfed81b6b54',
    operator: 'Riad',
    theme:    'wolf',
    anim:     'wolf',
    msg:      'Bonjour Riad, Marhba bik !',
  },
  {
    id:       'sifeddine',
    hash:     '3c7e6480c3bfce90d42d27b6c6c38ce037ab4fd867e1838c1f919013a7e37ecd',
    operator: 'Sifeddine',
    theme:    'fire',
    anim:     'fire',
    msg:      'Bonjour Sifeddine, Marhba bik! Tfrej f Breaking Bad.',
  },
  {
    id:       'rachid',
    hash:     '2d4adb7cee13dc9df1b1ad9f3a60c495838e09fff4779ababc6ddc58d8314338',
    operator: 'Rachid',
    theme:    'cyber',
    anim:     'cyber',
    msg:      'Bonjour Rachid. Marhba bik !',
  },
  /* ---- Thèmes Fille ---- */
  {
    id:       'asmae',
    hash:     '75be56db79ade3165669121ee64d126e6ad0cd0de360e97be6a3f3aabb93017b',
    operator: 'Asmae',
    theme:    'unicorn',
    anim:     'unicorn',
    msg:      'Bonjour Asmae, Marhba bik !',
  },
  {
    id:       'sunflower',
    hash:     '9e6128b7804868af157c2c8efabe2aaab1651635b535c414682f60bbe60aee96',
    operator: 'Sunflower',
    theme:    'sunflower',
    anim:     'sunflower',
    msg:      'Rayonne, Marhba bik !',
  },
  {
    id:       'maha',
    hash:     'e278993d94bc265f6c6d75b4fddc68c0df9b34ee1c00fb1daec4a3c20b7f546d',
    operator: 'Maha',
    theme:    'bunny',
    anim:     'bunny',
    msg:      'Salam Maha l VIP, Marhba bik !',
    tier:     'promax',
  },
  {
    id:       'ismael',
    hash:     '10558b76786f4aa631cdda1ba7c9b1d94b95d598b9e9935671c1fb0a447f6f93',
    operator: 'Ismael',
    theme:    'rajae',
    anim:     'rajae',
    msg:      'Salam loay ! Marhba bik !',
  },
  /* Ajoutez d'autres clés ici (hash, pas la clé en clair) :
  {
    id:       'mon-id',
    hash:     '…sha256 hex de la clé en minuscules…',
    operator: 'Nom',
    theme:    'snake',   // ou 'love'
    anim:     'snake',   // ou 'love'
    msg:      'Message de bienvenue',
  },
  */
];
var curKeyIdx = -1;

function sha256Hex(val) {
  if (!window.crypto || !window.crypto.subtle) {
    return Promise.resolve('');
  }
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(val))
    .then(function(buf) {
      return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    });
}

function normalizeKey(val) {
  return String(val || '').trim().toLowerCase();
}

/* Async — retourne l'index de la clé dont le hash correspond (insensible à la casse) */
function findSecretKey(val) {
  var norm = normalizeKey(val);
  return sha256Hex(norm).then(function(hash) {
    for (var i = 0; i < secretKeys.length; i++) {
      if (secretKeys[i].hash === hash) return i;
    }
    return -1;
  });
}

function findKeyById(id) {
  for (var i = 0; i < secretKeys.length; i++) {
    if (secretKeys[i].id === id) return i;
  }
  return -1;
}

function applyKeyState(idx) {
  curKeyIdx = idx;
  var root = document.documentElement;
  var badge = document.querySelector('.topbar-vip');
  var badgeText = document.querySelector('.topbar-vip .topbar-vip-text');
  if (idx >= 0) {
    root.setAttribute('data-keytheme', secretKeys[idx].theme);
    document.body.classList.remove('no-key');
    var isPromax = secretKeys[idx].tier === 'promax';
    document.body.classList.toggle('vip-promax', isPromax);
    if (badge) {
      badge.classList.toggle('vip-promax', isPromax);
      badge.title = 'Compte VIP' + (isPromax ? ' Pro Max' : '') + ' — clé produit active';
      if (badgeText) badgeText.textContent = isPromax ? 'VIP Pro Max' : 'VIP';
    }
    try { localStorage.setItem(KEY_STORAGE, secretKeys[idx].id); } catch (e) {}
  } else {
    root.removeAttribute('data-keytheme');
    document.body.classList.add('no-key');
    document.body.classList.remove('vip-promax');
    if (badge) {
      badge.classList.remove('vip-promax');
      badge.title = 'Compte VIP — clé produit active';
      if (badgeText) badgeText.textContent = 'VIP';
    }
    try { localStorage.removeItem(KEY_STORAGE); } catch (e) {}
  }
}

/* ---- Helpers ---- */
function setToday() {
  var d   = new Date();
  var y   = d.getFullYear();
  var m   = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return day + '/' + m + '/' + y;
}

function stepN(delta) {
  var inp = document.getElementById('inp-n');
  var val = parseInt(inp.value) || 0;
  inp.value = Math.max(1, val + delta);
  checkNEdited();
}

function checkNEdited() {
  var inp  = document.getElementById('inp-n');
  var warn = document.getElementById('n-warning');
  if (nextN !== null && parseInt(inp.value) !== nextN) {
    warn.style.display = 'flex';
  } else {
    warn.style.display = 'none';
  }
}

function updateNField() {
  var inp  = document.getElementById('inp-n');
  var hint = document.getElementById('hint-msg');
  if (!inp || !hint) return;
  if (nextN === null) {
    inp.value       = '';
    inp.placeholder = '388061';
    hint.textContent = "Entrez le premier numéro — les suivants s'incrémenteront automatiquement.";
    document.getElementById('n-warning').style.display = 'none';
  } else {
    inp.value       = nextN;
    inp.placeholder = '';
    hint.innerHTML  = 'Prochain numéro automatique\u202f: <strong style="color:var(--accent)">' + nextN + '</strong>. Vous pouvez modifier si nécessaire.';
    checkNEdited();
  }
}

/* ---- CRUD ---- */
function missingRequiredField() {
  var fields = [
    { id: 'inp-operator', label: 'Opérateur' },
    { id: 'inp-service',  label: 'Service' },
    { id: 'inp-date',     label: 'Date' },
    { id: 'inp-registre', label: 'Registre N°' },
    { id: 'inp-quitt-du', label: 'Quittances N° Du' }
  ];
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i].id);
    if (!el || !el.value.trim()) return fields[i];
  }
  return null;
}

function addEntry() {
  var type    = document.getElementById('inp-type').value.trim();
  var montant = parseFloat(document.getElementById('inp-montant').value.replace(',', '.'));
  var n       = parseInt(document.getElementById('inp-n').value);

  var miss = missingRequiredField();
  if (miss) {
    showModal('Champ obligatoire : ' + miss.label + '.');
    document.getElementById(miss.id).focus();
    return;
  }

  if (!type)                          { showModal('Choisissez ou tapez un type.'); return; }
  if (isNaN(montant) || montant <= 0) { showModal('Montant invalide.'); return; }
  if (!n || n < 1)                    { showModal(nextN === null ? 'Entrez le premier numéro de quittance.' : 'Entrez un numéro de quittance valide.'); return; }

  var isDuplicate = false;
  for (var j = 0; j < entries.length; j++) {
    if (entries[j].n === n && j !== editIndex) {
      isDuplicate = true;
      break;
    }
  }
  if (isDuplicate) {
    showModal('La quittance N° ' + n + ' a déjà été ajoutée.');
    return;
  }

  /* Edit mode — N differs from original */
  if (editIndex >= 0 && n !== editOriginalN) {
    showModal(
      'Attention\u202f: le numéro de quittance a été modifié de ' + editOriginalN + ' à ' + n + '. Confirmer\u202f?',
      function() {
        entries[editIndex] = { n: n, type: type, montant: montant };
        entries.sort(function(a, b) { return b.n - a.n; });
        if (entries.length > 0) nextN = Math.max(nextN || 0, entries[0].n + 1);
        cancelEdit();
        saveState();
        render();
        document.getElementById('inp-type').focus();
      }
    );
    return;
  }

  /* Add mode — N differs from auto */
  if (editIndex < 0 && nextN !== null && n !== nextN) {
    showModal(
      'Attention\u202f: le numéro auto était ' + nextN + ', vous avez saisi ' + n + '. Confirmer\u202f?',
      function() {
        entries.unshift({ n: n, type: type, montant: montant });
        entries.sort(function(a, b) { return b.n - a.n; });
        nextN = Math.max(nextN || 0, entries[0].n + 1);
        _clearForm();
        saveState();
        render();
        document.getElementById('inp-type').focus();
      }
    );
    return;
  }

  /* Normal path */
  if (editIndex >= 0) {
    entries[editIndex] = { n: n, type: type, montant: montant };
    cancelEdit();
  } else {
    entries.unshift({ n: n, type: type, montant: montant });
  }

  // Auto-sort descending by N
  entries.sort(function(a, b) {
    return b.n - a.n;
  });
  
  if (entries.length > 0) {
    nextN = Math.max(nextN || 0, entries[0].n + 1);
  }
  
  if (editIndex < 0) {
    _clearForm();
  }

  saveState();
  render();
  document.getElementById('inp-type').focus();
}

function findMissingQuittances() {
  if (entries.length < 2) return [];
  var missing = [];
  // entries are sorted descending (highest first)
  for (var i = 0; i < entries.length - 1; i++) {
    var curr = entries[i].n;
    var next = entries[i + 1].n;
    if (curr - next > 1) {
      for (var m = curr - 1; m > next; m--) {
        missing.push(m);
      }
    }
  }
  return missing; // returns descending order
}

function _clearForm() {
  document.getElementById('inp-type').value    = '';
  document.getElementById('inp-montant').value = '';
  updateNField();
}

function editEntry(i) {
  var e = entries[i];
  editIndex     = i;
  editOriginalN = e.n;
  document.getElementById('inp-n').value       = e.n;
  document.getElementById('inp-type').value    = e.type;
  document.getElementById('inp-montant').value = e.montant;
  var btn = document.getElementById('btn-submit');
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> <span>Enregistrer</span>';
  document.getElementById('btn-cancel').style.display = 'inline-flex';
  document.getElementById('inp-type').focus();
}

function cancelEdit() {
  editIndex     = -1;
  editOriginalN = null;
  document.getElementById('inp-type').value    = '';
  document.getElementById('inp-montant').value = '';
  var btn = document.getElementById('btn-submit');
  btn.innerHTML = '<i class="ti ti-plus"></i> <span>Ajouter</span>';
  document.getElementById('btn-cancel').style.display = 'none';
  updateNField();
}

var searchQuery = '';

function onSearchChange() {
  var inp = document.getElementById('inp-search');
  var clearBtn = document.getElementById('search-clear-btn');
  if (inp) {
    searchQuery = inp.value.trim().toLowerCase();
    if (clearBtn) {
      clearBtn.style.display = searchQuery ? 'inline-block' : 'none';
    }
    render();
  }
}

function clearSearch() {
  var inp = document.getElementById('inp-search');
  var clearBtn = document.getElementById('search-clear-btn');
  if (inp) {
    inp.value = '';
    searchQuery = '';
    if (clearBtn) clearBtn.style.display = 'none';
    render();
  }
}

function deleteEntry(i) {
  // Since we have search/filter, `i` passed from render is the index in the *filtered* list, not the global `entries`!
  // Wait, I need to look at how `render()` generates the index `i`.
  // Actually, I'll fix this in `render.js` by passing the real entry object or the real index.
  // Wait, I'll assume `i` is the index in the global `entries` array (we'll fix `render.js` next).
  
  var e = entries[i];
  showModal(
    'Supprimer la quittance N°' + e.n + ' (' + e.type + ', ' + e.montant.toFixed(2) + ' dh)\u202f?',
    function() {
      var deleted = entries.splice(i, 1)[0];
      
      // Auto-resync the input N° to the new maximum if the last quittance was deleted
      if (entries.length > 0) {
        nextN = entries[0].n + 1;
      } else {
        nextN = null;
        document.getElementById('inp-n').value = '';
      }
      updateNField();

      saveState();
      render();
      if (typeof showUndoToast === 'function') {
        showUndoToast(deleted);
      }
    }
  );
}

function annulerEntry(i) {
  var e = entries[i];
  if (e.type === 'ANNUL') return;
  showModal(
    'Annuler la quittance N°' + e.n + ' (' + e.type + ', ' + e.montant.toFixed(2) + ' dh) ?\nLe type sera changé en ANNUL.',
    function() {
      entries[i].type = 'ANNUL';
      saveState();
      render();
    }
  );
}

function addQuickEntry(type, montant) {
  var manualN = parseInt(document.getElementById('inp-n').value);
  var miss = missingRequiredField();
  if (miss) {
    showModal('Champ obligatoire : ' + miss.label + '.');
    document.getElementById(miss.id).focus();
    return;
  }
  if (!manualN || manualN < 1) {
    showModal('Entrez d\'abord un numéro de quittance manuellement.');
    return;
  }
  if (nextN === null) {
    nextN = manualN;
  }

  var n = manualN;

  var isDup = false;
  for (var k = 0; k < entries.length; k++) {
    if (entries[k].n === n) { isDup = true; break; }
  }
  if (isDup) {
    showModal('La quittance N° ' + n + ' a déjà été ajoutée.');
    return;
  }

  entries.unshift({ n: n, type: type, montant: montant });
  entries.sort(function(a, b) { return b.n - a.n; });
  nextN = Math.max(nextN || 0, entries[0].n + 1);
  document.getElementById('inp-n').value = '';
  updateNField();
  saveState();
  render();
}

function quickAdd(btn) {
  var type    = btn.getAttribute('data-type');
  var montant = parseFloat(btn.getAttribute('data-montant'));
  addQuickEntry(type, montant);
}

function resetN() {
  nextN = null;
  document.getElementById('inp-n').value = '';
  saveState();
  updateNField();
}

function clearAll() {
  openClearSessionModal();
}

/* ---- Sorting ---- */
function sortEntries(col) {
  if (autoTotale.enabled && fullscreen && !document.body.classList.contains('no-key')) {
    showToastMessage('Tri bloqué : Auto totale actif (ordre par N°)');
    return;
  }
  if (sortBy === col) {
    sortAsc = !sortAsc;
  } else {
    sortBy  = col;
    sortAsc = (col !== 'n');
  }
  saveState();
  currentPage = 1;
  render();
}

function resetSort() {
  if (autoTotale.enabled && fullscreen && !document.body.classList.contains('no-key')) {
    showToastMessage('Tri bloqué : Auto totale actif (ordre par N°)');
    return;
  }
  sortBy  = null;
  sortAsc = true;
  saveState();
  currentPage = 1;
  render();
}

function goPage(p) {
  currentPage = p;
  render();
}

/* ---- Fullscreen ---- */
function toggleFullscreen() {
  fullscreen         = !fullscreen;
  graphicsFullscreen = false;
  showAll            = fullscreen;
  currentPage        = 1;
  render();
}

function toggleGraphicsFullscreen() {
  graphicsFullscreen = !graphicsFullscreen;
  fullscreen         = false;
  showAll            = false;
  currentPage        = 1;
  render();
}

/* ---- Type dropdown logic ---- */
function onTypeChange() {
  var inp = document.getElementById('inp-type');
  var t   = inp.value.trim();
  var mi  = document.getElementById('inp-montant');

  var shortMap = { p: 'PEXT', h: 'HOSP', c: 'CONS' };
  var m = t.match(/^([phcPHC])(\d+)$/);
  if (m && shortMap[m[1].toLowerCase()]) {
    inp.value = shortMap[m[1].toLowerCase()];
    mi.value  = parseInt(m[2]);
    hideTypeDropdown();
    mi.focus();
    return;
  }

  if (fixedMontants[t] !== undefined) {
    mi.value = fixedMontants[t];
  } else {
    mi.value = '';
  }
}

/* ---- WhatsApp share ---- */
function shareWhatsApp() {
  var op       = document.getElementById('inp-operator').value  || '';
  var sv       = document.getElementById('inp-service').value   || '';
  var dt       = document.getElementById('inp-date').value      || '';
  var registre = document.getElementById('inp-registre').value  || '';
  var quittDu  = document.getElementById('inp-quitt-du').value  || '';
  var quittAu  = document.getElementById('inp-quitt-au').value  || '';

  var totalEntries = entries.length;
  var total = 0;
  var byType = {};
  for (var j = 0; j < totalEntries; j++) {
    if (entries[j].type !== 'ANNUL') total += entries[j].montant;
    if (!byType[entries[j].type]) byType[entries[j].type] = { count: 0, total: 0 };
    byType[entries[j].type].count++;
    byType[entries[j].type].total += entries[j].montant;
  }

  // Populate hidden table
  document.getElementById('wa-site').textContent     = sv;
  document.getElementById('wa-date').textContent     = dt;
  document.getElementById('wa-nom').textContent      = op;
  document.getElementById('wa-registre').textContent = registre;
  document.getElementById('wa-quitt-du').textContent = quittDu;
  document.getElementById('wa-quitt-au').textContent = quittAu;

  var types = ['cons', 'pext', 'hosp', 'annul'];
  for (var i = 0; i < types.length; i++) {
    var t = types[i].toUpperCase();
    var nbId = 'wa-nb-' + types[i];
    var mtId = 'wa-mt-' + types[i];
    
    var count = byType[t] ? byType[t].count : 0;
    var amount = byType[t] ? byType[t].total : 0;
    
    var tdNb = document.getElementById(nbId);
    var tdMt = document.getElementById(mtId);

    if (count === 0) {
      tdNb.textContent = '-';
      tdNb.style.textAlign = 'center';
    } else {
      tdNb.textContent = count;
      tdNb.style.textAlign = 'right'; // fallback if CSS doesn't apply
    }
    
    if (amount === 0) {
      tdMt.textContent = '-';
      tdMt.style.textAlign = 'center';
    } else {
      tdMt.textContent = amount.toFixed(2);
      tdMt.style.textAlign = 'right';
    }
  }
  
  var tdTotalNb = document.getElementById('wa-nb-total');
  var tdTotalMt = document.getElementById('wa-mt-total');
  if (totalEntries === 0) {
    tdTotalNb.textContent = '-';
    tdTotalNb.style.textAlign = 'center';
  } else {
    tdTotalNb.textContent = totalEntries;
    tdTotalNb.style.textAlign = 'right';
  }
  
  if (total === 0) {
    tdTotalMt.textContent = '-';
    tdTotalMt.style.textAlign = 'center';
  } else {
    tdTotalMt.textContent = total.toFixed(2);
    tdTotalMt.style.textAlign = 'right';
  }

  // Generate Image
  var target = document.getElementById('wa-export-content');
  html2canvas(target, { scale: 2 }).then(function(canvas) {
    canvas.toBlob(function(blob) {
      if (!blob) return;
      var file = new File([blob], 'statistiques.png', { type: 'image/png' });

      // Try native share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Statistiques',
          text: 'Voici les statistiques'
        }).catch(function(err) { console.log('Share failed', err); });
      } 
      // Fallback to clipboard + wa.me
      else {
        try {
          var item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(function() {
            showModal('L\'image a été copiée dans le presse-papiers.\n\nCollez-la directement dans la conversation WhatsApp.');
            setTimeout(function() {
              window.open('https://wa.me/', '_blank');
            }, 1500);
          }).catch(function(err) {
            showModal('Impossible de copier l\'image automatiquement.\nErreur: ' + err.message);
          });
        } catch (e) {
          showModal('Votre navigateur ne supporte pas le partage d\'image automatique.');
        }
      }
    }, 'image/png');
  });
}

/* ---- "Au" (dernière quittance saisie) : mis à jour auto à partir des entrées ---- */
function updateQuittAu() {
  var el = document.getElementById('inp-quitt-au');
  if (!el) return;
  var last = null;
  for (var i = 0; i < entries.length; i++) {
    if (!last || entries[i].n > last) last = entries[i].n;
  }
  var val = (last !== null) ? String(last) : '';
  if (el.value !== val) {
    el.value = val;
    if (typeof syncInfoCanonical === 'function') syncInfoCanonical();
  }
}

/* ---- Excel import/export ---- */
var EXPORT_PASSWORD = 'CHR2026'; /* mot de passe de protection du fichier exporté */

function exportExcel(protect) {
  if (protect === undefined) protect = true;
  var op       = document.getElementById('inp-operator').value  || '—';
  var sv       = document.getElementById('inp-service').value   || '—';
  var dt       = document.getElementById('inp-date').value      || '—';
  var registre = document.getElementById('inp-registre').value  || '';
  var quittDu  = document.getElementById('inp-quitt-du').value  || '';
  var quittAu  = document.getElementById('inp-quitt-au').value  || '';

  var totalEntries = entries.length;
  var total = 0;
  var byType = {};

  for (var j = 0; j < totalEntries; j++) {
    if (entries[j].type !== 'ANNUL') total += entries[j].montant;
    if (!byType[entries[j].type]) byType[entries[j].type] = { count: 0, total: 0 };
    byType[entries[j].type].count++;
    byType[entries[j].type].total += entries[j].montant;
  }

  var rev = entries.slice().reverse();

  /* Convert base64 template to ArrayBuffer for ExcelJS */
  var bStr = atob(TEMPLATE_B64);
  var bytes = new Uint8Array(bStr.length);
  for (var k = 0; k < bStr.length; k++) bytes[k] = bStr.charCodeAt(k);

  var wb = new ExcelJS.Workbook();
  wb.xlsx.load(bytes.buffer).then(function() {
    var ws = wb.worksheets[0];

    /* ── Colour palette (matches statistique.xlsx) ─────────────────── */
    var CLR_YELLOW  = 'FFFFFF00'; // header bg — same as type labels F17-F25
    var CLR_RED     = 'FFFF0000'; // ANNUL row  — same as F26/G26/H26
    var CLR_WHITE   = 'FFFFFFFF'; // odd data rows
    var CLR_BLUE    = 'FFDCE6F1'; // even data rows (alternating stripe)
    var CLR_RED_FG  = 'FFFFFFFF'; // white text on red rows

    /* ── Shared style builders ──────────────────────────────────────── */
    function mkFill(argb) {
      return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } };
    }
    function mkFont(bold, sz, argb) {
      var f = { name: 'Calibri', size: sz || 11, bold: !!bold };
      if (argb) f.color = { argb: argb };
      return f;
    }
    var thinBorder = { style: 'thin', color: { argb: 'FFAAAAAA' } };
    var thinBorderRed = { style: 'thin', color: { argb: 'FFCC0000' } };
    function mkBorder(side) {
      return { top: side, bottom: side, left: side, right: side };
    }
    var centerAlign = { horizontal: 'center', vertical: 'middle' };
    var moneyFmtInt = '[$-40C]#,##0';
    var moneyFmtDec = '[$-40C]#,##0.##';

    /* ── Style definitions ──────────────────────────────────────────── */
    var stHeader = {
      fill:      mkFill(CLR_YELLOW),
      font:      mkFont(true, 11),
      alignment: centerAlign,
      border:    mkBorder(thinBorder)
    };
    var stAnnul = {
      fill:      mkFill(CLR_RED),
      font:      mkFont(true, 11, CLR_RED_FG),
      alignment: centerAlign,
      border:    mkBorder(thinBorderRed)
    };
    var stOdd = {
      fill:      mkFill(CLR_WHITE),
      font:      mkFont(false, 11),
      alignment: centerAlign,
      border:    mkBorder(thinBorder)
    };
    var stEven = {
      fill:      mkFill(CLR_BLUE),
      font:      mkFont(false, 11),
      alignment: centerAlign,
      border:    mkBorder(thinBorder)
    };

    /* Helper: apply a style object to a cell */
    function applyStyle(cell, st) {
      if (st.fill)      cell.fill      = st.fill;
      if (st.font)      cell.font      = st.font;
      if (st.alignment) cell.alignment = st.alignment;
      if (st.border)    cell.border    = st.border;
    }

    /* Helper: write value + style to a cell (1-indexed row/col) */
    function sc(r, c, v, st) {
      var cell = ws.getCell(r, c);
      cell.value = v;
      if (st) applyStyle(cell, st);
    }

    /* ── Header row: A1 / B1 / C1 ─────────────────────────────────── */
    sc(1, 1, 'N°',      stHeader);
    sc(1, 2, 'Type',    stHeader);
    sc(1, 3, 'Montant', stHeader);

    /* ── Entry data rows: A-C, starting at row 2 ──────────────────── */
    for (var i = 0; i < rev.length; i++) {
      var excelRow = i + 2;
      var isAnnul  = rev[i].type === 'ANNUL';
      var st       = isAnnul ? stAnnul : (i % 2 === 0 ? stOdd : stEven);
      sc(excelRow, 1, rev[i].n,       st);
      sc(excelRow, 2, rev[i].type,    st);
      sc(excelRow, 3, rev[i].montant, st);
      ws.getCell(excelRow, 3).numFmt = Number.isInteger(rev[i].montant) ? moneyFmtInt : moneyFmtDec;
    }

    /* ── Template info cells (preserve existing fill — just set value) */
    ws.getCell('G6').value  = sv;        // Service
    ws.getCell('H8').value  = dt;        // Date
    ws.getCell('G10').value = op;        // Opérateur
    if (registre) ws.getCell('G12').value = registre;   // Registre N°
    if (quittDu)  ws.getCell('G14').value = quittDu;    // Quittances N° Du
    if (quittAu)  ws.getCell('I14').value = quittAu;    // Au

    /* ── Type statistics rows (Excel lines 17-19) ─────────────────── */
    var typeRowMap = {
      'CONS': 17, 'HOSP': 18, 'PEXT': 19
    };
    for (var t in byType) {
      var exRow = typeRowMap[t];
      if (exRow !== undefined) {
        ws.getCell(exRow, 7).value = byType[t].count;
        ws.getCell(exRow, 8).value = byType[t].total;
      }
    }

    /* ── Grand totals (Excel line 20) ─────────────────────────────── */
    ws.getCell(20, 7).value = totalEntries;
    ws.getCell(20, 8).value = total;

    /* ── Protection (optionnelle) : cellules verrouillées + feuille protégée par mot de passe ── */
    if (protect) {
      var lockToRow = Math.max(rev.length + 1, 20) + 2;
      for (var lr = 1; lr <= lockToRow; lr++) {
        for (var lc = 1; lc <= 12; lc++) {
          ws.getCell(lr, lc).protection = { locked: true, hidden: false };
        }
      }
      ws.protect(EXPORT_PASSWORD, { selectLockedCells: false, selectUnlockedCells: false });
    }

    /* ── Download ────────────────────────────────────────────────── */
    var dateStr = dt.replace(/\//g, '-');
    wb.xlsx.writeBuffer().then(function(buffer) {
      var blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      var url = URL.createObjectURL(blob);
      var a   = document.createElement('a');
      a.href     = url;
      a.download = 'quittances_' + dateStr + '.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

function importExcel(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb   = XLSX.read(e.target.result, { type: 'array' });
      var ws   = wb.Sheets[wb.SheetNames[0]];
      var data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      var added = 0;
      for (var i = 1; i < data.length; i++) {
        var row     = data[i];
        var n       = parseInt(row[0]);
        var type    = String(row[1] || '').trim();
        var montant = parseFloat(String(row[2] || '').replace(',', '.'));
        if (!n || !type || isNaN(montant) || montant <= 0) continue;
        entries.unshift({ n: n, type: type, montant: montant });
        added++;
      }
      if (added > 0) {
        nextN = entries[0].n + 1;
        updateNField();
        saveState();
        render();
        showModal(added + ' entr\u00e9es import\u00e9es avec succ\u00e8s.');
      } else {
        showModal('Aucune entr\u00e9e valide trouv\u00e9e dans le fichier.');
      }
    } catch (err) {
      showModal('Erreur lors de la lecture du fichier\u202f: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}
