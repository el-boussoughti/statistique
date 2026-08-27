/* =====================================================
   ui.js — Dropdown, modal, keyboard shortcuts & init
   ===================================================== */

/* =====================================================
   MODAL
   ===================================================== */
function showModal(msg, onConfirm) {
  var overlay    = document.getElementById('modal-overlay');
  var cancelBtn  = document.getElementById('modal-cancel');
  var confirmBtn = document.getElementById('modal-confirm');

  document.getElementById('modal-msg').textContent = msg;

  if (onConfirm) {
    cancelBtn.style.display  = '';
    confirmBtn.textContent   = 'Confirmer';
    confirmBtn.onclick = function() { overlay.classList.remove('open'); onConfirm(); };
    cancelBtn.onclick  = function() { overlay.classList.remove('open'); };
  } else {
    cancelBtn.style.display = 'none';
    confirmBtn.textContent  = 'OK';
    confirmBtn.onclick = function() { overlay.classList.remove('open'); };
  }

  overlay.classList.add('open');
}

/* Close modal on backdrop click */
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

/* =====================================================
   CLEAR-SESSION MODAL
   ===================================================== */
function openClearSessionModal() {
  var overlay = document.getElementById('clear-modal-overlay');

  /* Pre-fill modal fields with current sidebar values */
  document.getElementById('cm-operator').value  = document.getElementById('inp-operator').value;
  document.getElementById('cm-service').value   = document.getElementById('inp-service').value;
  document.getElementById('cm-registre').value  = document.getElementById('inp-registre').value;
  document.getElementById('cm-quitt-du').value  = document.getElementById('inp-quitt-du').value;
  document.getElementById('cm-quitt-au').value  = document.getElementById('inp-quitt-au').value;
  /* Always reset date to today */
  document.getElementById('cm-date').value = setToday();

  overlay.classList.add('open');
  /* Focus first input */
  setTimeout(function() { document.getElementById('cm-operator').focus(); }, 50);
}

document.getElementById('clear-modal-confirm').addEventListener('click', function() {
  var overlay = document.getElementById('clear-modal-overlay');
  overlay.classList.remove('open');

  /* Write new info values back to sidebar inputs */
  document.getElementById('inp-operator').value  = document.getElementById('cm-operator').value;
  document.getElementById('inp-service').value   = document.getElementById('cm-service').value;
  document.getElementById('inp-date').value      = document.getElementById('cm-date').value;
  document.getElementById('inp-registre').value  = document.getElementById('cm-registre').value;
  document.getElementById('inp-quitt-du').value  = document.getElementById('cm-quitt-du').value;
  document.getElementById('inp-quitt-au').value  = document.getElementById('cm-quitt-au').value;

  /* Clear all entries */
  entries = [];
  nextN   = null;
  document.getElementById('inp-n').value = '';
  saveState();
  updateNField();
  render();
});

document.getElementById('clear-modal-cancel').addEventListener('click', function() {
  document.getElementById('clear-modal-overlay').classList.remove('open');
});

/* Close on backdrop click */
document.getElementById('clear-modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

/* close on Escape */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.getElementById('clear-modal-overlay').classList.remove('open');
    document.getElementById('info-modal-overlay').classList.remove('open');
  }
});

/* =====================================================
   INFO MISSING MODAL (Validation before export)
   ===================================================== */
var pendingExportCallback = null;

function checkMissingInfo(callback) {
  var op = document.getElementById('inp-operator').value.trim();
  var sv = document.getElementById('inp-service').value.trim();
  var dt = document.getElementById('inp-date').value.trim();
  var reg = document.getElementById('inp-registre').value.trim();
  var qDu = document.getElementById('inp-quitt-du').value.trim();
  var qAu = document.getElementById('inp-quitt-au').value.trim();

  if (!op || !sv || !dt || !reg || !qDu || !qAu) {
    // Missing info -> show modal
    pendingExportCallback = callback;
    document.getElementById('im-operator').value = op;
    document.getElementById('im-service').value = sv;
    document.getElementById('im-date').value = dt || setToday();
    document.getElementById('im-registre').value = reg;
    document.getElementById('im-quitt-du').value = qDu;
    document.getElementById('im-quitt-au').value = qAu;
    
    document.getElementById('info-modal-overlay').classList.add('open');
    setTimeout(function() { document.getElementById('im-operator').focus(); }, 50);
  } else {
    // All good -> proceed immediately
    callback();
  }
}

