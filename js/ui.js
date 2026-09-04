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

  /* New session: all inputs start empty except date (today) */
  document.getElementById('cm-operator').value = '';
  document.getElementById('cm-operator').readOnly = false;
  cmOperatorLocked = false;
  document.getElementById('cm-service').value  = '';
  document.getElementById('cm-registre').value = '';
  document.getElementById('cm-quitt-du').value = '';
  /* Always reset date to today */
  document.getElementById('cm-date').value = setToday();
  /* Always start with an empty product key */
  var cmKey = document.getElementById('cm-key');
  cmKey.value = '';

  overlay.classList.add('open');
  /* Focus product key input */
  setTimeout(function() { document.getElementById('cm-key').focus(); }, 50);
}

/* Product key → auto-fill operator (case-insensitive) */
var cmOperatorLocked = false;
var cmOperatorCanonical = '';

document.getElementById('cm-key').addEventListener('input', function() {
  var inp = document.getElementById('cm-key');
  var opEl = document.getElementById('cm-operator');
  findSecretKey(inp.value).then(function(idx) {
    if (idx >= 0) {
      opEl.value = secretKeys[idx].operator.toUpperCase();
      opEl.readOnly = true;
      cmOperatorCanonical = opEl.value;
      cmOperatorLocked = true;
    } else {
      opEl.readOnly = false;
      cmOperatorLocked = false;
    }
  });
});

document.getElementById('cm-key-eye').addEventListener('click', function() {
  var inp = document.getElementById('cm-key');
  var ic  = this.querySelector('i');
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  ic.className = show ? 'ti ti-eye-off' : 'ti ti-eye';
  inp.focus();
});

/* Force operator / service in uppercase (modal) */
function upperOnInput(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', function() {
    var start = this.selectionStart;
    this.value = this.value.toUpperCase();
    try { this.setSelectionRange(start, start); } catch (e) {}
  });
}
upperOnInput('cm-operator');
upperOnInput('cm-service');

/* Protect cm-operator from F12 edits when locked by product key */
setInterval(function() {
  if (!cmOperatorLocked) return;
  var el = document.getElementById('cm-operator');
  if (!el) return;
  el.readOnly = true;
  if (el.value !== cmOperatorCanonical) el.value = cmOperatorCanonical;
}, 800);

document.getElementById('clear-modal-confirm').addEventListener('click', function() {
  var reqs = [
    { id: 'cm-operator', label: 'Opérateur' },
    { id: 'cm-service',  label: 'Service' },
    { id: 'cm-date',     label: 'Date' },
    { id: 'cm-registre', label: 'Registre N°' },
    { id: 'cm-quitt-du', label: 'Quittances N° Du' }
  ];
  for (var i = 0; i < reqs.length; i++) {
    var r = document.getElementById(reqs[i].id);
    if (!r.value.trim()) {
      showModal('Champ obligatoire : ' + reqs[i].label + '.');
      r.focus();
      return;
    }
  }

  var duN = parseInt(document.getElementById('cm-quitt-du').value.trim(), 10);
  if (isNaN(duN) || duN <= 0) {
    showModal('Quittances N° Du doit être un numéro valide (ex. 393501).');
    document.getElementById('cm-quitt-du').focus();
    return;
  }

  var overlay = document.getElementById('clear-modal-overlay');
  overlay.classList.remove('open');

  /* Write new info values back to sidebar inputs */
  document.getElementById('inp-operator').value  = cmOperatorLocked ? cmOperatorCanonical : document.getElementById('cm-operator').value.toUpperCase();
  document.getElementById('inp-service').value   = document.getElementById('cm-service').value.toUpperCase();
  document.getElementById('inp-date').value      = document.getElementById('cm-date').value;
  document.getElementById('inp-registre').value  = document.getElementById('cm-registre').value;
  document.getElementById('inp-quitt-du').value  = document.getElementById('cm-quitt-du').value;
  document.getElementById('inp-quitt-au').value  = '';
  syncInfoCanonical();

  /* Clear all entries */
  entries = [];
  nextN = duN;
  document.getElementById('inp-n').value = (nextN !== null) ? nextN : '';
  saveState();
  updateNField();

  /* New session => disable auto totale */
  autoTotale.enabled = false;
  autoTotale.firstCount = 5;
  saveAutoTotale();
  renderAutoTotaleUI();

  render();

  /* Product key handling : le VIP persistant nécessite un token signé
     par /api/verify (autorité serveur). L'auto-remplissage opérateur reste
     côté client (UX pure) via l'événement 'input' ci-dessus. */
  var keyValue = document.getElementById('cm-key').value;
  if (!String(keyValue || '').trim()) {
    applyKeyState(-1);
    return;
  }
  verifyKeyAsync(keyValue).then(function(res) {
    if (res.ok) {
      if (res.idx >= 0 && res.anim) showKeyAnimation(res.anim, res.msg);
    } else {
      showModal(res.network
        ? 'Impossible de vérifier la clé (hors-ligne ou erreur réseau).'
        : 'Clé invalide ou non autorisée.');
    }
  });
});

