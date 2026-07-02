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
    var typeMap = { r: 'RX', l: 'Labo', h: 'HOSP', a: 'ANNUL' };
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

  /* Ctrl+Alt+0 — clear type & montant */
  if (e.ctrlKey && e.altKey && e.key === '0') {
    e.preventDefault();
    document.getElementById('inp-type').value = '';
    document.getElementById('inp-montant').value = '';
    hideTypeDropdown();
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
   INITIALISATION
   ===================================================== */
(function init() {
  loadState();

  /* Set today if date is empty */
  var dateInp = document.getElementById('inp-date');
  if (!dateInp.value) dateInp.value = setToday();

  updateNField();
  render();
})();