document.getElementById('info-modal-confirm').addEventListener('click', function() {
  var op = document.getElementById('im-operator').value.trim();
  var sv = document.getElementById('im-service').value.trim();
  var dt = document.getElementById('im-date').value.trim();
  var reg = document.getElementById('im-registre').value.trim();
  var qDu = document.getElementById('im-quitt-du').value.trim();
  var qAu = document.getElementById('im-quitt-au').value.trim();

  if (!op || !sv || !dt || !reg || !qDu || !qAu) {
    showModal("Veuillez remplir tous les champs avant de continuer.");
    return;
  }

  // Update sidebar inputs
  document.getElementById('inp-operator').value = op;
  document.getElementById('inp-service').value = sv;
  document.getElementById('inp-date').value = dt;
  document.getElementById('inp-registre').value = reg;
  document.getElementById('inp-quitt-du').value = qDu;
  document.getElementById('inp-quitt-au').value = qAu;

  saveState();
  document.getElementById('info-modal-overlay').classList.remove('open');

  if (pendingExportCallback) {
    pendingExportCallback();
    pendingExportCallback = null;
  }
});

document.getElementById('info-modal-cancel').addEventListener('click', function() {
  document.getElementById('info-modal-overlay').classList.remove('open');
  pendingExportCallback = null;
});

document.getElementById('info-modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('open');
    pendingExportCallback = null;
  }
});

/* =====================================================
   TYPE DROPDOWN
   ===================================================== */
function positionDropdown() {
  var wrap = document.getElementById('type-wrap');
  var dd   = document.getElementById('type-dropdown');
  var rect = wrap.getBoundingClientRect();
  dd.style.top   = (rect.bottom + 4) + 'px';
  dd.style.left  = rect.left + 'px';
  dd.style.width = rect.width + 'px';
}

function buildTypeDropdown(filter) {
  var dd   = document.getElementById('type-dropdown');
  var html = '';

  for (var g = 0; g < typeGroups.length; g++) {
    var group   = typeGroups[g];
    var matched = [];
    for (var i = 0; i < group.items.length; i++) {
      var item = group.items[i];
      if (!filter ||
          item.value.toLowerCase().indexOf(filter) > -1 ||
          item.text.toLowerCase().indexOf(filter)  > -1) {
        matched.push(item);
      }
    }
    if (matched.length === 0) continue;
    html += '<div class="group-label">' + group.label + '</div>';
    for (var i = 0; i < matched.length; i++) {
      var item = matched[i];
      html +=
        '<div class="opt" data-value="' + item.value + '">' +
          item.text +
          (item.hint ? '<span class="opt-hint">' + item.hint + '</span>' : '') +
        '</div>';
    }
  }

  if (!html) {
    html = '<div class="opt" style="color:var(--text-3);cursor:default;">Aucun type correspondant</div>';
  }

  dd.innerHTML = html;

  /* Attach click listeners */
  var opts = dd.querySelectorAll('.opt[data-value]');
  for (var i = 0; i < opts.length; i++) {
    opts[i].addEventListener('click', function() {
      var val = this.getAttribute('data-value');
      document.getElementById('inp-type').value = val;
      hideTypeDropdown();
      onTypeChange();
      document.getElementById('inp-montant').focus();
    });
  }
}

function showTypeDropdown() {
  var filter = document.getElementById('inp-type').value.trim().toLowerCase() || null;
  buildTypeDropdown(filter);
  positionDropdown();
  document.getElementById('type-dropdown').classList.add('open');
  document.getElementById('type-drop-icon').classList.add('open');
}