document.getElementById('clear-modal-cancel').addEventListener('click', function() {
  document.getElementById('clear-modal-overlay').classList.remove('open');
});

/* Tab dans le modal Nouvelle session : aller au prochain champ VIDE
   (les champs déjà remplis sont ignorés) */
document.getElementById('clear-modal-overlay').addEventListener('keydown', function(e) {
  if (e.key !== 'Tab') return;
  var inputs = document.querySelectorAll('#clear-modal-overlay .clear-modal-form input');
  var idx = Array.prototype.indexOf.call(inputs, e.target);
  if (idx < 0) return;
  var n = inputs.length;
  for (var k = 1; k <= n; k++) {
    var el = inputs[(idx + k) % n];
    if (!el.value.trim()) {
      el.focus();
      e.preventDefault();
      return;
    }
  }
  /* Aucun champ vide restant : comportement Tab par défaut */
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

    imOperatorCanonical = op;
    document.getElementById('info-modal-overlay').classList.add('open');
    setTimeout(function() { document.getElementById('im-operator').focus(); }, 50);
  } else {
    // All good -> proceed immediately
    callback();
  }
}

/* Operator is fixed (cannot be changed, incl. via F12/console) */
var imOperatorCanonical = '';
setInterval(function() {
  var el = document.getElementById('im-operator');
  if (!el) return;
  el.readOnly = true;
  if (el.value !== imOperatorCanonical) el.value = imOperatorCanonical;
}, 800);

