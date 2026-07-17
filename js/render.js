/* =====================================================
   render.js — DOM rendering, charts, pagination
   ===================================================== */

var chartMeta = { bars: [], countBars: [], hoverBar: -1, hoverCount: -1 };

/* =====================================================
   MAIN RENDER
   ===================================================== */
function render() {
  var gridEl       = document.querySelector('.content-grid');
  var totalEntries = entries.length;
  var totalPages   = showAll ? 1 : Math.max(1, Math.ceil(totalEntries / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  /* Fullscreen classes */
  gridEl.classList.toggle('list-fullscreen',     fullscreen);
  gridEl.classList.toggle('graphics-fullscreen', graphicsFullscreen);

  /* Fullscreen toggle button */
  var fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn) {
    fsBtn.style.display = totalEntries > 0 ? 'inline-flex' : 'none';
    fsBtn.innerHTML = fullscreen
      ? '<i class="ti ti-arrows-minimize"></i> Réduire'
      : '<i class="ti ti-arrows-maximize"></i> Plein écran';
  }

  /* Graphics fullscreen button */
  var gfsBtn = document.getElementById('btn-graphics-fullscreen');
  if (gfsBtn) {
    gfsBtn.innerHTML = graphicsFullscreen
      ? '<i class="ti ti-arrows-minimize"></i>'
      : '<i class="ti ti-arrows-maximize"></i>';
    gfsBtn.title = graphicsFullscreen ? 'Réduire' : 'Plein écran';
  }

  /* ---- Sequence Warning ---- */
  var seqWarn = document.getElementById('sequence-warning');
  if (seqWarn) {
    if (totalEntries > 1) {
      var missing = findMissingQuittances();
      if (missing.length > 0) {
        seqWarn.style.display = 'flex';
        var rev = missing.reverse();
        var maxShow = 10;
        var displayStr = '';
        if (rev.length <= maxShow) {
          displayStr = rev.join(', ');
        } else {
          displayStr = rev.slice(0, maxShow).join(', ') + ' ... et ' + (rev.length - maxShow) + ' autres';
        }
        
        seqWarn.innerHTML = '<i class="ti ti-alert-triangle" aria-hidden="true" style="flex-shrink:0; margin-top:2px;"></i> ' +
          '<span>Quittance(s) manquante(s) dans la séquence : <strong>' + displayStr + '</strong></span>';
      } else {
        seqWarn.style.display = 'none';
      }
    } else {
      seqWarn.style.display = 'none';
    }
  }

  /* ---- Search Input Visibility ---- */
  var searchInp = document.getElementById('inp-search');
  if (searchInp) {
    searchInp.style.display = fullscreen ? 'inline-block' : 'none';
  }

  /* ---- Entries table ---- */
  var cont = document.getElementById('entries-container');

  var filteredEntries = entries;
  if (fullscreen && searchQuery) {
    filteredEntries = entries.filter(function(e) {
      return e.n.toString().includes(searchQuery) || e.type.toLowerCase().includes(searchQuery);
    });
  }
  
  var totalView = filteredEntries.length;

  if (totalView === 0) {
    var msg = (entries.length === 0) ? 'Aucune entrée pour le moment.' : 'Aucun résultat trouvé.';
    cont.innerHTML = '<div class="empty-state"><i class="ti ti-inbox"></i><p>' + msg + '</p></div>';
  } else {
    var totalPages = Math.ceil(totalView / pageSize);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    var sorted = sortBy
      ? filteredEntries.slice().sort(function(a, b) {
          var va = a[sortBy], vb = b[sortBy];
          if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb + '').toLowerCase(); }
          if (va < vb) return sortAsc ? -1 : 1;
          if (va > vb) return sortAsc ?  1 : -1;
          return 0;
        })
      : filteredEntries;

    var startIdx = showAll ? 0 : (currentPage - 1) * pageSize;
    var endIdx   = showAll ? totalView : Math.min(totalView, currentPage * pageSize);

    function arrow(col) {
      if (sortBy !== col) return '';
      return sortAsc
        ? ' <i class="ti ti-chevron-up" style="font-size:10px;"></i>'
        : ' <i class="ti ti-chevron-down" style="font-size:10px;"></i>';
    }

    var rows = '';
    for (var i = startIdx; i < endIdx; i++) {
      var e       = sorted[i];
      var realIdx = entries.indexOf(e);
      var isAnnul = e.type === 'ANNUL';
      var badgeClass   = isAnnul ? 'danger' : 'accent';
      var strikeStyle  = isAnnul ? 'text-decoration:line-through;color:var(--text-3);' : '';

      rows +=
        '<tr>' +
          '<td style="' + strikeStyle + 'font-weight:500;">' + e.n + '</td>' +
          '<td><span class="type-badge ' + badgeClass + '">' + e.type + '</span></td>' +
          '<td style="' + strikeStyle + 'font-weight:600;">' + e.montant.toFixed(2) + ' <span style="font-size:11px;color:var(--text-3);font-weight:400;">dh</span></td>' +
          '<td><div class="row-actions">' +
            '<button class="action-btn" onclick="editEntry(' + realIdx + ')" title="Modifier"><i class="ti ti-pencil"></i></button>' +
            '<button class="action-btn danger" onclick="deleteEntry(' + realIdx + ')" title="Supprimer"><i class="ti ti-trash"></i></button>' +
          '</div></td>' +
        '</tr>';
    }

    cont.innerHTML =
      '<table class="entries-table">' +
        '<thead><tr>' +
          '<th class="sort-header" onclick="sortEntries(\'n\')" ondblclick="resetSort()">N°' + arrow('n') + '</th>' +
          '<th class="sort-header" onclick="sortEntries(\'type\')" ondblclick="resetSort()">Type' + arrow('type') + '</th>' +
          '<th class="sort-header" onclick="sortEntries(\'montant\')" ondblclick="resetSort()">Montant' + arrow('montant') + '</th>' +
          '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  /* ---- Pagination ---- */
  var pag = document.getElementById('pagination');
  if (totalView > pageSize && !showAll) {
    pag.style.display = 'flex';
    var html = '';
    html += '<button onclick="goPage(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + '><i class="ti ti-chevron-left"></i></button>';
    var maxVisible = 5;
    var pStart = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    var pEnd   = Math.min(totalPages, pStart + maxVisible - 1);
    if (pEnd - pStart < maxVisible - 1) pStart = Math.max(1, pEnd - maxVisible + 1);
    for (var p = pStart; p <= pEnd; p++) {
      html += '<button onclick="goPage(' + p + ')" class="' + (p === currentPage ? 'active' : '') + '">' + p + '</button>';
    }
    html += '<button onclick="goPage(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '><i class="ti ti-chevron-right"></i></button>';
    html += '<span class="page-info">' + totalView + ' entrées</span>';
    pag.innerHTML = html;
  } else {
    pag.style.display = 'none';
  }

  /* ---- Statistics ---- */
  var count = totalEntries;
  var total = 0, countPaid = 0;
  for (var j = 0; j < totalEntries; j++) {
    if (entries[j].type === 'ANNUL') continue;
    total += entries[j].montant;
    countPaid++;
  }
  var avg = countPaid ? total / countPaid : null;

  document.getElementById('s-count').textContent = count;
  document.getElementById('s-total').textContent = total.toFixed(2) + ' dh';
  document.getElementById('s-avg').textContent   = avg !== null ? avg.toFixed(2) + ' dh' : '— dh';

  /* ---- Type breakdown ---- */
  var byType = {};
  for (var k = 0; k < totalEntries; k++) {
    var et = entries[k];
    if (!byType[et.type]) byType[et.type] = { count: 0, total: 0 };
    byType[et.type].count++;
    byType[et.type].total += et.montant;
  }
  var keys2 = Object.keys(byType);
  var bd    = document.getElementById('type-breakdown');

  if (keys2.length === 0) {
    bd.innerHTML = '<div class="empty-state small"><p>Aucune donnée.</p></div>';
  } else {
    var cards = '';
    for (var m2 = 0; m2 < keys2.length; m2++) {
      var kk = keys2[m2];
      cards +=
        '<div class="type-card">' +
          '<div class="type-name">' + kk + '</div>' +
          '<div class="type-stats">' + byType[kk].count + ' quittance' + (byType[kk].count > 1 ? 's' : '') + '</div>' +
          '<div class="type-stats" style="font-weight:600;color:var(--text-1);margin-top:2px;">' + byType[kk].total.toFixed(2) + ' dh</div>' +
        '</div>';
    }
    bd.innerHTML = cards;
  }

  drawCharts();
}