function showFullTypeDropdown() {
  buildTypeDropdown(null);
  positionDropdown();
  document.getElementById('type-dropdown').classList.add('open');
  document.getElementById('type-drop-icon').classList.add('open');
}

function hideTypeDropdown() {
  document.getElementById('type-dropdown').classList.remove('open');
  document.getElementById('type-drop-icon').classList.remove('open');
}

/* Hide dropdown when type input loses focus (with delay for click) */
document.getElementById('inp-type').addEventListener('blur', function() {
  setTimeout(hideTypeDropdown, 150);
});

/* Open on input focus */
document.getElementById('inp-type').addEventListener('focus', function() {
  showTypeDropdown();
});

/* Chevron icon toggle */
document.getElementById('type-drop-icon').addEventListener('click', function(e) {
  e.stopPropagation();
  var dd = document.getElementById('type-dropdown');
  if (dd.classList.contains('open')) {
    hideTypeDropdown();
  } else {
    document.getElementById('inp-type').focus();
    showFullTypeDropdown();
  }
});

/* =====================================================
   TYPE INPUT — KEYBOARD NAVIGATION
   ===================================================== */
document.getElementById('inp-type').addEventListener('keydown', function(e) {
  /* Digit shortcuts: 1→C1, 2→C2, etc. */
  if (e.key in typeKeys && this.value.trim() === '') {
    e.preventDefault();
    this.value = typeKeys[e.key];
    hideTypeDropdown();
    onTypeChange();
    document.getElementById('inp-montant').focus();
    return;
  }

  if (e.key === 'Escape') { hideTypeDropdown(); return; }

  /* Arrow navigation in dropdown */
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    var dd = document.getElementById('type-dropdown');
    if (!dd.classList.contains('open')) { showTypeDropdown(); return; }
    var opts = dd.querySelectorAll('.opt[data-value]');
    if (opts.length === 0) return;
    var cur = dd.querySelector('.opt.hover');
    var idx = -1;
    for (var i = 0; i < opts.length; i++) { if (opts[i] === cur) { idx = i; break; } }
    idx = e.key === 'ArrowDown'
      ? (idx < opts.length - 1 ? idx + 1 : 0)
      : (idx > 0 ? idx - 1 : opts.length - 1);
    opts.forEach(function(o) { o.classList.remove('hover'); });
    opts[idx].classList.add('hover');
    opts[idx].scrollIntoView({ block: 'nearest' });
    return;
  }

  /* Enter — confirm selection */
  if (e.key === 'Enter') {
    var dd      = document.getElementById('type-dropdown');
    var hovered = dd.querySelector('.opt.hover');
    if (hovered) { hovered.click(); e.preventDefault(); return; }
    var first = dd.querySelector('.opt[data-value]');
    if (first) { first.click(); e.preventDefault(); }
  }
});

/* =====================================================
   GLOBAL KEYBOARD SHORTCUTS
   ===================================================== */
document.addEventListener('keydown', function(e) {
  /* Ctrl+Alt+[1-5] — quick add fixed types */
  if (e.ctrlKey && e.altKey && e.key in fixedOpts && editIndex < 0) {
    e.preventDefault();
    if (nextN === null) {
      var manualN = parseInt(document.getElementById('inp-n').value);
      if (!manualN || manualN < 1) { showModal('Entrez d\'abord un numéro de quittance manuellement.'); return; }
      nextN = manualN;
    }
    var opt = fixedOpts[e.key];
    var n   = nextN;
    entries.unshift({ n: n, type: opt.type, montant: opt.montant });
    nextN = n + 1;
    document.getElementById('inp-n').value = '';
    updateNField();
    saveState();
    render();
    return;
  }

  /* Ctrl+Alt+[r,l,h,a] — set variable type */
  if (e.ctrlKey && e.altKey) {
    var typeMap = { r: 'RX', l: 'LABO', h: 'HOSP', a: 'ANNUL', e: 'EXP' };
    var k = e.key.toLowerCase();
    if (k in typeMap) {
      e.preventDefault();
      document.getElementById('inp-type').value = typeMap[k];
      hideTypeDropdown();
      onTypeChange();
      document.getElementById('inp-montant').focus();
      return;
    }
  }

  /* Ctrl+Alt+0 — clear type & montant, blur input */
  if (e.ctrlKey && e.altKey && e.key === '0') {
    e.preventDefault();
    document.getElementById('inp-type').value = '';
    document.getElementById('inp-montant').value = '';
    hideTypeDropdown();
    if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
    return;
  }

  /* Ctrl+/ — clear type & montant, focus type */
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    document.getElementById('inp-type').value = '';
    document.getElementById('inp-montant').value = '';
    hideTypeDropdown();
    document.getElementById('inp-type').focus();
  }
});

