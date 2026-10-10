/* =====================================================
   azkar.js — Popup Azkar quand l'utilisateur est AFK
   ===================================================== */

var AZKAR_LIST = [
  'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
  'سُبْحَانَ اللهِ وَبِحَمْدِهِ سُبْحَانَ اللهِ الْعَظِيمِ',
  'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  'أَسْتَغْفِرُ اللهَ الْعَظِيمَ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
  'سُبْحَانَ اللهِ',
  'الْحَمْدُ لِلَّهِ',
  'اللهُ أَكْبَرُ',
  'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
  'رَضِيتُ بِاللهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا',
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
  'حَسْبِيَ اللهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم قُلْ هُوَ ٱللَّهُ أَحَدٌ، ٱللَّهُ ٱلصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
  'اللّهُـمَّ بِكَ أَصْـبَحْنا وَبِكَ أَمْسَـينا ، وَبِكَ نَحْـيا وَبِكَ نَمُـوتُ وَإِلَـيْكَ النُّـشُور',
  'سُبْحـانَ اللهِ وَبِحَمْـدِهِ عَدَدَ خَلْـقِه ، وَرِضـا نَفْسِـه ، وَزِنَـةَ عَـرْشِـه ، وَمِـدادَ كَلِمـاتِـه',
  'اللّهُـمَّ عافِـني في بَدَنـي ، اللّهُـمَّ عافِـني في سَمْـعي ، اللّهُـمَّ عافِـني في بَصَـري ، لا إلهَ إلاّ أَنْـتَ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  'اللّهُـمَّ إِنّـي أَعـوذُ بِكَ مِنَ الْكُـفر ، وَالفَـقْر ، وَأَعـوذُ بِكَ مِنْ عَذابِ القَـبْر ، لا إلهَ إلاّ أَنْـتٍَ',
  'يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَـرْفَةَ عَيْنٍ',
  'أَعـوذُ بِكَلِمـاتِ اللّهِ التّـامّـاتِ مِنْ شَـرِّ ما خَلَـق',
  'اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ',
  'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنْ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنْ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ، وَقَهْرِ الرِّجَالِ',
  'يَا رَبِّ , لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ , وَلِعَظِيمِ سُلْطَانِكَ',
  'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، عَلَيْكَ تَوَكَّلْتُ ، وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ , مَا شَاءَ اللَّهُ كَانَ ، وَمَا لَمْ يَشَأْ لَمْ يَكُنْ ، وَلا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ , أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ ، وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا , اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي ، وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا ، إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ',
];

var AZKAR_AFK_MS     = 60 * 1000;  /* 60 s d'inactivité avant affichage */
var AZKAR_VISIBLE_MS = 0.3 * 1000;   /* auto-fermeture 1 s après retour activité */

var _azkarIdleTimer = null;
var _azkarAutoHide  = null;
var _azkarLastIdx   = -1;
var _azkarShowing   = false;

function _pickAzkar() {
  var next;
  do {
    next = Math.floor(Math.random() * AZKAR_LIST.length);
  } while (next === _azkarLastIdx && AZKAR_LIST.length > 1);
  _azkarLastIdx = next;
  return AZKAR_LIST[next];
}

/* Afficher le popup — reste visible jusqu'à activité ou fermeture manuelle */
function _showAzkar() {
  var el = document.getElementById('azkar-dialog');
  if (!el || _azkarShowing) return;
  var z = _pickAzkar();
  document.getElementById('azkar-ar').textContent = z;
  el.classList.add('open');
  _azkarShowing = true;
  clearTimeout(_azkarAutoHide);
  _azkarAutoHide = null;
}

/* Fermer le popup */
function _hideAzkar() {
  var el = document.getElementById('azkar-dialog');
  if (el) el.classList.remove('open');
  _azkarShowing = false;
  clearTimeout(_azkarAutoHide);
  _azkarAutoHide = null;
}

/* Relancer le timer AFK depuis zéro */
function _resetAzkarIdle() {
  clearTimeout(_azkarIdleTimer);
  _azkarIdleTimer = setTimeout(_showAzkar, AZKAR_AFK_MS);
}

/* Appelé à chaque activité utilisateur */
function _onUserActivity() {
  if (_azkarShowing) {
    /* Popup visible → démarrer/redémarrer le compte à rebours de fermeture (12 s) */
    clearTimeout(_azkarAutoHide);
    _azkarAutoHide = setTimeout(function() {
      _hideAzkar();
      _resetAzkarIdle();
    }, AZKAR_VISIBLE_MS);
  } else {
    /* Pas de popup → relancer le timer AFK */
    _resetAzkarIdle();
  }
}

function initAzkar() {
  _azkarIdleTimer = setTimeout(_showAzkar, AZKAR_AFK_MS);
  ['pointerdown', 'keydown', 'pointermove', 'wheel', 'touchstart', 'scroll']
    .forEach(function(ev) {
      document.addEventListener(ev, _onUserActivity, { passive: true });
    });
}

document.addEventListener('DOMContentLoaded', initAzkar);

/* Fermeture manuelle (bouton X) — relance le timer AFK */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('azkar-close') || e.target.closest('.azkar-close')) {
    _hideAzkar();
    _resetAzkarIdle();
  }
});