/* =====================================================
   CHARTS
   ===================================================== */
function drawSingleChart(canvasId, getVal, suffix, hoverIdx) {
  var canvas = document.getElementById(canvasId);
  var ctx    = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  var pad    = { top: Math.round(h * 0.16), bottom: Math.round(h * 0.18), left: Math.round(w * 0.015), right: Math.round(w * 0.015) };
  var chartW = w - pad.left - pad.right;
  var chartH = h - pad.top - pad.bottom;
  var keys   = chartMeta.keys;
  var barCount = keys.length;
  if (barCount === 0) return [];

  var gap  = Math.round(w * 0.012);
  var barW = Math.min(Math.round(w * 0.08), Math.floor((chartW - (barCount - 1) * gap) / barCount));
  var maxVal = 0;
  for (var i = 0; i < barCount; i++) { var v = getVal(i); if (v > maxVal) maxVal = v; }
  var scale   = maxVal > 0 ? chartH / maxVal : 1;
  var offsetX = pad.left + (chartW - (barW * barCount + (barCount - 1) * gap)) / 2;

  var colors    = chartMeta.colors;
  var textColor = chartMeta.textColor;
  var mutedColor = chartMeta.mutedColor;
  var fs = Math.max(10, Math.round(h / 16));
  var bars = [];

  for (var i = 0; i < barCount; i++) {
    var val   = getVal(i);
    var barH  = val * scale;
    var x     = offsetX + i * (barW + gap);
    var y     = pad.top + chartH - barH;
    var isHov = i === hoverIdx;
    bars.push({ x: x, y: y, w: barW, h: barH, idx: i });

    /* Bar shadow when hovered */
    ctx.save();
    if (isHov) {
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur  = Math.round(fs * 1.5);
    }
    ctx.globalAlpha = isHov ? 1 : 0.80;

    /* Rounded top bar */
    var r = Math.min(4, barW / 2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    if (barH >= r * 2) {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      ctx.rect(x, y, barW, barH);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* Value label above bar */
    var dispVal = suffix ? val.toFixed(0) + ' ' + suffix : String(val);
    ctx.fillStyle = textColor;
    ctx.font = 'bold ' + fs + 'px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(dispVal, x + barW / 2, y - 3);

    /* Key label below bar */
    ctx.fillStyle    = mutedColor;
    ctx.font         = Math.round(fs * 0.85) + 'px Inter, sans-serif';
    ctx.textBaseline = 'top';
    var label = keys[i].length > 7 ? keys[i].substring(0, 7) + '..' : keys[i];
    ctx.fillText(label, x + barW / 2, pad.top + chartH + 5);

    /* Hover tooltip (bottom-left) */
    if (isHov) {
      ctx.fillStyle    = textColor;
      ctx.font         = 'bold ' + Math.round(fs * 1.05) + 'px Inter, sans-serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(keys[i] + ': ' + dispVal, 8, h - 6);
    }
  }
  return bars;
}

function drawCharts() {
  var area  = document.getElementById('charts-area');
  var gfsBtn = document.getElementById('btn-graphics-fullscreen');
  var byType = {};
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (!byType[e.type]) byType[e.type] = { count: 0, total: 0 };
    byType[e.type].count++;
    byType[e.type].total += e.montant;
  }
  var keys = Object.keys(byType);
  if (keys.length === 0) {
    area.style.display   = 'none';
    gfsBtn.style.display = 'none';
    return;
  }
  area.style.display   = 'flex';
  gfsBtn.style.display = 'inline-flex';

  var c1 = document.getElementById('chart-bar');
  var c2 = document.getElementById('chart-count-bar');
  if (graphicsFullscreen) {
    var cw = Math.min(Math.round(window.innerWidth * 0.86), 1600);
    c1.width = cw; c1.height = Math.round(cw * 0.45);
    c2.width = cw; c2.height = Math.round(cw * 0.45);
  } else {
    c1.width = 600; c1.height = 240;
    c2.width = 600; c2.height = 240;
  }

  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  chartMeta.keys      = keys;
  chartMeta.colors    = ['#7C3AED', '#EC4899', '#059669', '#D97706', '#0EA5E9', '#EF4444', '#8B5CF6', '#14B8A6'];
  chartMeta.textColor  = isDark ? '#F9FAFB' : '#111827';
  chartMeta.mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  chartMeta.bars      = drawSingleChart('chart-bar',       function(i) { return byType[keys[i]].total; }, 'dh', chartMeta.hoverBar);
  chartMeta.countBars = drawSingleChart('chart-count-bar', function(i) { return byType[keys[i]].count; }, '',   chartMeta.hoverCount);
}

function setupChartHover(canvasId, metaKey) {
  var canvas = document.getElementById(canvasId);
  canvas.addEventListener('mousemove', function(e) {
    var rect  = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top)  * scaleY;
    var bars  = chartMeta[metaKey];
    var found = -1;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        found = i;
        break;
      }
    }
    if (metaKey === 'bars') chartMeta.hoverBar   = found;
    else                    chartMeta.hoverCount = found;
    drawCharts();
  });
  canvas.addEventListener('mouseleave', function() {
    if (metaKey === 'bars') chartMeta.hoverBar   = -1;
    else                    chartMeta.hoverCount = -1;
    drawCharts();
  });
}

setupChartHover('chart-bar',       'bars');
setupChartHover('chart-count-bar', 'countBars');

/* Window resize — redraw fullscreen charts */
var resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    if (graphicsFullscreen) drawCharts();
  }, 100);
});