/* =====================================================
   MONTANT — Enter submits
   ===================================================== */
document.getElementById('inp-montant').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('btn-submit').click();
});

/* =====================================================
   DATE INPUT — format dd/mm/yyyy
   ===================================================== */
document.getElementById('inp-date').addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9\/]/g, '').slice(0, 10);
});

/* =====================================================
   N-WARNING — click to reset sync
   ===================================================== */
document.getElementById('n-warning').addEventListener('click', function() {
  if (nextN !== null) {
    document.getElementById('inp-n').value = nextN;
    checkNEdited();
  }
});

/* =====================================================
   REPOSITION DROPDOWN ON SCROLL / RESIZE
   ===================================================== */
window.addEventListener('scroll', function() {
  var dd = document.getElementById('type-dropdown');
  if (dd.classList.contains('open')) positionDropdown();
}, true /* capture so fires on all scroll targets */);

window.addEventListener('resize', function() {
  var dd = document.getElementById('type-dropdown');
  if (dd.classList.contains('open')) positionDropdown();
});

/* =====================================================
   THEME TOGGLE
   ===================================================== */
function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var isDark = false;
  if (current === 'dark') {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else if (current === 'light') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    isDark = true;
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      isDark = true;
    }
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  var current = document.documentElement.getAttribute('data-theme');
  var btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  var isDark = current === 'dark' || (current !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    btn.innerHTML = '<i class="ti ti-sun"></i>';
    btn.title = "Passer au thème clair";
  } else {
    btn.innerHTML = '<i class="ti ti-moon"></i>';
    btn.title = "Passer au thème sombre";
  }
}

function initTheme() {
  var saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  updateThemeIcon();
}

/* =====================================================
   ABOUT MODAL
   ===================================================== */
function showAboutModal() {
  var modal = document.getElementById('about-modal');
  if (modal) modal.classList.add('open');
}

function closeAboutModal() {
  var modal = document.getElementById('about-modal');
  if (modal) modal.classList.remove('open');
}

document.getElementById('about-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

/* =====================================================
   UNDO TOAST
   ===================================================== */
var undoTimeout = null;
var pendingUndoEntry = null;

function showUndoToast(deletedEntry) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  // Clear existing toast if any
  container.innerHTML = '';
  clearTimeout(undoTimeout);

  pendingUndoEntry = deletedEntry;

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = 
    '<div class="toast-message">Quittance N°' + deletedEntry.n + ' supprimée.</div>' +
    '<button class="toast-undo-btn" onclick="undoDelete()">Annuler</button>';
  
  container.appendChild(toast);

  // Trigger reflow for transition
  void toast.offsetWidth;
  toast.classList.add('show');

  undoTimeout = setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
      pendingUndoEntry = null;
    }, 300); // Wait for transition
  }, 5000); // 5 seconds
}

function undoDelete() {
  if (pendingUndoEntry) {
    entries.unshift(pendingUndoEntry);
    
    // Sort array by N° descending
    entries.sort(function(a, b) {
      return b.n - a.n;
    });

    // Auto-resync nextN to the restored maximum
    if (entries.length > 0) {
      nextN = entries[0].n + 1;
    }
    updateNField();
    
    saveState();
    render();

    var container = document.getElementById('toast-container');
    container.innerHTML = '';
    clearTimeout(undoTimeout);
    pendingUndoEntry = null;
  }
}