document.getElementById('info-modal-confirm').addEventListener('click', function() {
  var op = imOperatorCanonical || document.getElementById('im-operator').value.trim();
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
  syncInfoCanonical();
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
   EXPORT EXCEL CONTEXT MENU (clic droit)
   ===================================================== */
function openExportMenu(x, y) {
  var m = document.getElementById('export-menu');
  if (!m) return;
  m.classList.add('open');
  var rect = m.getBoundingClientRect();
  if (x + rect.width  > window.innerWidth)  x = window.innerWidth  - rect.width  - 8;
  if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
  m.style.left = Math.max(8, x) + 'px';
  m.style.top  = Math.max(8, y) + 'px';
}
function closeExportMenu() {
  var m = document.getElementById('export-menu');
  if (m) m.classList.remove('open');
}
function exportMenuChoose(protect) {
  closeExportMenu();
  checkMissingInfo(function() { exportExcel(protect); });
}

document.getElementById('btn-export-excel').addEventListener('contextmenu', function(e) {
  e.preventDefault();
  e.stopPropagation();
  openExportMenu(e.clientX, e.clientY);
});

document.addEventListener('click', function(e) {
  var m = document.getElementById('export-menu');
  if (m && m.classList.contains('open') && !m.contains(e.target)) closeExportMenu();
});
document.addEventListener('scroll', closeExportMenu, true);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeExportMenu();
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

/* ---- Session info section collapse ---- */
function toggleInfoSection() {
  var sec = document.querySelector('.info-section');
  if (!sec) return;
  sec.classList.toggle('collapsed');
  try {
    localStorage.setItem('quittance_info_collapsed', sec.classList.contains('collapsed') ? '1' : '');
  } catch (e) { /* ignore */ }
}

/* ---- Info-section locking (readonly + anti-console) ---- */
var INFO_FIELDS = ['inp-operator', 'inp-service', 'inp-date', 'inp-registre', 'inp-quitt-du', 'inp-quitt-au'];
var infoCanonical = {};

function syncInfoCanonical() {
  for (var i = 0; i < INFO_FIELDS.length; i++) {
    var el = document.getElementById(INFO_FIELDS[i]);
    if (el) infoCanonical[INFO_FIELDS[i]] = el.value;
  }
}

function hardenInfoSection() {
  syncInfoCanonical();
  setInterval(function() {
    for (var i = 0; i < INFO_FIELDS.length; i++) {
      var el = document.getElementById(INFO_FIELDS[i]);
      if (!el) continue;
      el.readOnly = true;
      if (el.value !== infoCanonical[INFO_FIELDS[i]]) {
        el.value = infoCanonical[INFO_FIELDS[i]];
      }
    }
  }, 1200);
}

/* ---- Right-click on the theme button: hide/restore the key theme ---- */
var keyThemeHidden = false;
var infoToastTimer = null;

function showToastMessage(txt) {
  var container = document.getElementById('toast-container');
  if (!container) return;
  container.innerHTML = '';
  clearTimeout(infoToastTimer);
  var div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = '<div class="toast-message">' + txt + '</div>';
  container.appendChild(div);
  infoToastTimer = setTimeout(function() {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 2200);
}

function toggleKeyThemePreview() {
  var root = document.documentElement;
  if (curKeyIdx < 0) {
    root.removeAttribute('data-keytheme');
    keyThemeHidden = false;
    showToastMessage('Aucun thème de clé actif');
    return;
  }
  keyThemeHidden = !keyThemeHidden;
  if (keyThemeHidden) {
    root.removeAttribute('data-keytheme');
    showToastMessage('Thème ramené au défaut');
  } else {
    root.setAttribute('data-keytheme', secretKeys[curKeyIdx].theme);
    showToastMessage('Thème appliqué à nouveau');
  }
}

document.getElementById('theme-toggle-btn').addEventListener('contextmenu', function(e) {
  e.preventDefault();
  toggleKeyThemePreview();
});

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
  if (document.body && document.body.classList.contains('no-key')) return;
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
   KEY ANIMATIONS + SOUNDS
   ===================================================== */
var animTimer = null;

function ensureAudio() {
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!window.__keyAudio) window.__keyAudio = new Ctx();
  if (window.__keyAudio.state === 'suspended') window.__keyAudio.resume();
  return window.__keyAudio;
}

function scheduleNotes(freqs, type, spacing, vol, detuneAmt, dur) {
  var ctx = ensureAudio();
  if (!ctx) return;
  var t = ctx.currentTime;
  freqs.forEach(function(f, i) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    if (detuneAmt) o.detune.value = i % 2 ? detuneAmt : -detuneAmt;
    var t0 = t + i * spacing;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.45));
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + (dur || 0.45) + 0.05);
  });
}

/* Simple snake hiss: soft noise bursts, "sss… sss…" */
function playSnakeSound() {
  var ctx = ensureAudio();
  if (!ctx) return;

  var sr  = ctx.sampleRate;
  var buf = ctx.createBuffer(1, sr * 2, sr);
  var d   = buf.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  var t = ctx.currentTime;

  var s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop   = true;

  var bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  bp.Q.value = 0.9;

  var g = ctx.createGain();
  g.gain.value = 0.0001;

  s.connect(bp).connect(g).connect(ctx.destination);
  s.start(t);

  [[0, 1.1], [1.3, 0.9]].forEach(function(p) {
    var st = t + p[0], e = st + p[1];
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.3, st + 0.12);
    g.gain.setValueAtTime(0.3, e - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, e);
  });

  g.gain.setValueAtTime(0.0001, t + 2.4);
  s.stop(t + 2.5);
}

