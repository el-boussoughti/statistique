/* =====================================================
   app.js — State, storage & business logic
   ===================================================== */

var STORAGE_KEY = 'quittances_data';
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
    { value: 'C1',   text: 'C1',             hint: '40 dh'  },
    { value: 'C2',   text: 'C2',             hint: '60 dh'  },
    { value: 'ACC',  text: 'ACC',            hint: '80 dh'  },
    { value: 'CML',  text: 'CML',            hint: '100 dh' },
    { value: 'CMD', text: 'CMD',            hint: '40 dh'  },
  ]},
  { label: 'Montant variable', items: [
    { value: 'RX',    text: 'RX',            hint: '' },
    { value: 'HOSP',  text: 'Hospitalisation', hint: '' },
    { value: 'LABO',  text: 'LABO',          hint: '' },
    { value: 'ANNUL', text: 'Annulation',    hint: '' },
    { value: 'EXP',   text: 'EXP',           hint: '' },
  ]},
];

var fixedMontants = { C1: 40, C2: 60, ACC: 80, CML: 100, CMD: 40 };

var fixedOpts = {
  '1': { type: 'C1',   montant: 40  },
  '2': { type: 'C2',   montant: 60  },
  '3': { type: 'ACC',  montant: 80  },
  '4': { type: 'CML',  montant: 100 },
  '5': { type: 'CMD', montant: 40  },
};

var typeKeys = { '1': 'C1', '2': 'C2', '3': 'ACC', '4': 'CML', '5': 'CMD' };

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
      if (data.operator)  document.getElementById('inp-operator').value  = data.operator;
      if (data.service)   document.getElementById('inp-service').value   = data.service;
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
function addEntry() {
  var type    = document.getElementById('inp-type').value.trim();
  var montant = parseFloat(document.getElementById('inp-montant').value.replace(',', '.'));
  var n       = parseInt(document.getElementById('inp-n').value);

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

function quickAdd(btn) {
  var manualN = parseInt(document.getElementById('inp-n').value);
  if (!manualN || manualN < 1) {
    showModal('Entrez d\'abord un numéro de quittance manuellement.');
    return;
  }
  if (nextN === null) {
    nextN = manualN;
  }
  
  var type    = btn.getAttribute('data-type');
  var montant = parseFloat(btn.getAttribute('data-montant'));
  var n       = manualN;
  
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

  var shortMap = { r: 'RX', l: 'LABO', a: 'ANNUL', h: 'HOSP', e: 'EXP' };
  var m = t.match(/^([rlhaeRLHAE])(\d+)$/);
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

  var types = ['c1', 'c2', 'hosp', 'acc', 'rx', 'exp', 'labo', 'cml', 'cmd', 'annul'];
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

/* ---- Excel import/export ---- */
function exportExcel() {
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
    }

    /* ── Template info cells (preserve existing fill — just set value) */
    ws.getCell('G6').value  = sv;        // Service
    ws.getCell('H8').value  = dt;        // Date
    ws.getCell('G10').value = op;        // Opérateur
    if (registre) ws.getCell('G12').value = registre;   // Registre N°
    if (quittDu)  ws.getCell('G14').value = quittDu;    // Quittances N° Du
    if (quittAu)  ws.getCell('I14').value = quittAu;    // Au

    /* ── Type statistics rows (rows 17-26 in Excel = rows 16-25 in 0-idx) */
    var typeRowMap = {
      'C1':   17, 'C2':   18, 'HOSP': 19, 'ACC':  20,
      'RX':   21, 'EXP':  22, 'LABO': 23, 'CML':  24,
      'CMD':  25, 'ANNUL':26
    };
    for (var t in byType) {
      var exRow = typeRowMap[t];
      if (exRow !== undefined) {
        ws.getCell(exRow, 7).value = byType[t].count;
        ws.getCell(exRow, 8).value = byType[t].total;
      }
    }

    /* ── Grand totals row 27 ─────────────────────────────────────── */
    ws.getCell(27, 7).value = totalEntries;
    ws.getCell(27, 8).value = total;

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
