/* =====================================================
   app.js — State, storage & business logic
   ===================================================== */

var STORAGE_KEY = 'quittances_data';

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
    { value: 'C1',   text: 'C1',             hint: '40 dh'  },
    { value: 'C2',   text: 'C2',             hint: '60 dh'  },
    { value: 'ACC',  text: 'ACC',            hint: '80 dh'  },
    { value: 'CML',  text: 'CML',            hint: '100 dh' },
    { value: 'CMAP', text: 'CMAP',           hint: '40 dh'  },
  ]},
  { label: 'Montant variable', items: [
    { value: 'RX',    text: 'RX',            hint: '' },
    { value: 'HOSP',  text: 'Hospitalisation', hint: '' },
    { value: 'LABO',  text: 'Labo',          hint: '' },
    { value: 'ANNUL', text: 'Annulation',    hint: '' },
  ]},
];

var fixedMontants = { C1: 40, C2: 60, ACC: 80, CML: 100, CMAP: 40 };

var fixedOpts = {
  '1': { type: 'C1',   montant: 40  },
  '2': { type: 'C2',   montant: 60  },
  '3': { type: 'ACC',  montant: 80  },
  '4': { type: 'CML',  montant: 100 },
  '5': { type: 'CMAP', montant: 40  },
};

var typeKeys = { '1': 'C1', '2': 'C2', '3': 'ACC', '4': 'CML', '5': 'CMAP' };