function playKeySound(anim) {
  try {
    switch (anim) {
      case 'snake':     playSnakeSound(); break;
      case 'love':      scheduleNotes([523.25, 659.25, 783.99, 1046.5, 783.99, 659.25], 'triangle', 0.16, 0.18, 0, 0.45); break;
      case 'wolf':      scheduleNotes([110, 98, 87, 73, 65], 'sawtooth', 0.22, 0.2, 12, 0.3); break;
      case 'fire':      scheduleNotes([392, 440, 523.25, 587.33, 880, 659.25], 'square', 0.1, 0.11, 0, 0.12); break;
      case 'cyber':     scheduleNotes([440, 554.37, 659.25, 880, 1108.73, 1318.5], 'square', 0.09, 0.12, 0, 0.15); break;
      case 'unicorn':   scheduleNotes([1318.5, 1567.98, 2093, 1567.98, 2637], 'sine', 0.12, 0.16, 0, 0.5); break;
      case 'sunflower': scheduleNotes([784, 987.77, 1174.66, 1567.98, 1318.5], 'triangle', 0.14, 0.16, 0, 0.4); break;
      case 'bunny':     scheduleNotes([659.25, 783.99, 987.77, 1318.5, 1046.5], 'sine', 0.1, 0.16, 0, 0.22); break;
      default:          scheduleNotes([523.25, 659.25, 783.99, 1046.5], 'triangle', 0.16, 0.18, 0, 0.45); break;
    }
  } catch (e) { /* ignore */ }
}

/* ---- Sticker + floaters for each animation ---- */
var ANIM_FX = {
  snake:     { sticker: '🐍', floats: ['🐍', '🐍', '🌿', '🐍', '🦎', '🐛'] },
  love:      { sticker: '💖', floats: ['💖', '💕', '🌹', '🌸', '💗', '✨'] },
  wolf:      { sticker: '🐺', floats: ['🐺', '🐺', '🌙', '🐾', '⚔️', '🏔️'] },
  fire:      { sticker: '🔥', floats: ['🔥', '🐉', '🌋', '⚡', '🛡️', '🔺'] },
  cyber:     { sticker: '🤖', floats: ['🤖', '⚡', '🛸', '💾', '🔷', '◼️'] },
  unicorn:   { sticker: '🦄', floats: ['🦄', '✨', '🌈', '🪄', '🍬', '☁️'] },
  sunflower: { sticker: '🌻', floats: ['🌻', '🌼', '🐝', '☀️', '🍯', '🧡'] },
  bunny:     { sticker: '🐰', floats: ['🐰', '🍓', '🎀', '🩰', '🍭', '💗'] },
};

function showKeyAnimation(anim, msg) {
  var overlay = document.getElementById('key-anim-overlay');
  var stage   = document.getElementById('key-anim-stage');
  var msgEl   = document.getElementById('key-anim-msg');

  clearTimeout(animTimer);
  stage.innerHTML = '';
  overlay.className = 'key-anim-overlay';
  overlay.classList.add(anim);
  msgEl.textContent = msg;

  var fx = ANIM_FX[anim] || ANIM_FX.love;

  /* Big central sticker */
  var sticker = document.createElement('div');
  sticker.className = 'key-sticker';
  sticker.textContent = fx.sticker;
  stage.appendChild(sticker);

  /* Ambient floats around the sticker */
  spawnFloaters(stage, fx.floats);

  playKeySound(anim);
  overlay.classList.add('visible');

  animTimer = setTimeout(function() {
    overlay.classList.remove('visible');
    setTimeout(function() {
      stage.innerHTML = '';
      overlay.className = 'key-anim-overlay';
    }, 450);
  }, 5200);
}

/* ---- Floating emojis around the sticker ---- */
function spawnFloaters(stage, emojis) {
  var n = 22;
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.className = 'float-item';
    s.textContent = emojis[i % emojis.length];
    var size = 16 + Math.random() * 26;
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.fontSize = size + 'px';
    s.style.animationDuration = (3.4 + Math.random() * 2.6) + 's';
    s.style.animationDelay = (Math.random() * 1.8) + 's';
    s.style.setProperty('--sway', (Math.random() * 80 - 40) + 'px');
    stage.appendChild(s);
  }
}