/* =====================================================
   QUICK-BUTTON CONTEXT MENU
   Right-click a quick button → pick a price
   ===================================================== */
var qmData = { type: null, def: 0 };

function closeQuickMenu() {
  var m = document.getElementById('quick-menu');
  if (m) m.classList.remove('open');
}

function buildQuickMenuItem(label, price) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'quick-menu-item';
  b.setAttribute('role', 'menuitem');
  var l = document.createElement('span');
  l.textContent = label;
  var p = document.createElement('b');
  p.textContent = price + ' dh';
  b.appendChild(l);
  b.appendChild(p);
  b.addEventListener('click', function() {
    closeQuickMenu();
    addQuickEntry(qmData.type, price);
  });
  return b;
}

function buildQuickMenu() {
  var m = document.getElementById('quick-menu');
  m.innerHTML = '';

  var t = document.createElement('div');
  t.className = 'quick-menu-title';
  t.textContent = qmData.type + ' — prix par défaut ' + qmData.def + ' dh';
  m.appendChild(t);

  m.appendChild(buildQuickMenuItem('Défaut', qmData.def));
  m.appendChild(buildQuickMenuItem('Prix x2', qmData.def * 2));
  m.appendChild(buildQuickMenuItem('Prix x3', qmData.def * 3));

  var customs = (customPrices[qmData.type] || []).slice().sort(function(a, b) { return a - b; });
  if (customs.length > 0) {
    var sep = document.createElement('div');
    sep.className = 'quick-menu-sep';
    sep.textContent = 'Mes prix';
    m.appendChild(sep);
    customs.forEach(function(p) {
      m.appendChild(buildQuickMenuItem(
        p + ' dh',
        p
      ));
    });
  }

  var addRow = document.createElement('div');
  addRow.className = 'quick-menu-add';
  var inp = document.createElement('input');
  inp.type = 'number';
  inp.min = '0';
  inp.step = 'any';
  inp.placeholder = 'Nouveau prix…';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'quick-menu-add-btn';
  btn.title = 'Ajouter ce prix';
  btn.textContent = '+';
  addRow.appendChild(inp);
  addRow.appendChild(btn);
  m.appendChild(addRow);

  function addCustom() {
    var v = parseFloat(inp.value.replace(',', '.'));
    if (!isFinite(v) || v <= 0) return;
    var arr = customPrices[qmData.type] || [];
    if (arr.indexOf(v) === -1) arr.push(v);
    customPrices[qmData.type] = arr;
    saveCustomPrices();
    buildQuickMenu();
  }

  btn.addEventListener('click', addCustom);
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeQuickMenu(); return; }
    if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
  });
  inp.focus();
}

function openQuickMenu(type, def, x, y) {
  qmData.type = type;
  qmData.def  = def;
  buildQuickMenu();
  var m = document.getElementById('quick-menu');
  m.classList.add('open');
  var r = m.getBoundingClientRect();
  var px = Math.min(x, window.innerWidth  - r.width  - 8);
  var py = Math.min(y, window.innerHeight - r.height - 8);
  m.style.left = Math.max(8, px) + 'px';
  m.style.top  = Math.max(8, py) + 'px';
}

document.addEventListener('contextmenu', function(e) {
  var btn = e.target.closest ? e.target.closest('.quick-btn') : null;
  if (!btn) return;
  e.preventDefault();
  openQuickMenu(
    btn.getAttribute('data-type'),
    parseFloat(btn.getAttribute('data-montant')),
    e.clientX,
    e.clientY
  );
});

document.addEventListener('click', function(e) {
  var m = document.getElementById('quick-menu');
  if (m && m.classList.contains('open') && !m.contains(e.target)) {
    closeQuickMenu();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeQuickMenu();
});

window.addEventListener('scroll', closeQuickMenu, true);

/* =====================================================
   INITIALISATION
   ===================================================== */
(function init() {
  initTheme();
  loadState();

  /* Set today if date is empty */
  var dateInp = document.getElementById('inp-date');
  if (!dateInp.value) dateInp.value = setToday();

  updateNField();
  render();
})();