/* ---- Storage ---- */
function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var data = JSON.parse(saved);
      entries = data.entries || [];
      nextN   = data.nextN !== undefined ? data.nextN : null;
      sortBy  = data.sortBy  !== undefined ? data.sortBy  : null;
      sortAsc = data.sortAsc !== undefined ? data.sortAsc : true;
      if (data.operator) document.getElementById('inp-operator').value = data.operator;
      if (data.service)  document.getElementById('inp-service').value  = data.service;
      if (data.date)     document.getElementById('inp-date').value     = data.date;
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
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSidebar() { saveState(); }

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
    inp.placeholder = '101';
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
function addEntry() {
  var type    = document.getElementById('inp-type').value.trim();
  var montant = parseFloat(document.getElementById('inp-montant').value.replace(',', '.'));
  var n       = parseInt(document.getElementById('inp-n').value);

  if (!type)                          { showModal('Choisissez ou tapez un type.'); return; }
  if (isNaN(montant) || montant <= 0) { showModal('Montant invalide.'); return; }
  if (!n || n < 1)                    { showModal('Entrez un numéro de quittance valide.'); return; }

  /* Edit mode — N changed */
  if (editIndex >= 0 && editOriginalN !== null && n !== editOriginalN) {
    showModal(
      'Attention\u202f: le numéro de quittance a été modifié de ' + editOriginalN + ' à ' + n + '. Confirmer\u202f?',
      function() {
        entries[editIndex] = { n: n, type: type, montant: montant };
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
        nextN = n + 1;
        entries.unshift({ n: n, type: type, montant: montant });
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
    nextN = n + 1;
    entries.unshift({ n: n, type: type, montant: montant });
    _clearForm();
  }

  saveState();
  render();
  document.getElementById('inp-type').focus();
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

function deleteEntry(i) {
  var e = entries[i];
  showModal(
    'Supprimer la quittance N°' + e.n + ' (' + e.type + ', ' + e.montant.toFixed(2) + ' dh)\u202f?',
    function() {
      entries.splice(i, 1);
      saveState();
      render();
    }
  );
}

function quickAdd(btn) {
  var type    = btn.getAttribute('data-type');
  var montant = parseFloat(btn.getAttribute('data-montant'));
  var n       = nextN !== null ? nextN : (parseInt(document.getElementById('inp-n').value) || 1);
  entries.unshift({ n: n, type: type, montant: montant });
  nextN = n + 1;
  document.getElementById('inp-n').value = '';
  updateNField();
  saveState();
  render();
}

function resetN() {
  nextN = null;
  document.getElementById('inp-n').value = '';
  saveState();
  updateNField();
}

function clearAll() {
  showModal('Voulez-vous vraiment effacer toutes les entrées\u202f?', function() {
    entries = [];
    nextN   = null;
    document.getElementById('inp-n').value = '';
    saveState();
    updateNField();
    render();
  });
}

/* ---- Sorting ---- */
function sortEntries(col) {
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

  var shortMap = { r: 'RX', l: 'Labo', a: 'ANNUL', h: 'HOSP' };
  var m = t.match(/^([rlhaRLHA])(\d+)$/);
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

/* ---- Excel import/export ---- */
function exportExcel() {
  var op = document.getElementById('inp-operator').value || '—';
  var sv = document.getElementById('inp-service').value  || '—';
  var dt = document.getElementById('inp-date').value     || '—';

  var totalEntries = entries.length;
  var total = 0, countPaid = 0;
  var byType = {};

  for (var j = 0; j < totalEntries; j++) {
    if (entries[j].type !== 'ANNUL') { total += entries[j].montant; countPaid++; }
    if (!byType[entries[j].type]) byType[entries[j].type] = { count: 0, total: 0 };
    byType[entries[j].type].count++;
    byType[entries[j].type].total += entries[j].montant;
  }
  var avg = countPaid ? total / countPaid : null;

  var rev          = entries.slice().reverse();
  var entriesData  = [['N°', 'Type', 'Montant']];
  for (var i = 0; i < rev.length; i++) {
    entriesData.push([rev[i].n, rev[i].type, rev[i].montant]);
  }

  var right = [];
  right.push(['Rapport des quittances', '', '', '']);
  right.push([]);
  right.push(['Opérateur', op, 'Service', sv]);
  right.push(['Date', dt, '', '']);
  right.push([]);
  right.push(['Statistiques', '', '', '']);
  right.push(['Total quittances', totalEntries, '', '']);
  right.push(['Total montant', total.toFixed(2) + ' dh', 'Moyenne', avg !== null ? avg.toFixed(2) + ' dh' : '—']);
  right.push([]);
  right.push(['Par type', 'Nombre', 'Montant', '']);
  var typeKeys2 = Object.keys(byType);
  for (var t2 = 0; t2 < typeKeys2.length; t2++) {
    var tk = typeKeys2[t2];
    right.push([tk, byType[tk].count, byType[tk].total.toFixed(2) + ' dh', '']);
  }

  var maxRows = Math.max(entriesData.length, right.length);
  var data    = [];
  for (var r = 0; r < maxRows; r++) {
    var row = [];
    row = row.concat(r < entriesData.length ? entriesData[r] : ['', '', '']);
    row.push('');
    row = row.concat(r < right.length ? right[r] : ['', '', '', '']);
    data.push(row);
  }

  var ws  = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 4 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
  ];

  var range      = XLSX.utils.decode_range(ws['!ref']);
  var accentHex  = '7C3AED';
  var rightSections = { 0: 1, 5: 1, 9: 1 };

  for (var R = range.s.r; R <= range.e.r; R++) {
    for (var C = range.s.c; C <= range.e.c; C++) {
      var addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      var isRightSection  = R < right.length && rightSections[R] && C >= 4;
      var isEntriesHeader = R === 0 && C < 3;
      ws[addr].s = {
        font: {
          bold:  isRightSection || isEntriesHeader,
          color: (isRightSection || isEntriesHeader) ? { rgb: 'FFFFFF' } : undefined,
          sz: 11,
          name: 'Inter',
        },
        fill: (isRightSection || isEntriesHeader) ? { fgColor: { rgb: accentHex } } : undefined,
        alignment: { vertical: 'center', horizontal: C === 2 ? 'center' : 'left' },
        border: {
          top:    { style: 'thin', color: { rgb: 'E0E0EE' } },
          bottom: { style: 'thin', color: { rgb: 'E0E0EE' } },
          left:   { style: 'thin', color: { rgb: 'E0E0EE' } },
          right:  { style: 'thin', color: { rgb: 'E0E0EE' } },
        },
      };
    }
  }

  var wb      = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
  var dateStr = dt.replace(/\//g, '-');
  XLSX.writeFile(wb, 'quittances_' + dateStr + '.xlsx');
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
        showModal(added + ' entrées importées avec succès.');
      } else {
        showModal('Aucune entrée valide trouvée dans le fichier.');
      }
    } catch (err) {
      showModal('Erreur lors de la lecture du fichier\u202f: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}