/* ---- Auto totale (VIP) : total après chaque page du registre ---- */
var autoTotaleSel = autoTotale.firstCount;

function refreshAutoTotalePop() {
  autoTotaleSel = autoTotale.firstCount;
  var opts = document.querySelectorAll('.auto-totale-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].classList.toggle('selected', parseInt(opts[i].getAttribute('data-v'), 10) === autoTotaleSel);
  }
  var prev = document.getElementById('auto-totale-preview');
  if (prev) {
    prev.innerHTML = 'Page 1 = <b>' + autoTotaleSel + '</b>' +
      (autoTotaleSel < 5 ? ', puis <b>5</b> par page.' : ' par page.');
  }
}

function selectAutoTotaleOption(v) {
  autoTotaleSel = v;
  var opts = document.querySelectorAll('.auto-totale-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].classList.toggle('selected', parseInt(opts[i].getAttribute('data-v'), 10) === v);
  }
  var prev = document.getElementById('auto-totale-preview');
  if (prev) {
    prev.innerHTML = 'Page 1 = <b>' + autoTotaleSel + '</b>' +
      (autoTotaleSel < 5 ? ', puis <b>5</b> par page.' : ' par page.');
  }
}

function renderAutoTotaleUI() {
  var btn    = document.getElementById('auto-totale-toggle');
  var status = document.getElementById('auto-totale-status');
  var wrap   = document.getElementById('auto-totale-wrap');
  if (!btn || !wrap) return;
  if (autoTotale.enabled) {
    btn.classList.add('is-active');
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Auto totale';
    status.textContent = 'P1 : ' + autoTotale.firstCount + ', puis 5 par page';
    wrap.setAttribute('data-active', '1');
  } else {
    btn.classList.remove('is-active');
    btn.innerHTML = '<i class="ti ti-sum" aria-hidden="true"></i> Auto totale';
    status.textContent = '';
    wrap.setAttribute('data-active', '0');
  }
  refreshAutoTotalePop();
  var pop = document.getElementById('auto-totale-pop');
  if (pop) pop.classList.remove('open');
}

function toggleAutoTotale() {
  if (document.body.classList.contains('no-key')) return;
  var pop = document.getElementById('auto-totale-pop');
  if (!pop) return;
  refreshAutoTotalePop();
  pop.classList.toggle('open');
}

function applyAutoTotale() {
  if (document.body.classList.contains('no-key')) return;
  autoTotale.enabled = true;
  autoTotale.firstCount = autoTotaleSel;
  saveAutoTotale();
  if (searchQuery && fullscreen) clearSearch();
  renderAutoTotaleUI();
  render();
  showToastMessage('Auto totale actif : page 1 = ' + autoTotaleSel + ', puis 5 par page');
}

function disableAutoTotale() {
  if (document.body.classList.contains('no-key')) return;
  autoTotale.enabled = false;
  autoTotale.firstCount = 5;
  saveAutoTotale();
  renderAutoTotaleUI();
  render();
  showToastMessage('Auto totale désactivé');
}

/* Close the auto-totale popover when clicking outside */
document.addEventListener('click', function(e) {
  var wrap = document.getElementById('auto-totale-wrap');
  var pop  = document.getElementById('auto-totale-pop');
  if (wrap && pop && pop.classList.contains('open') && !wrap.contains(e.target)) {
    pop.classList.remove('open');
  }
});

/* =====================================================
   INITIALISATION
   ===================================================== */
(function init() {
  initTheme();

  /* Restore collapsed info section */
  try {
    if (localStorage.getItem('quittance_info_collapsed') === '1') {
      var sec = document.querySelector('.info-section');
      if (sec) sec.classList.add('collapsed');
    }
  } catch (e) { /* ignore */ }

  loadState();
  hardenInfoSection();

  /* Restore VIP via token serveur validé (async, fail-closed).
     L'id seul en localStorage n'est PLUS jamais suffisant (spoofable). */
  restoreKeyState();
  renderAutoTotaleUI();

  /* Set today if date is empty */
  var dateInp = document.getElementById('inp-date');
  if (!dateInp.value) dateInp.value = setToday();

  updateNField();
  render();
})();
