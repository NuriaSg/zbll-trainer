/* ══════════════════════════════════════════════════════════════
   ZBLL Trainer — app.js
   Vanilla JS · No dependencies · PWA ready
   ══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
const S = {
  cases:        [],        // raw entries from JSON
  grouped:      {},        // { setName: { caseName: Entry[] } }
  selection:    new Set(), // "set||caseName" keys
  openSets:     new Set(), // which ZBLL sets (H, U, …) are expanded
  openSubsets:  new Set(), // which "Set 1, Set 2…" blocks are expanded — "U||s1"
  times:        {},        // { "set||case": { set, case, times: [{id,time,ts}] } }
  timer: {
    phase:      'IDLE',    // 'IDLE' | 'READY' | 'RUNNING'
    start:      0,
    elapsed:    0,
    raf:        null,
  },
  currentEntry: null,      // entry currently shown as scramble
  lastEntry:    null,      // entry just solved (used for result display)
  lastRecorded: null,      // { key, ts, ms } — último tiempo guardado (para descartar)
  sortCol:      'set',
  sortDir:      1,
  installPrompt: null,
  expandedKey:  null,      // key of the currently expanded row in the stats table
  session: {
    active: false,
    target: 20,
    done: 0,
    weakKeys: [],
    times: [],
  },
  forcedNextKey: null,
  caseShownCounts: {},
  recentCaseKeys: [],
  study:             {},        // { "set||case": { studyAlg, notes, updatedAt } }
  studyCurrentKey:   null,
  studyEditingAlg:   false,
  studyEditingNotes: false,
  appView:           'practice', // 'practice' | 'study' | 'stats'
};

// ══════════════════════════════════════════════════════════════
// DOM REFERENCES
// ══════════════════════════════════════════════════════════════
const $id = id => document.getElementById(id);

const DOM = {
  // Header
  sidebarToggle:   $id('sidebar-toggle'),
  sidebar:         $id('sidebar'),
  overlay:         $id('sidebar-overlay'),
  selectedBadge:   $id('selected-count-badge'),
  installBtn:      $id('install-btn'),
  // Selector
  accordion:       $id('accordion'),
  selectAllBtn:    $id('select-all-btn'),
  deselectAllBtn:  $id('deselect-all-btn'),
  collapseAllBtn:  $id('collapse-all-btn'),
  caseSearch:      $id('case-search'),
  filterSlowBtn:   $id('filter-slow-btn'),
  filterLowBtn:    $id('filter-low-btn'),
  filterUnseenBtn: $id('filter-unseen-btn'),
  // Info bar
  infoSet:         $id('info-set'),
  infoCase:        $id('info-case'),
  infoAlgCount:    $id('info-alg-count'),
  // Scramble
  practiceTop:     $id('practice-top'),
  scrambleMoves:   $id('scramble-moves'),
  copySetupBtn:    $id('copy-setup-btn'),
  nextScrambleBtn: $id('next-scramble-btn'),
  // Timer
  timerArea:       $id('timer-area'),
  timerDisplay:    $id('timer-display'),
  timerValue:      $id('timer-value'),
  timerHint:       $id('timer-hint'),
  // Result
  resultSection:   $id('result-section'),
  resultTime:      $id('result-time'),
  discardLastTimeBtn: $id('discard-last-time-btn'),
  repeatWeakBtn:   $id('repeat-weak-btn'),
  openStudyBtn:    $id('open-study-btn'),
  caseImg:         $id('case-img'),
  caseImgFallback: $id('case-img-fallback'),
  resultSetupText: $id('result-setup-text'),
  resultAlgText:   $id('result-alg-text'),
  resultCaseName:  $id('result-case-name'),
  // Stats
  statsPanel:      $id('stats-panel'),
  statsTbody:      $id('stats-tbody'),
  statsEmpty:      $id('stats-empty'),
  statsSummary:    $id('stats-summary'),
  statsSearch:     $id('stats-search'),
  statsSetFilter:  $id('stats-set-filter'),
  statsLevelFilter:$id('stats-level-filter'),
  exportBtn:       $id('export-btn'),
  importFile:      $id('import-file'),
  clearBtn:        $id('clear-stats-btn'),
  // Nav & Study
  navBtns:         document.querySelectorAll('.app-nav-btn'),
  sidebarTitle:    $id('sidebar-title'),
  studyView:       $id('study-view'),
  studyEmpty:      $id('study-empty'),
  studyDetail:     $id('study-detail'),
  studySetBadge:   $id('study-set-badge'),
  studyCaseName:   $id('study-case-name'),
  studyPrevBtn:    $id('study-prev-btn'),
  studyNextBtn:    $id('study-next-btn'),
  studyCaseImg:    $id('study-case-img'),
  studyImgFallback:$id('study-img-fallback'),
  studySetupMoves:   $id('study-setup-moves'),
  studySetupCopyBtn: $id('study-setup-copy-btn'),
  studyOfficialAlgs: $id('study-official-algs'),
  studyAlgInput:     $id('study-alg-input'),
  studyMyAlgView:    $id('study-my-alg-view'),
  studyMyAlgDisplay: $id('study-my-alg-display'),
  studyMyAlgEmpty:   $id('study-my-alg-empty'),
  studyAlgEditBtn:   $id('study-alg-edit-btn'),
  studyNotesBelow:   $id('study-notes-below'),
  studyNotesDisplay: $id('study-notes-display'),
  studyNotesEditBtn: $id('study-notes-edit-btn'),
  studyNotesBlock:   $id('study-notes-block'),
  studyNotesInput:   $id('study-notes-input'),
  studySaveHint:   $id('study-save-hint'),
  studyPracticeBtn:$id('study-practice-btn'),
  // Toast & Modal
  toastContainer:  $id('toast-container'),
  confirmModal:    $id('confirm-modal'),
  modalTitle:      $id('modal-title'),
  modalBody:       $id('modal-body'),
  modalCancel:     $id('modal-cancel'),
  modalConfirm:    $id('modal-confirm'),
};

// ══════════════════════════════════════════════════════════════
// localStorage KEYS
// ══════════════════════════════════════════════════════════════
const LS = {
  SELECTION: 'zbll_selection',
  TIMES:     'zbll_times',
  OPEN_SETS:    'zbll_open_sets',
  OPEN_SUBSETS: 'zbll_open_subsets',
  STUDY:        'zbll_study',
};
const MAX_TIMES_PER_CASE = 50;
const STUDY_OFFICIAL_ALG_PREVIEW = 5;
const STATS_ALG_PREVIEW = 3;
/** Caso dominado: último solve o media de los 3 últimos por debajo de 3.0s */
const DOMINATED_MAX_MS = 3000;
const RECENT_CASE_WINDOW = 2;
/** Mezcla válida: sin x/y/z/M/E/S y como máximo 2 wide (r f b…) en minúscula */
const MAX_WIDE_MOVES = 2;
const ROTATION_SLICE_MOVE = /^[xyzmse](?:2|')?$/i;
const WIDE_MOVE = /^[rludfbd](?:2|')?$/;

// ══════════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════════

/** Format milliseconds → SS.mmm (e.g. 12.345) */
function fmtTime(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  const total  = Math.round(ms);
  const secs   = Math.floor(total / 1000);
  const millis = total % 1000;
  return `${secs}.${String(millis).padStart(3, '0')}`;
}

/** Invert a move sequence: reverse order + invert each move */
function invertScramble(scramble) {
  if (!scramble) return '';
  return scramble.trim().split(/\s+/).filter(Boolean).reverse().map(m => {
    if (m.endsWith("'")) return m.slice(0, -1);
    if (m.endsWith('2')) return m;   // X2 inverse is X2
    return m + "'";
  }).join(' ');
}

/**
 * Ruta local de la imagen del caso (una por set+caso, 256px).
 * Generar con: node scripts/generate-case-images.mjs
 */
function caseImageUrl(setName, caseName) {
  return `./images/cases/${setName}/${caseName}.png`;
}

/** Fallback VisualCube si falta la imagen local */
function buildVisualCubeUrl(algorithm, size = 200) {
  const inv = invertScramble(algorithm);
  const enc = encodeURIComponent(inv);
  return `https://visualcube.api.cubing.net/visualcube.php?fmt=png&size=${size}&stage=ll&view=plan&sch=yrgwob&alg=${enc}`;
}

/** Carga diagrama del caso: imagen local primero, VisualCube si falla */
function loadCaseDiagram(imgEl, fallbackEl, setName, caseName, algorithmFallback = '') {
  if (!imgEl) return;
  if (!setName || !caseName) {
    imgEl.classList.add('hidden');
    imgEl.removeAttribute('src');
    fallbackEl?.classList.remove('hidden');
    return;
  }

  const url = caseImageUrl(setName, caseName);
  imgEl.loading = 'eager';
  imgEl.decoding = 'async';

  fallbackEl?.classList.add('hidden');
  imgEl.classList.remove('hidden');

  imgEl.onload = () => {
    imgEl.classList.remove('hidden');
    fallbackEl?.classList.add('hidden');
  };
  imgEl.onerror = () => {
    if (algorithmFallback?.trim()) {
      const vcUrl = buildVisualCubeUrl(algorithmFallback);
      imgEl.onerror = () => {
        imgEl.classList.add('hidden');
        imgEl.removeAttribute('src');
        fallbackEl?.classList.remove('hidden');
      };
      imgEl.src = vcUrl;
      return;
    }
    imgEl.classList.add('hidden');
    imgEl.removeAttribute('src');
    fallbackEl?.classList.remove('hidden');
  };

  imgEl.src = url;
}

function getUniqueAlgorithmEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const alg = entry.algorithm?.trim();
    if (!alg || seen.has(alg)) continue;
    seen.add(alg);
    out.push(entry);
  }
  return out;
}

function copyTextToClipboard(text, okMsg, errMsg) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(
    () => showToast(okMsg ?? t('copy.ok'), 'success'),
    () => showToast(errMsg ?? t('copy.error'), 'error')
  );
}

/** Primera mezcla cómoda del caso (orden en datos); sin rotación aleatoria. */
function pickFirstAcceptableScrambleEntry(entries) {
  const pool = uniqueScrambleEntries(filterAcceptableScrambleEntries(entries));
  return pool[0] ?? null;
}

/** Mezcla fija en Aprender: primera cómoda del caso. */
function renderStudyCaseSetup(entries) {
  if (!DOM.studySetupMoves) return;

  const chosen = pickFirstAcceptableScrambleEntry(entries);
  const scramble = chosen?.scramble?.trim() ?? '';

  if (!scramble) {
    DOM.studySetupMoves.innerHTML = `<span class="study-setup-empty">${esc(t('study.noSetup'))}</span>`;
    DOM.studySetupCopyBtn?.setAttribute('disabled', 'disabled');
    if (DOM.studySetupCopyBtn) DOM.studySetupCopyBtn.dataset.text = '';
    return;
  }

  DOM.studySetupMoves.innerHTML = formatMoves(scramble);
  DOM.studySetupCopyBtn?.removeAttribute('disabled');
  if (DOM.studySetupCopyBtn) DOM.studySetupCopyBtn.dataset.text = scramble;
}

function buildCollapsibleAlgsHtml(entries, previewCount, classes) {
  const unique = getUniqueAlgorithmEntries(entries);
  const visible = unique.slice(0, previewCount);
  const hidden  = unique.slice(previewCount);
  const { item: itemCls, text: textCls, toggle: toggleCls, more: moreCls, empty: emptyCls } = classes;

  const itemHtml = entry => `
    <div class="${itemCls}">
      <span class="${textCls}">${esc(entry.algorithm)}</span>
      <button type="button" class="btn-copy" data-text="${esc(entry.algorithm)}">${esc(t('copy'))}</button>
    </div>`;

  if (!unique.length) {
    return `<p class="${emptyCls}">${esc(t('algs.none'))}</p>`;
  }

  let html = visible.map(itemHtml).join('');
  if (hidden.length) {
    html += `
      <button type="button" class="btn btn-ghost btn-sm ${toggleCls}" aria-expanded="false">
        ${esc(showMoreAlgsLabel(hidden.length))}
      </button>
      <div class="${moreCls} hidden">
        ${hidden.map(itemHtml).join('')}
      </div>`;
  }
  return html;
}

function bindCollapsibleAlgs(container) {
  if (!container) return;
  container.querySelectorAll('.study-algs-toggle, .details-algs-toggle').forEach(toggle => {
    const more = toggle.nextElementSibling;
    if (!more?.classList.contains('study-algs-more') && !more?.classList.contains('details-algs-more')) return;
    const hiddenCount = more.querySelectorAll('.study-official-item, .details-alg-item').length;
    toggle.addEventListener('click', () => {
      const collapsed = more.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.textContent = collapsed
        ? showMoreAlgsLabel(hiddenCount)
        : t('algs.hideExtra');
    });
  });
}

function renderStudyOfficialAlgs(entries) {
  if (!DOM.studyOfficialAlgs) return;

  DOM.studyOfficialAlgs.innerHTML = buildCollapsibleAlgsHtml(entries, STUDY_OFFICIAL_ALG_PREVIEW, {
    item: 'study-official-item',
    text: 'study-official-text',
    toggle: 'study-algs-toggle',
    more: 'study-algs-more',
    empty: 'study-no-algs',
  });

  bindCollapsibleAlgs(DOM.studyOfficialAlgs);
  DOM.studyOfficialAlgs.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.text, t('copy.alg')));
  });
}

function buildStatsAlgsHtml(entries) {
  return buildCollapsibleAlgsHtml(entries, STATS_ALG_PREVIEW, {
    item: 'details-alg-item',
    text: 'details-alg-text',
    toggle: 'details-algs-toggle',
    more: 'details-algs-more',
    empty: 'details-no-algs',
  });
}

function refreshStudyPersonalUI() {
  const alg   = DOM.studyAlgInput?.value?.trim() ?? '';
  const notes = DOM.studyNotesInput?.value?.trim() ?? '';

  if (S.studyEditingAlg) {
    DOM.studyAlgInput?.classList.remove('hidden');
    DOM.studyAlgEditBtn?.classList.add('hidden');
    DOM.studyMyAlgView?.classList.add('hidden');
  } else {
    DOM.studyAlgInput?.classList.add('hidden');
    DOM.studyAlgEditBtn?.classList.remove('hidden');
    DOM.studyMyAlgView?.classList.remove('hidden');

    if (alg) {
      DOM.studyMyAlgDisplay?.classList.remove('hidden');
      DOM.studyMyAlgEmpty?.classList.add('hidden');
      if (DOM.studyMyAlgDisplay) DOM.studyMyAlgDisplay.textContent = alg;
    } else {
      DOM.studyMyAlgDisplay?.classList.add('hidden');
      DOM.studyMyAlgEmpty?.classList.remove('hidden');
    }
  }

  if (notes && !S.studyEditingNotes) {
    DOM.studyNotesBelow?.classList.remove('hidden');
    DOM.studyNotesBlock?.classList.add('hidden');
    if (DOM.studyNotesDisplay) DOM.studyNotesDisplay.textContent = notes;
  } else {
    DOM.studyNotesBelow?.classList.add('hidden');
    DOM.studyNotesBlock?.classList.remove('hidden');
  }
}

/** Escape HTML for safe innerHTML insertion */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Composite key for a set+case pair */
function makeKey(set, cas) { return `${set}||${cas}`; }
function parseKey(key)      { const [set, cas] = key.split('||'); return { set, cas }; }

function makeSubsetKey(setName, subsetNum) { return `${setName}||s${subsetNum}`; }

/** H1, H2, … H10 (numeric), not H1, H10, H2 (alphabetic) */
function compareCaseNames(a, b) {
  const ma = String(a).match(/^(.+?)(\d+)$/);
  const mb = String(b).match(/^(.+?)(\d+)$/);
  if (ma && mb) {
    const byPrefix = ma[1].localeCompare(mb[1]);
    if (byPrefix !== 0) return byPrefix;
    return parseInt(ma[2], 10) - parseInt(mb[2], 10);
  }
  return String(a).localeCompare(String(b));
}

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 3000) {
  const el   = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = { success: '✅', error: '❌', info: 'ℹ️' }[type] ?? 'ℹ️';
  el.innerHTML = `<span aria-hidden="true">${icon}</span><span>${esc(msg)}</span>`;
  DOM.toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

// ══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
function showConfirm(title, body, onOk) {
  DOM.modalTitle.textContent = title;
  DOM.modalBody.textContent  = body;
  DOM.confirmModal.classList.remove('hidden');

  const close = () => DOM.confirmModal.classList.add('hidden');
  DOM.modalCancel.onclick  = close;
  DOM.modalConfirm.onclick = () => { close(); onOk(); };

  // Close on backdrop click
  DOM.confirmModal.onclick = e => { if (e.target === DOM.confirmModal) close(); };
  // Close on Escape
  const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// ══════════════════════════════════════════════════════════════
// DATA LOADING
// ══════════════════════════════════════════════════════════════
async function loadData() {
  DOM.scrambleMoves.innerHTML = `<span class="scramble-placeholder">${esc(t('practice.loading'))}</span>`;
  try {
    const resp = await fetch('./zbll_cases.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    S.cases = await resp.json();
    groupCases();
  } catch (err) {
    console.error('Failed to load zbll_cases.json:', err);
    showToast(t('toast.loadError', { msg: err.message }), 'error', 8000);
    DOM.scrambleMoves.innerHTML = `<span class="scramble-placeholder">${esc(t('practice.loadError'))}</span>`;
  }
}

/** Group entries by set_name → case_name → [Entry…] */
function groupCases() {
  S.grouped = {};
  for (const entry of S.cases) {
    const { set_name, case_name } = entry;
    if (!S.grouped[set_name]) S.grouped[set_name] = {};
    if (!S.grouped[set_name][case_name]) S.grouped[set_name][case_name] = [];
    S.grouped[set_name][case_name].push(entry);
  }
}

// ══════════════════════════════════════════════════════════════
// SELECTION — persisted in localStorage
// ══════════════════════════════════════════════════════════════
function saveSelection() {
  localStorage.setItem(LS.SELECTION, JSON.stringify([...S.selection]));
  updateSelectionBadge();
}

function resetPracticeDistributionMemory() {
  S.caseShownCounts = {};
  S.recentCaseKeys = [];
}

function registerCaseShown(key) {
  if (!key) return;
  S.caseShownCounts[key] = (S.caseShownCounts[key] ?? 0) + 1;
  S.recentCaseKeys.push(key);
  if (S.recentCaseKeys.length > RECENT_CASE_WINDOW) {
    S.recentCaseKeys.shift();
  }
}

function onSelectionChange() {
  saveSelection();
  resetPracticeDistributionMemory();
  if (S.selection.size === 0) {
    displayScramble(null);
    hideResult();
  } else {
    displayScramble(pickRandomEntry());
  }
}

function loadSelection() {
  try {
    const raw = localStorage.getItem(LS.SELECTION);
    if (raw) S.selection = new Set(JSON.parse(raw));
  } catch (_) { S.selection = new Set(); }
}

function loadOpenSets() {
  try {
    const raw = localStorage.getItem(LS.OPEN_SETS);
    if (raw) S.openSets = new Set(JSON.parse(raw));
  } catch (_) { S.openSets = new Set(); }
}

function saveOpenSets() {
  localStorage.setItem(LS.OPEN_SETS, JSON.stringify([...S.openSets]));
}

function loadOpenSubsets() {
  try {
    const raw = localStorage.getItem(LS.OPEN_SUBSETS);
    if (raw) S.openSubsets = new Set(JSON.parse(raw));
  } catch (_) { S.openSubsets = new Set(); }
}

function saveOpenSubsets() {
  localStorage.setItem(LS.OPEN_SUBSETS, JSON.stringify([...S.openSubsets]));
}

function collapseAllAccordion() {
  S.openSets.clear();
  S.openSubsets.clear();
  saveOpenSets();
  saveOpenSubsets();
  renderAccordion(DOM.caseSearch.value);
}

/** Return flat list of all entries for selected cases */
function getSelectedEntries() {
  const out = [];
  for (const key of S.selection) {
    const { set, cas } = parseKey(key);
    const entries = S.grouped[set]?.[cas];
    if (entries) out.push(...entries);
  }
  return out;
}

function updateSelectionBadge() {
  const n = S.selection.size;
  DOM.selectedBadge.textContent = formatSelectedCases(n);
  DOM.selectedBadge.classList.toggle('active', n > 0);
}

function listAllCaseKeys() {
  const out = [];
  for (const [setName, cases] of Object.entries(S.grouped)) {
    for (const cn of Object.keys(cases)) out.push(makeKey(setName, cn));
  }
  return out;
}

function getCaseMetricsByKey(key) {
  const rec = S.times[key];
  const count = rec?.times?.length ?? 0;
  const mean = count ? rec.times.reduce((s, t) => s + t.time, 0) / count : null;
  return { count, mean };
}

/** Estadísticas de media entre casos ya practicados del pool */
function getPracticeMeanStats(keys) {
  const means = keys
    .map(k => getCaseMetricsByKey(k).mean)
    .filter(v => v != null);
  const min = means.length ? Math.min(...means) : 0;
  const max = means.length ? Math.max(...means) : 0;
  return { min, max, range: Math.max(1, max - min) };
}

function getPracticeCountStats(keys) {
  const counts = keys
    .map(k => getCaseMetricsByKey(k).count)
    .filter(v => v > 0);
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  return { min, max, range: Math.max(1, max - min) };
}

/**
 * Peso para elegir el siguiente caso en práctica libre.
 * - Sin solves: prioridad alta frente a practicados.
 * - Con solves: combina debilidad + poco practicado + anti-repetición reciente.
 */
function computeCasePickWeight(key, meanStats, countStats, shownCount = 0, wasRecent = false) {
  const { count, mean } = getCaseMetricsByKey(key);
  if (count === 0) return 12;

  let meanNorm = 0.5;
  if (mean != null) {
    meanNorm = Math.max(0, Math.min(1, (mean - meanStats.min) / meanStats.range));
  }
  const lessPracticedNorm = Math.max(0, Math.min(1, (countStats.max - count) / countStats.range));

  const weaknessBoost = 0.9 + 1.1 * meanNorm;
  const lessPracticedBoost = 1 + 1.25 * lessPracticedNorm;
  const historicalRepetitionDampen = 1 / (1 + Math.log1p(count) * 0.55);
  const shownDampen = 1 / (1 + shownCount * 0.75);
  const recentDampen = wasRecent ? 0.35 : 1;

  return weaknessBoost * lessPracticedBoost * historicalRepetitionDampen * shownDampen * recentDampen;
}

function rankWeakCaseKeys(keys) {
  const means = keys.map(k => getCaseMetricsByKey(k).mean).filter(v => v != null);
  const meanMin = means.length ? Math.min(...means) : 0;
  const meanMax = means.length ? Math.max(...means) : 0;
  const meanRange = Math.max(1, meanMax - meanMin);
  const countStats = getPracticeCountStats(keys);

  return [...keys].sort((a, b) =>
    computeCasePickWeight(b, { min: meanMin, max: meanMax, range: meanRange }, countStats, 0, false)
    - computeCasePickWeight(a, { min: meanMin, max: meanMax, range: meanRange }, countStats, 0, false)
  );
}

function classifyCaseDifficulty(key) {
  const { count } = getCaseMetricsByKey(key);
  if (count === 0) return { label: 'nuevo', cls: 'new' };

  const times = S.times[key]?.times ?? [];
  const last = times[times.length - 1]?.time ?? null;
  const recent = times.slice(-3).map(t => t.time);
  const recentMean = recent.length
    ? recent.reduce((s, t) => s + t, 0) / recent.length
    : null;
  const recentSlowCount = recent.filter(t => t >= DOMINATED_MAX_MS).length;

  if (count >= 3 && recentMean != null && recentMean < DOMINATED_MAX_MS) {
    return { label: 'dominado', cls: 'strong' };
  }
  if (count < 3 && last != null && last < DOMINATED_MAX_MS) {
    return { label: 'dominado', cls: 'strong' };
  }

  if (count >= 3 && recentSlowCount >= 2) {
    return { label: 'flojo', cls: 'weak' };
  }
  if (count < 3 && last != null && last >= DOMINATED_MAX_MS) {
    return { label: 'flojo', cls: 'weak' };
  }

  return { label: 'flojo', cls: 'weak' };
}

function updateSessionStatus() {
  if (!DOM.sessionStatus) return;
  if (!S.session.active) {
    DOM.sessionStatus.textContent = '';
    DOM.sessionStatus.classList.add('hidden');
    return;
  }
  DOM.sessionStatus.classList.remove('hidden');
  DOM.sessionStatus.textContent = t('session.label', { done: S.session.done, target: S.session.target });
}

// ══════════════════════════════════════════════════════════════
// ACCORDION SELECTOR UI
// ══════════════════════════════════════════════════════════════

const ALGS_PER_ZBLL_SUBSET = 12;
const SETS_WITHOUT_SUBSETS = new Set(['H']);

function chunkCaseNames(names, size = ALGS_PER_ZBLL_SUBSET) {
  const chunks = [];
  for (let i = 0; i < names.length; i += size) chunks.push(names.slice(i, i + size));
  return chunks;
}

function renderCaseItemHtml(setName, cn, cases) {
  const key  = makeKey(setName, cn);
  const sel  = S.selection.has(key);
  const studyMode = S.appView === 'study';
  const studyActive = studyMode && S.studyCurrentKey === key;
  const cid  = `case-chk-${key.replace(/[^a-z0-9]/gi, '-')}`;
  const alg  = cases[cn][0]?.algorithm;
  const difficulty = classifyCaseDifficulty(key);
  const thumbUrl = caseImageUrl(setName, cn);
  const thumb = `<img class="acc-case-thumb" src="${esc(thumbUrl)}" alt="" loading="lazy" decoding="async" />`;
  const rowTag = studyMode ? 'div' : 'label';
  const rowAttrs = studyMode
    ? `role="button" tabindex="0" aria-label="${esc(t('acc.openLearn', { case: cn }))}"`
    : `for="${cid}"`;
  const rowClass = `acc-case-item${!studyMode && sel ? ' selected' : ''}${studyActive ? ' study-active' : ''}`;
  const checkboxHtml = studyMode ? '' : `
      <input
        type="checkbox"
        id="${cid}"
        class="case-chk"
        data-key="${esc(key)}"
        ${sel ? 'checked' : ''}
        aria-label="${esc(cn)}"
      />`;
  return `
    <${rowTag} class="${rowClass}" data-key="${esc(key)}" ${rowAttrs}>${checkboxHtml}
      <span class="acc-case-name">${esc(cn)}</span>
      <span class="acc-case-diff acc-case-diff-${difficulty.cls}">${esc(diffLabel(difficulty.cls))}</span>
      ${thumb}
    </${rowTag}>`;
}

function buildAccCasesHtml(setName, allNames, filtered, cases, searchActive = false) {
  const studyMode = S.appView === 'study';
  if (SETS_WITHOUT_SUBSETS.has(setName)) {
    return filtered.map(cn => renderCaseItemHtml(setName, cn, cases)).join('');
  }

  const filteredSet = new Set(filtered);
  return chunkCaseNames(allNames)
    .map((chunk, idx) => {
      const visible = chunk.filter(cn => filteredSet.has(cn));
      if (!visible.length) return '';
      const subsetNum = idx + 1;
      const subsetKey = makeSubsetKey(setName, subsetNum);
      const subsetOpen = S.openSubsets.has(subsetKey) || searchActive;
      const selInChunk = visible.filter(cn => S.selection.has(makeKey(setName, cn))).length;
      const allChunkSel = selInChunk === visible.length;
      const subsetId = `subset-chk-${setName}-${subsetNum}`;
      const subsetCheckHtml = studyMode ? '' : `
            <input
              type="checkbox"
              class="acc-subset-check"
              id="${subsetId}"
              data-set="${esc(setName)}"
              data-cases="${esc(visible.join(','))}"
              aria-label="${esc(t('acc.selectSubset', { n: subsetNum, set: setName }))}"
              ${allChunkSel ? 'checked' : ''}
            />`;
      const subsetBadge = studyMode ? String(visible.length) : `${selInChunk}/${visible.length}`;
      return `
        <div class="acc-subset${subsetOpen ? ' open' : ''}" data-subset="${subsetNum}">
          <div class="acc-subset-header" role="button" tabindex="0" aria-expanded="${subsetOpen}">
            <span class="acc-toggle-icon" aria-hidden="true">▶</span>${subsetCheckHtml}
            <span class="acc-subset-label">${esc(t('acc.subset', { n: subsetNum }))}</span>
            <span class="acc-subset-badge">${subsetBadge}</span>
          </div>
          <div class="acc-subset-cases">
            ${visible.map(cn => renderCaseItemHtml(setName, cn, cases)).join('')}
          </div>
        </div>`;
    })
    .join('');
}

function refreshSubsetHeader(subsetEl, setName, caseNames) {
  const chk   = subsetEl?.querySelector('.acc-subset-check');
  const badge = subsetEl?.querySelector('.acc-subset-badge');
  if (!chk) return;

  const selCount = caseNames.filter(cn => S.selection.has(makeKey(setName, cn))).length;
  const allSel   = selCount === caseNames.length && caseNames.length > 0;
  const someSel  = selCount > 0 && !allSel;

  chk.checked = allSel;
  chk.indeterminate = someSel;
  if (badge) badge.textContent = `${selCount}/${caseNames.length}`;
}

function refreshAllSubsetHeaders(setEl, setName, allNames, filtered) {
  if (SETS_WITHOUT_SUBSETS.has(setName)) return;

  const filteredSet = new Set(filtered);
  chunkCaseNames(allNames).forEach((chunk, idx) => {
    const visible = chunk.filter(cn => filteredSet.has(cn));
    if (!visible.length) return;
    const subsetEl = setEl.querySelector(`.acc-subset[data-subset="${idx + 1}"]`);
    refreshSubsetHeader(subsetEl, setName, visible);
  });
}

/** Full re-render of accordion, optionally filtered by search string */
function toggleSubset(setName, subsetNum, subsetEl) {
  const wasOpen = subsetEl.classList.contains('open');
  const key = makeSubsetKey(setName, subsetNum);
  subsetEl.classList.toggle('open', !wasOpen);
  subsetEl.querySelector('.acc-subset-header')?.setAttribute('aria-expanded', String(!wasOpen));
  if (!wasOpen) {
    S.openSubsets.add(key);
  } else {
    S.openSubsets.delete(key);
  }
  saveOpenSubsets();
}

function renderAccordion(filter = '') {
  const fl           = filter.toLowerCase().trim();
  const searchActive = fl !== '';
  const studyMode    = S.appView === 'study';
  const sets         = Object.keys(S.grouped).sort();
  DOM.accordion.innerHTML = '';

  for (const setName of sets) {
    const cases     = S.grouped[setName];
    const allNames  = Object.keys(cases).sort(compareCaseNames);
    const filtered  = fl
      ? allNames.filter(cn => cn.toLowerCase().includes(fl) || setName.toLowerCase().includes(fl))
      : allNames;

    if (filtered.length === 0) continue;

    const selCount = filtered.filter(cn => S.selection.has(makeKey(setName, cn))).length;
    const allSel   = selCount === filtered.length && filtered.length > 0;
    const someSel  = selCount > 0 && !allSel;
    const isOpen   = S.openSets.has(setName) || searchActive;

    const setEl = document.createElement('div');
    setEl.className = `acc-set${isOpen ? ' open' : ''}`;
    setEl.dataset.set = setName;

    const setBadgeText = studyMode ? String(filtered.length) : `${selCount}/${filtered.length}`;
    const setCheckHtml = studyMode ? '' : `
        <input
          type="checkbox"
          class="acc-set-check"
          id="set-chk-${setName}"
          aria-label="${esc(t('acc.selectSet', { set: setName }))}"
          ${allSel ? 'checked' : ''}
        />`;
    const setNameHtml = studyMode
      ? `<span class="acc-set-name">${esc(setName)}</span>`
      : `<label class="acc-set-name" for="set-chk-${setName}">${esc(setName)}</label>`;

    setEl.innerHTML = `
      <div class="acc-set-header" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="acc-toggle-icon" aria-hidden="true">▶</span>${setCheckHtml}
        ${setNameHtml}
        <span class="acc-set-badge ${!studyMode && allSel ? 'all-selected' : ''}">
          ${setBadgeText}
        </span>
      </div>
      <div class="acc-cases">
        ${buildAccCasesHtml(setName, allNames, filtered, cases, searchActive)}
      </div>
    `;

    const setChk = setEl.querySelector('.acc-set-check');
    if (setChk) setChk.indeterminate = someSel;

    const hdr = setEl.querySelector('.acc-set-header');
    hdr.addEventListener('click', e => {
      if (e.target.classList.contains('acc-set-check') ||
          e.target.htmlFor?.startsWith('set-chk')) return;
      toggleSet(setName, setEl);
    });
    hdr.addEventListener('keydown', e => {
      if (e.key === ' ') {
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        toggleSet(setName, setEl);
      }
    });

    setChk?.addEventListener('change', e => {
      e.stopPropagation();
      toggleAllInSet(setName, filtered, e.target.checked);
    });

    refreshAllSubsetHeaders(setEl, setName, allNames, filtered);

    // Subset headers: expand/collapse Set 1, Set 2 …
    setEl.querySelectorAll('.acc-subset').forEach(subsetEl => {
      const subsetNum = parseInt(subsetEl.dataset.subset, 10);
      const hdr = subsetEl.querySelector('.acc-subset-header');
      hdr.addEventListener('click', e => {
        if (e.target.classList.contains('acc-subset-check')) return;
        toggleSubset(setName, subsetNum, subsetEl);
      });
      hdr.addEventListener('keydown', e => {
        if (e.key === ' ') {
          e.preventDefault();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          toggleSubset(setName, subsetNum, subsetEl);
        }
      });
    });

    if (!studyMode) {
      setEl.querySelectorAll('.acc-subset-check').forEach(chk => {
        chk.addEventListener('change', e => {
          e.stopPropagation();
          const casesInSubset = chk.dataset.cases.split(',');
          toggleAllInSet(chk.dataset.set, casesInSubset, e.target.checked);
        });
      });
    }

    if (!studyMode) {
      setEl.querySelectorAll('.case-chk').forEach(chk => {
        chk.addEventListener('change', e => {
          e.stopPropagation();
          const key = chk.dataset.key;
          if (e.target.checked) S.selection.add(key);
          else S.selection.delete(key);
          onSelectionChange();
          refreshSetHeader(setEl, setName, filtered);
          refreshAllSubsetHeaders(setEl, setName, allNames, filtered);
          chk.closest('.acc-case-item')?.classList.toggle('selected', e.target.checked);
        });
      });
    }

    DOM.accordion.appendChild(setEl);
  }
}

function toggleSet(setName, setEl) {
  const wasOpen = setEl.classList.contains('open');
  setEl.classList.toggle('open', !wasOpen);
  setEl.querySelector('.acc-set-header')?.setAttribute('aria-expanded', String(!wasOpen));
  if (!wasOpen) {
    S.openSets.add(setName);
  } else {
    S.openSets.delete(setName);
  }
  saveOpenSets();
}

function toggleAllInSet(setName, caseNames, checked) {
  for (const cn of caseNames) {
    const key = makeKey(setName, cn);
    if (checked) S.selection.add(key);
    else S.selection.delete(key);
  }
  onSelectionChange();
  renderAccordion(DOM.caseSearch.value);
}

function refreshSetHeader(setEl, setName, caseNames) {
  const selCount = caseNames.filter(cn => S.selection.has(makeKey(setName, cn))).length;
  const allSel   = selCount === caseNames.length && caseNames.length > 0;
  const someSel  = selCount > 0 && !allSel;

  const badge = setEl.querySelector('.acc-set-badge');
  const chk   = setEl.querySelector('.acc-set-check');
  if (badge) { badge.textContent = `${selCount}/${caseNames.length}`; badge.classList.toggle('all-selected', allSel); }
  if (chk)   { chk.checked = allSel; chk.indeterminate = someSel; }
}

// ══════════════════════════════════════════════════════════════
// SCRAMBLE DISPLAY
// ══════════════════════════════════════════════════════════════

function pickWeighted(pool) {
  const total = pool.reduce((s, x) => s + x.weight, 0);
  if (!pool.length) return null;
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
  let r = Math.random() * total;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1];
}

function scrambleMoveStats(sequence) {
  const moves = sequence?.trim().split(/\s+/).filter(Boolean) ?? [];
  let wideCount = 0;
  let hasRotationSlice = false;
  for (const move of moves) {
    if (ROTATION_SLICE_MOVE.test(move)) hasRotationSlice = true;
    if (WIDE_MOVE.test(move)) wideCount += 1;
  }
  return { wideCount, hasRotationSlice };
}

/** Sin giros/slice; como máximo MAX_WIDE_MOVES wide en minúscula (R U F no cuentan). */
function isScrambleAcceptable(scramble) {
  const { wideCount, hasRotationSlice } = scrambleMoveStats(scramble);
  if (hasRotationSlice) return false;
  if (wideCount > MAX_WIDE_MOVES) return false;
  return true;
}

function filterAcceptableScrambleEntries(entries) {
  if (!entries?.length) return [];
  const withScramble = entries.filter(e => e.scramble?.trim());
  const acceptable = withScramble.filter(e => isScrambleAcceptable(e.scramble));
  if (acceptable.length) return acceptable;

  const noSlice = withScramble.filter(e => !scrambleMoveStats(e.scramble).hasRotationSlice);
  const pool = noSlice.length ? noSlice : withScramble;
  const minWide = Math.min(...pool.map(e => scrambleMoveStats(e.scramble).wideCount));
  return pool.filter(e => scrambleMoveStats(e.scramble).wideCount === minWide);
}

/** Una entrada por texto de mezcla (evita repetir la misma secuencia) */
function uniqueScrambleEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const sc = entry.scramble?.trim();
    if (!sc || seen.has(sc)) continue;
    seen.add(sc);
    out.push(entry);
  }
  return out;
}

/** Mezcla aleatoria entre variantes válidas del mismo caso */
function pickRandomScrambleEntry(entries, avoidScramble = null) {
  if (!entries?.length) return null;

  let pool = uniqueScrambleEntries(filterAcceptableScrambleEntries(entries));
  if (!pool.length) return null;

  if (avoidScramble) {
    const avoid = avoidScramble.trim();
    const other = pool.filter(e => e.scramble?.trim() !== avoid);
    if (other.length) pool = other;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomEntry() {
  const currentKey = S.currentEntry
    ? makeKey(S.currentEntry.set_name, S.currentEntry.case_name)
    : null;
  const avoidScramble = S.currentEntry?.scramble?.trim() ?? null;

  if (S.forcedNextKey) {
    const key = S.forcedNextKey;
    S.forcedNextKey = null;
    const { set, cas } = parseKey(key);
    const entries = S.grouped[set]?.[cas];
    return pickRandomScrambleEntry(entries, avoidScramble);
  }

  const activeKeys = S.session.active
    ? S.session.weakKeys.filter(k => S.selection.has(k))
    : [...S.selection];

  const casePool = [];
  for (const key of activeKeys) {
    const { set, cas } = parseKey(key);
    const entries = S.grouped[set]?.[cas];
    if (entries?.length) casePool.push({ key, entries });
  }
  if (!casePool.length) return null;

  const meanStats = getPracticeMeanStats(activeKeys);
  const countStats = getPracticeCountStats(activeKeys);
  const weighted = casePool.map(c => ({
    ...c,
    weight: computeCasePickWeight(
      c.key,
      meanStats,
      countStats,
      S.caseShownCounts[c.key] ?? 0,
      S.recentCaseKeys.includes(c.key)
    ),
  }));

  const lastKey = S.lastEntry
    ? makeKey(S.lastEntry.set_name, S.lastEntry.case_name)
    : null;
  if (lastKey && weighted.length > 1) {
    const again = weighted.find(w => w.key === lastKey);
    if (again) again.weight *= 0.25;
  }

  const picked = pickWeighted(weighted);
  const sameCase = picked.key === currentKey;
  const singleCase = activeKeys.length === 1;
  const avoid = (sameCase || singleCase) ? avoidScramble : null;

  return pickRandomScrambleEntry(picked.entries, avoid);
}

/** Wrap each move in a <span> for hover styling */
function formatMoves(movesStr) {
  if (!movesStr) return '';
  return movesStr.trim().split(/\s+/)
    .map(m => `<span class="move-token">${esc(m)}</span>`)
    .join(' ');
}

/** Display a new scramble and update the info bar */
function displayScramble(entry) {
  S.currentEntry = entry;

  if (!entry) {
    DOM.scrambleMoves.innerHTML = `<span class="scramble-placeholder">${esc(t('practice.selectCasesArrow'))}</span>`;
    DOM.infoSet.textContent     = '—';
    DOM.infoCase.textContent    = t('practice.noCases');
    DOM.infoAlgCount.textContent = '';
    DOM.nextScrambleBtn?.setAttribute('disabled', 'disabled');
    return;
  }

  DOM.scrambleMoves.innerHTML = formatMoves(entry.scramble);
  if (DOM.copySetupBtn) {
    DOM.copySetupBtn.dataset.text = entry.scramble?.trim() ?? '';
    DOM.copySetupBtn.toggleAttribute('disabled', !entry.scramble?.trim());
  }
  DOM.nextScrambleBtn?.removeAttribute('disabled');

  if (S.appView === 'practice') {
    const key = makeKey(entry.set_name, entry.case_name);
    registerCaseShown(key);
  }

  // Info bar — hide case name (revealed after solve)
  DOM.infoSet.textContent = entry.set_name;
  DOM.infoCase.textContent = '';     // revealed after solve
  const totalAlgs = S.grouped[entry.set_name]?.[entry.case_name]?.length ?? 1;
  DOM.infoAlgCount.textContent = '';
}

function isPracticeShortcutBlocked() {
  const tag = document.activeElement?.tagName ?? '';
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag);
}

/** Atajos del cronómetro (espacio, N, R): siempre en Practicar salvo campos de texto o botones. */
function isTimerKeyboardBlocked() {
  if (S.appView !== 'practice') return true;
  return isPracticeShortcutBlocked();
}

function goNextScramble() {
  if (S.selection.size === 0) {
    showToast(t('toast.selectCases'), 'error');
    return;
  }
  if (S.timer.phase === 'RUNNING') {
    showToast(t('toast.stopTimer'), 'info');
    return;
  }
  if (S.timer.phase === 'READY') setTimerPhase('IDLE');
  hideResult();

  const entry = S.currentEntry;
  if (entry) {
    const key = makeKey(entry.set_name, entry.case_name);
    if (S.selection.has(key)) {
      const entries = S.grouped[entry.set_name]?.[entry.case_name] ?? [];
      const pool = uniqueScrambleEntries(filterAcceptableScrambleEntries(entries));
      if (pool.length > 1) {
        const next = pickRandomScrambleEntry(entries, entry.scramble?.trim());
        if (next?.scramble?.trim() !== entry.scramble?.trim()) {
          displayScramble(next);
          return;
        }
      }
    }
  }

  displayScramble(pickRandomEntry());
}

function repeatLastCase() {
  const key = DOM.repeatWeakBtn?.dataset.key
    || (S.lastEntry ? makeKey(S.lastEntry.set_name, S.lastEntry.case_name) : null);
  if (!key) {
    showToast(t('toast.solveFirst'), 'info');
    return;
  }
  if (S.timer.phase === 'RUNNING') {
    showToast(t('toast.stopTimer'), 'info');
    return;
  }
  if (S.timer.phase === 'READY') setTimerPhase('IDLE');
  S.forcedNextKey = key;
  hideResult();
  displayScramble(pickRandomEntry());
  showToast(t('toast.casePinned'), 'info');
}

// ══════════════════════════════════════════════════════════════
// TIMER — Instant-action state machine
//
//   IDLE ──[keydown / touchstart]──► READY
//   READY ──[keyup / touchend]──────► RUNNING
//   RUNNING ──[keydown / touchstart]► IDLE  (saves time, new scramble)
// ══════════════════════════════════════════════════════════════

function setTimerPhase(phase) {
  S.timer.phase = phase;
  DOM.timerArea.setAttribute('data-phase', phase);
  DOM.timerDisplay.setAttribute('data-phase', phase);

  switch (phase) {
    case 'IDLE':
      DOM.timerHint.innerHTML = t('timer.idle');
      break;
    case 'READY':
      DOM.timerHint.textContent = t('timer.ready');
      DOM.timerValue.textContent = '0.000';
      break;
    case 'RUNNING':
      DOM.timerHint.textContent = t('timer.running');
      break;
  }
}

/** Called on keydown (space) or touchstart on timer area */
function onPress(e) {
  if (e?.repeat) return; // ignore held key

  if (isTimerKeyboardBlocked()) return;

  const phase = S.timer.phase;

  if (phase === 'IDLE') {
    if (!S.currentEntry) {
      showToast(t('toast.selectCases'), 'error');
      return;
    }
    hideResult();
    setTimerPhase('READY');

  } else if (phase === 'RUNNING') {
    stopTimer();
  }
  // READY: ignore additional presses (wait for release)
}

/** Called on keyup (space) or touchend on timer area */
function onRelease() {
  if (S.timer.phase !== 'READY') return;
  startTimer();
}

function startTimer() {
  S.lastEntry   = S.currentEntry;
  S.timer.start = performance.now();
  S.timer.elapsed = 0;
  setTimerPhase('RUNNING');

  // RAF loop — update display every frame
  const tick = () => {
    if (S.timer.phase !== 'RUNNING') return;
    S.timer.elapsed = performance.now() - S.timer.start;
    DOM.timerValue.textContent = fmtTime(S.timer.elapsed);
    S.timer.raf = requestAnimationFrame(tick);
  };
  cancelAnimationFrame(S.timer.raf);
  S.timer.raf = requestAnimationFrame(tick);
}

function stopTimer() {
  cancelAnimationFrame(S.timer.raf);
  S.timer.elapsed = performance.now() - S.timer.start;
  const elapsedMs = S.timer.elapsed;

  DOM.timerValue.textContent = fmtTime(elapsedMs);
  setTimerPhase('IDLE');

  // Save and display result
  const entry = S.lastEntry;
  if (entry) {
    const { isPB, ts } = recordTime(entry, elapsedMs);
    S.lastRecorded = {
      key: makeKey(entry.set_name, entry.case_name),
      ts,
      ms: elapsedMs,
    };
    showResult(entry, elapsedMs, isPB);

    if (S.session.active) {
      S.session.done += 1;
      S.session.times.push(elapsedMs);
      updateSessionStatus();
      if (S.session.done >= S.session.target) {
        const avg = S.session.times.reduce((s, t) => s + t, 0) / S.session.times.length;
        const best = Math.min(...S.session.times);
        showToast(t('toast.sessionComplete', { avg: fmtTime(avg), best: fmtTime(best) }), 'success', 7000);
        S.session.active = false;
        S.session.done = 0;
        S.session.times = [];
        updateSessionStatus();
      }
    }

    renderStats();
    renderAccordion(DOM.caseSearch.value);
  }

  // Pick and show next scramble immediately
  displayScramble(pickRandomEntry());
}

// ══════════════════════════════════════════════════════════════
// RESULT — shown after solve, hidden before/during
// ══════════════════════════════════════════════════════════════

function showResult(entry, timeMs, isPB) {
  // Time value
  DOM.resultTime.textContent = fmtTime(timeMs);

  if (DOM.resultSetupText) DOM.resultSetupText.textContent = entry.scramble ?? '—';
  DOM.resultAlgText.textContent = entry.algorithm;

  // Case name
  DOM.resultCaseName.textContent = entry.case_name;
  const resultKey = makeKey(entry.set_name, entry.case_name);
  if (DOM.repeatWeakBtn) {
    DOM.repeatWeakBtn.dataset.key = resultKey;
    DOM.repeatWeakBtn.classList.remove('hidden');
  }
  if (DOM.openStudyBtn) {
    DOM.openStudyBtn.dataset.key = resultKey;
    DOM.openStudyBtn.classList.remove('hidden');
  }
  DOM.discardLastTimeBtn?.classList.remove('hidden');

  // Update info bar case name now that solve is done
  DOM.infoCase.textContent = entry.case_name;

  // Case image via visualcube (shown only after solve)
  loadCaseDiagram(DOM.caseImg, DOM.caseImgFallback, entry.set_name, entry.case_name, entry.algorithm);

  // Show section with animation (do not auto-scroll on mobile)
  DOM.resultSection.classList.remove('hidden');
}

function hideResult() {
  DOM.resultSection.classList.add('hidden');
  DOM.caseImg.src = '';
  DOM.infoCase.textContent = '';
  DOM.discardLastTimeBtn?.classList.add('hidden');
  DOM.repeatWeakBtn?.classList.add('hidden');
  DOM.openStudyBtn?.classList.add('hidden');
}

// ══════════════════════════════════════════════════════════════
// TIMES — persisted in localStorage
// ══════════════════════════════════════════════════════════════

function loadTimes() {
  try {
    const raw = localStorage.getItem(LS.TIMES);
    if (raw) S.times = JSON.parse(raw);
  } catch (_) { S.times = {}; }
}

function saveTimes() {
  localStorage.setItem(LS.TIMES, JSON.stringify(S.times));
}

// ══════════════════════════════════════════════════════════════
// STUDY — notas y algoritmo personal (localStorage)
// ══════════════════════════════════════════════════════════════

function loadStudy() {
  try {
    const raw = localStorage.getItem(LS.STUDY);
    if (raw) S.study = JSON.parse(raw);
  } catch (_) { S.study = {}; }
}

function saveStudy() {
  localStorage.setItem(LS.STUDY, JSON.stringify(S.study));
}

function getStudyRecord(key) {
  if (!S.study[key]) S.study[key] = { studyAlg: '', notes: '' };
  return S.study[key];
}

let studySaveTimer;
function scheduleStudySave() {
  clearTimeout(studySaveTimer);
  studySaveTimer = setTimeout(() => {
    if (!S.studyCurrentKey) return;
    const rec = getStudyRecord(S.studyCurrentKey);
    rec.studyAlg = DOM.studyAlgInput?.value ?? '';
    rec.notes    = DOM.studyNotesInput?.value ?? '';
    rec.updatedAt = Date.now();
    saveStudy();
    if (DOM.studySaveHint) DOM.studySaveHint.textContent = t('study.saved');
    refreshStudyPersonalUI();
  }, 400);
}

function getSortedCaseKeys() {
  const keys = listAllCaseKeys();
  keys.sort((a, b) => {
    const pa = parseKey(a);
    const pb = parseKey(b);
    const bySet = pa.set.localeCompare(pb.set);
    if (bySet !== 0) return bySet;
    return compareCaseNames(pa.cas, pb.cas);
  });
  return keys;
}

function setAppView(view) {
  S.appView = view;
  document.body.classList.remove('view-practice', 'view-study', 'view-stats');
  document.body.classList.add(`view-${view}`);

  DOM.navBtns?.forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });

  if (DOM.sidebarTitle) {
    DOM.sidebarTitle.textContent = view === 'study'
      ? t('sidebar.titleStudy')
      : t('sidebar.title');
  }

  if (view === 'stats') {
    document.body.classList.remove('sidebar-open');
    DOM.sidebarToggle?.setAttribute('aria-expanded', 'false');
    renderStats();
  }

  const sidebarHint = document.querySelector('.sidebar-hint');
  if (sidebarHint) {
    sidebarHint.textContent = view === 'study'
      ? t('sidebar.hintStudy')
      : t('sidebar.hint');
  }

  if (view === 'study' || view === 'practice') {
    renderAccordion(DOM.caseSearch?.value ?? '');
  }
}

function openStudyCase(key, { scroll = true } = {}) {
  if (!key || !S.grouped) return;
  const { set, cas } = parseKey(key);
  const entries = S.grouped[set]?.[cas];
  if (!entries?.length) return;

  S.studyCurrentKey = key;
  S.studyEditingAlg = false;
  S.studyEditingNotes = false;
  const primaryAlg = entries[0].algorithm;

  DOM.studyEmpty?.classList.add('hidden');
  DOM.studyDetail?.classList.remove('hidden');

  if (DOM.studySetBadge) DOM.studySetBadge.textContent = set;
  if (DOM.studyCaseName) DOM.studyCaseName.textContent = cas;

  loadCaseDiagram(DOM.studyCaseImg, DOM.studyImgFallback, set, cas, primaryAlg);
  renderStudyCaseSetup(entries);
  renderStudyOfficialAlgs(entries);

  const rec = getStudyRecord(key);
  if (DOM.studyAlgInput) DOM.studyAlgInput.value = rec.studyAlg ?? '';
  if (DOM.studyNotesInput) DOM.studyNotesInput.value = rec.notes ?? '';
  refreshStudyPersonalUI();
  if (DOM.studySaveHint) DOM.studySaveHint.textContent = t('study.saveHint');

  const keys = getSortedCaseKeys();
  const idx = keys.indexOf(key);
  if (DOM.studyPrevBtn) DOM.studyPrevBtn.disabled = idx <= 0;
  if (DOM.studyNextBtn) DOM.studyNextBtn.disabled = idx < 0 || idx >= keys.length - 1;

  renderAccordion(DOM.caseSearch?.value ?? '');

  if (scroll) {
    DOM.studyDetail?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (scroll && window.matchMedia('(max-width: 768px)').matches) {
    document.body.classList.remove('sidebar-open');
    DOM.sidebarToggle?.setAttribute('aria-expanded', 'false');
  }
}

function navigateStudy(delta) {
  const keys = getSortedCaseKeys();
  const idx = keys.indexOf(S.studyCurrentKey);
  if (idx < 0) return;
  const next = keys[idx + delta];
  if (next) openStudyCase(next, { scroll: false });
}

function openStudyFromKey(key) {
  if (!key) return;
  setAppView('study');
  openStudyCase(key);
}

function practiceStudyCaseOnly() {
  if (!S.studyCurrentKey) return;
  S.selection = new Set([S.studyCurrentKey]);
  saveSelection();
  onSelectionChange();
  setAppView('practice');
  document.body.classList.remove('sidebar-open');
  DOM.sidebarToggle?.setAttribute('aria-expanded', 'false');
  renderAccordion(DOM.caseSearch?.value ?? '');
  showToast(t('toast.practiceOnly'), 'info');
}

/** Record a time; returns { isPB, ts } for the new entry */
function recordTime(entry, ms) {
  const key = makeKey(entry.set_name, entry.case_name);
  if (!S.times[key]) {
    S.times[key] = { set: entry.set_name, case: entry.case_name, times: [] };
  }
  const record = S.times[key];
  const prevPB = record.times.length
    ? Math.min(...record.times.map(t => t.time))
    : Infinity;

  const ts = Date.now();
  record.times.push({ id: entry.id, time: ms, ts });
  if (record.times.length > MAX_TIMES_PER_CASE) {
    record.times = record.times.slice(-MAX_TIMES_PER_CASE);
  }
  saveTimes();
  return { isPB: ms < prevPB, ts };
}

function deleteTimeRecord(key, ts) {
  const rec = S.times[key];
  if (!rec) return false;
  const before = rec.times.length;
  rec.times = rec.times.filter(t => t.ts !== ts);
  if (rec.times.length === before) return false;
  if (rec.times.length === 0) {
    delete S.times[key];
    if (S.expandedKey === key) S.expandedKey = null;
  }
  saveTimes();
  return true;
}

function discardLastRecordedTime() {
  const last = S.lastRecorded;
  if (!last?.key || last.ts == null) {
    showToast(t('toast.noDiscard'), 'info');
    return;
  }

  if (!deleteTimeRecord(last.key, last.ts)) {
    showToast(t('toast.discardFail'), 'error');
    return;
  }

  if (S.session.active && S.session.times.length > 0) {
    const idx = S.session.times.length - 1;
    if (S.session.times[idx] === last.ms) {
      S.session.times.pop();
      S.session.done = Math.max(0, S.session.done - 1);
      updateSessionStatus();
    }
  }

  S.lastRecorded = null;
  hideResult();
  renderStats();
  renderAccordion(DOM.caseSearch?.value ?? '');
  showToast(t('toast.discarded'), 'success');
}

// ══════════════════════════════════════════════════════════════
// STATS ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Compute Average of N (trimmed):
 *   - n <= 2: plain mean
 *   - n >= 3: remove best + worst, average the rest
 */
function calcAo(timesArr, n) {
  if (!timesArr || timesArr.length < n) return null;
  const vals = timesArr.slice(-n).map(t => t.time).sort((a, b) => a - b);
  if (n <= 2) return vals.reduce((s, v) => s + v, 0) / n;
  const trimmed = vals.slice(1, -1);   // remove best and worst
  return trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
}

function computeStats(timesArr) {
  if (!timesArr?.length) return null;
  const vals = timesArr.map(t => t.time);
  return {
    count: timesArr.length,
    pb:    Math.min(...vals),
    mean:  vals.reduce((s, v) => s + v, 0) / vals.length,
    ao5:   calcAo(timesArr, 5),
    ao12:  calcAo(timesArr, 12),
    last:  timesArr[timesArr.length - 1].time,
  };
}

// ══════════════════════════════════════════════════════════════
// STATS TABLE RENDER
// ══════════════════════════════════════════════════════════════
function rebuildStatsFilterOptions() {
  if (!DOM.statsSetFilter || !DOM.statsLevelFilter) return;
  const setVal = DOM.statsSetFilter.value || 'all';
  const levelVal = DOM.statsLevelFilter.value || 'all';

  DOM.statsLevelFilter.innerHTML = `
    <option value="all">${esc(t('stats.allLevels'))}</option>
    <option value="weak">${esc(t('stats.onlyWeak'))}</option>
    <option value="strong">${esc(t('stats.onlyStrong'))}</option>
  `;
  DOM.statsLevelFilter.value = levelVal;
}

function renderStats() {
  const keys = Object.keys(S.times);

  // Summary cards always update
  renderSummaryCards(keys);

  if (keys.length === 0) {
    DOM.statsEmpty.classList.remove('hidden');
    DOM.statsTbody.innerHTML = '';
    return;
  }
  DOM.statsEmpty.classList.add('hidden');

  // Build data rows
  const rows = keys.map(key => {
    const rec = S.times[key];
    const st  = computeStats(rec.times);
    const diff = classifyCaseDifficulty(key);
    return { key, set: rec.set, case: rec.case, diffCls: diff.cls, ...st };
  }).filter(Boolean);

  // Keep set filter options in sync with available rows
  if (DOM.statsSetFilter) {
    const prev = DOM.statsSetFilter.value || 'all';
    const setVals = [...new Set(rows.map(r => r.set))].sort();
    DOM.statsSetFilter.innerHTML = `<option value="all">${esc(t('stats.allSets'))}</option>${setVals.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;
    DOM.statsSetFilter.value = setVals.includes(prev) ? prev : 'all';
  }

  // Apply stats filters (search, set, level)
  const q = DOM.statsSearch?.value?.trim().toLowerCase() ?? '';
  const setFilter = DOM.statsSetFilter?.value ?? 'all';
  const levelFilter = DOM.statsLevelFilter?.value ?? 'all';
  const filteredRows = rows.filter(r => {
    if (setFilter !== 'all' && r.set !== setFilter) return false;
    if (levelFilter !== 'all' && r.diffCls !== levelFilter) return false;
    if (q && !(r.set.toLowerCase().includes(q) || r.case.toLowerCase().includes(q))) return false;
    return true;
  });

  // Sort
  const col = S.sortCol;
  const dir = S.sortDir;
  filteredRows.sort((a, b) => {
    let av = a[col], bv = b[col];
    if (av == null) av = dir === 1 ?  Infinity : -Infinity;
    if (bv == null) bv = dir === 1 ?  Infinity : -Infinity;
    if (typeof av === 'string') {
      if (col === 'case') return dir * compareCaseNames(av, bv);
      return dir * av.localeCompare(bv);
    }
    return dir * (av - bv);
  });

  // Render rows
  const dash = '<span class="dash">—</span>';
  const T    = v => (v != null ? esc(fmtTime(v)) : dash);

  const tableRows = [];
  for (const row of filteredRows) {
    const isExpanded = S.expandedKey === row.key;
    tableRows.push(`
      <tr data-key="${esc(row.key)}" class="${isExpanded ? 'row-expanded-parent' : ''}">
        <td><span class="info-badge info-set">${esc(row.set)}</span></td>
        <td>${esc(row.case)}</td>
        <td class="mono-val">${row.count}</td>
        <td class="mono-val">${T(row.mean)}</td>
        <td class="mono-val">${T(row.ao5)}</td>
        <td class="mono-val">${T(row.ao12)}</td>
        <td class="mono-val">${T(row.last)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="row-details-btn btn-sm btn-outline" data-key="${esc(row.key)}"
              aria-label="${esc(t('confirm.detailsCase', { case: row.case }))}">
              ${isExpanded ? esc(t('stats.close')) : esc(t('stats.details'))}
            </button>
            <button class="row-delete-btn btn-sm btn-danger" data-key="${esc(row.key)}"
              aria-label="${esc(t('confirm.deleteCaseTimes', { case: row.case }))}">
              ${esc(t('stats.delete'))}
            </button>
          </div>
        </td>
      </tr>
    `);

    if (isExpanded) {
      const rec = S.times[row.key];
      const { set, cas } = parseKey(row.key);
      const entries = S.grouped[set]?.[cas] ?? [];
      const primaryAlg = entries[0]?.algorithm ?? '';
      const imgUrl = caseImageUrl(set, cas);

      tableRows.push(`
        <tr class="details-row" data-key="${esc(row.key)}">
          <td colspan="8">
            <div class="details-expanded-content">
              
              <div class="details-img-wrap">
                ${imgUrl
                  ? `<img class="details-img" src="${esc(imgUrl)}" alt="${esc(row.case)}" loading="lazy" decoding="async" />`
                  : `<span style="color:var(--text-dim);font-size:0.75rem;">${esc(t('stats.noImage'))}</span>`
                }
              </div>

              <div class="details-info">
                <div class="details-algs-section" data-stats-algs>
                  <span class="details-section-title">${esc(t('stats.availableAlgs'))}</span>
                  ${buildStatsAlgsHtml(entries)}
                </div>

                <div class="details-history-section">
                  <span class="details-section-title">${esc(t('stats.timeHistory', { n: rec.times.length }))}</span>
                  <div class="details-history-list">
                    ${rec.times.map((timeRec, idx) => `
                      <span class="details-history-item">
                        #${idx + 1}: <span class="details-history-time">${fmtTime(timeRec.time)}</span>
                        <button type="button" class="btn-delete-time" data-key="${esc(row.key)}" data-ts="${timeRec.ts}" title="${esc(t('stats.deleteTimeTitle'))}" aria-label="${esc(t('stats.deleteTimeAria', { n: idx + 1 }))}">×</button>
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>

            </div>
          </td>
        </tr>
      `);
    }
  }

  DOM.statsTbody.innerHTML = tableRows.join('');

  // Details buttons
  DOM.statsTbody.querySelectorAll('.row-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      S.expandedKey = S.expandedKey === key ? null : key;
      renderStats();
    });
  });

  DOM.statsTbody.querySelectorAll('[data-stats-algs]').forEach(section => {
    bindCollapsibleAlgs(section);
  });

  // Copy buttons
  DOM.statsTbody.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      navigator.clipboard.writeText(text).then(() => {
        showToast(t('copy.algClipboard'), 'success');
      }).catch(() => {
        showToast(t('copy.algError'), 'error');
      });
    });
  });

  // Delete individual time buttons
  DOM.statsTbody.querySelectorAll('.btn-delete-time').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const ts = parseInt(btn.dataset.ts, 10);
      if (deleteTimeRecord(key, ts)) {
        if (S.lastRecorded?.key === key && S.lastRecorded?.ts === ts) {
          S.lastRecorded = null;
        }
        renderStats();
        renderAccordion(DOM.caseSearch.value);
        showToast(t('toast.timeDeleted'), 'success');
      }
    });
  });

  // Delete buttons
  DOM.statsTbody.querySelectorAll('.row-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key        = btn.dataset.key;
      const { set, cas } = parseKey(key);
      showConfirm(
        t('confirm.deleteTimes'),
        t('confirm.deleteTimesBody', { case: cas, set }),
        () => { 
          delete S.times[key]; 
          if (S.expandedKey === key) S.expandedKey = null;
          saveTimes(); 
          renderStats(); 
          renderAccordion(DOM.caseSearch.value);
          showToast(t('toast.timesDeleted'), 'success'); 
        }
      );
    });
  });

  // Update sort arrows in header
  document.querySelectorAll('#stats-table th.sortable').forEach(th => {
    const active = th.dataset.col === col;
    th.classList.toggle('sort-active', active);
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = active ? (dir === 1 ? '↑' : '↓') : '↕';
    th.setAttribute('aria-sort', active ? (dir === 1 ? 'ascending' : 'descending') : 'none');
  });
}

function renderSummaryCards(keys) {
  if (!keys.length) { DOM.statsSummary.innerHTML = ''; return; }

  let totalSolves = 0, totalTime = 0;
  for (const key of keys) {
    const rec = S.times[key];
    if (!rec?.times?.length) continue;
    const st = computeStats(rec.times);
    if (!st) continue;
    totalSolves += st.count;
    totalTime   += st.mean * st.count;
  }
  const globalMean = totalSolves > 0 ? totalTime / totalSolves : null;

  DOM.statsSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-card-label">${esc(t('stats.summarySolves'))}</span>
      <span class="summary-card-value accent">${totalSolves}</span>
    </div>
    <div class="summary-card">
      <span class="summary-card-label">${esc(t('stats.summaryCases'))}</span>
      <span class="summary-card-value">${keys.length}</span>
    </div>
    <div class="summary-card">
      <span class="summary-card-label">${esc(t('stats.summaryMean'))}</span>
      <span class="summary-card-value">${globalMean != null ? fmtTime(globalMean) : '—'}</span>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════════════════

function exportStats() {
  const hasTimes = Object.keys(S.times).length > 0;
  const hasStudy = Object.keys(S.study).length > 0;
  if (!hasTimes && !hasStudy) {
    showToast(t('toast.noExport'), 'info');
    return;
  }
  const payload = {
    version: 2,
    exported: new Date().toISOString(),
    times: S.times,
    study: S.study,
  };
  const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = Object.assign(document.createElement('a'), {
    href:     url,
    download: `zbll_stats_${new Date().toISOString().slice(0, 10)}.json`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(t('toast.exportOk'), 'success');
}

function importStats(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data     = JSON.parse(e.target.result);
      const incoming = data.times ?? data;   // support bare format too
      let added = 0, merged = 0;

      for (const [key, record] of Object.entries(incoming)) {
        if (!S.times[key]) {
          S.times[key] = record;
          added++;
        } else {
          // Merge without duplicate timestamps
          const existTs = new Set(S.times[key].times.map(t => t.ts));
          for (const t of record.times) {
            if (!existTs.has(t.ts)) { S.times[key].times.push(t); merged++; }
          }
          S.times[key].times.sort((a, b) => a.ts - b.ts);
        }
      }
      if (data.study && typeof data.study === 'object') {
        for (const [key, rec] of Object.entries(data.study)) {
          if (!S.study[key]) S.study[key] = rec;
          else {
            S.study[key] = { ...S.study[key], ...rec };
          }
        }
        saveStudy();
        if (S.studyCurrentKey && S.appView === 'study') openStudyCase(S.studyCurrentKey);
      }

      saveTimes();
      renderStats();
      renderAccordion(DOM.caseSearch.value);
      showToast(t('toast.importOk', { added, merged }), 'success');
    } catch (err) {
      showToast(t('toast.importError'), 'error');
    } finally {
      DOM.importFile.value = '';
    }
  };
  reader.readAsText(file);
}

function selectByFilter(predicate, label) {
  const keys = listAllCaseKeys().filter(key => predicate(getCaseMetricsByKey(key)));
  S.selection = new Set(keys);
  onSelectionChange();
  renderAccordion(DOM.caseSearch.value);
  showToast(t('toast.filter', { label, n: keys.length }), 'info');
}

function startWeakSession(target = 15) {
  const sourceKeys = [...S.selection];
  if (!sourceKeys.length) {
    showToast(t('toast.sessionSelectFirst'), 'error');
    return;
  }

  const practicedKeys = sourceKeys.filter(key => getCaseMetricsByKey(key).count > 0);
  if (practicedKeys.length < target) {
    showToast(t('toast.sessionNeedCases', { n: target }), 'error', 4500);
    return;
  }

  const weakKeys = rankWeakCaseKeys(practicedKeys).slice(0, target);
  S.session.active = true;
  S.session.target = target;
  S.session.done = 0;
  S.session.times = [];
  S.session.weakKeys = weakKeys;
  resetPracticeDistributionMemory();
  updateSessionStatus();
  displayScramble(pickRandomEntry());
  showToast(t('toast.sessionStart', { n: target }), 'success');
}

// ══════════════════════════════════════════════════════════════
// PWA — Service Worker + Install
// ══════════════════════════════════════════════════════════════
function initPWA() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('[SW] Registered, scope:', reg.scope);
    }).catch(err => {
      console.warn('[SW] Registration failed:', err);
    });
  }

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    S.installPrompt = e;
    DOM.installBtn.style.display = 'inline-flex';
  });

  // Install button click
  DOM.installBtn.addEventListener('click', async () => {
    if (!S.installPrompt) return;
    const { outcome } = await S.installPrompt.prompt().then
      ? await (async () => { S.installPrompt.prompt(); return S.installPrompt.userChoice; })()
      : { outcome: 'dismissed' };

    if (outcome === 'accepted') {
      DOM.installBtn.style.display = 'none';
      S.installPrompt = null;
      showToast(t('toast.installed'), 'success');
    }
  });

  window.addEventListener('appinstalled', () => {
    DOM.installBtn.style.display = 'none';
    S.installPrompt = null;
  });
}

// ══════════════════════════════════════════════════════════════
// EVENT LISTENERS SETUP
// ══════════════════════════════════════════════════════════════
function initEvents() {

  // ── Sidebar toggle (mobile) ────────────────────────────────
  DOM.sidebarToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('sidebar-open');
    DOM.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
  });
  DOM.overlay.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
    DOM.sidebarToggle.setAttribute('aria-expanded', 'false');
  });
  // Close sidebar on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      document.body.classList.remove('sidebar-open');
    }
  });

  // ── Select / Deselect All ─────────────────────────────────
  DOM.selectAllBtn.addEventListener('click', () => {
    for (const setName of Object.keys(S.grouped))
      for (const cn of Object.keys(S.grouped[setName]))
        S.selection.add(makeKey(setName, cn));
    onSelectionChange();
    renderAccordion(DOM.caseSearch.value);
    showToast(t('toast.allSelected'), 'success');
  });

  DOM.deselectAllBtn.addEventListener('click', () => {
    S.selection.clear();
    onSelectionChange();
    renderAccordion(DOM.caseSearch.value);
    showToast(t('toast.selectionCleared'), 'info');
  });

  const onCollapseAll = () => {
    collapseAllAccordion();
    showToast(t('toast.listsClosed'), 'info');
  };
  DOM.collapseAllBtn?.addEventListener('click', onCollapseAll);

  DOM.filterSlowBtn?.addEventListener('click', () =>
    selectByFilter(m => m.mean != null && m.mean > 2000, t('filter.slow'))
  );
  DOM.filterLowBtn?.addEventListener('click', () =>
    selectByFilter(m => m.count > 0 && m.count < 10, t('filter.low'))
  );
  DOM.filterUnseenBtn?.addEventListener('click', () =>
    selectByFilter(m => m.count === 0, t('filter.unseen'))
  );
  DOM.discardLastTimeBtn?.addEventListener('click', discardLastRecordedTime);
  DOM.repeatWeakBtn?.addEventListener('click', repeatLastCase);
  DOM.openStudyBtn?.addEventListener('click', () => openStudyFromKey(DOM.openStudyBtn.dataset.key));
  DOM.nextScrambleBtn?.addEventListener('click', goNextScramble);
  DOM.copySetupBtn?.addEventListener('click', () =>
    copyTextToClipboard(DOM.copySetupBtn?.dataset.text, t('copy.setup'))
  );
  DOM.studySetupCopyBtn?.addEventListener('click', () =>
    copyTextToClipboard(DOM.studySetupCopyBtn?.dataset.text, t('copy.setup'))
  );

  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', () => setLocale(btn.dataset.langBtn));
  });

  // ── App navigation ─────────────────────────────────────────
  DOM.navBtns?.forEach(btn => {
    btn.addEventListener('click', () => setAppView(btn.dataset.view));
  });

  // ── Study mode: click case in sidebar ───────────────────────
  DOM.accordion.addEventListener('click', e => {
    if (S.appView !== 'study') return;
    const item = e.target.closest('.acc-case-item');
    if (!item?.dataset.key) return;
    openStudyCase(item.dataset.key);
  });
  DOM.accordion.addEventListener('keydown', e => {
    if (S.appView !== 'study') return;
    if (e.key === ' ') {
      e.preventDefault();
      return;
    }
    if (e.key !== 'Enter') return;
    const item = e.target.closest('.acc-case-item[role="button"]');
    if (!item?.dataset.key) return;
    e.preventDefault();
    openStudyCase(item.dataset.key);
  });

  DOM.studyPrevBtn?.addEventListener('click', () => navigateStudy(-1));
  DOM.studyNextBtn?.addEventListener('click', () => navigateStudy(1));
  DOM.studyPracticeBtn?.addEventListener('click', practiceStudyCaseOnly);
  DOM.studyAlgEditBtn?.addEventListener('click', () => {
    S.studyEditingAlg = true;
    refreshStudyPersonalUI();
    DOM.studyAlgInput?.focus();
  });
  DOM.studyAlgInput?.addEventListener('input', scheduleStudySave);
  DOM.studyAlgInput?.addEventListener('blur', () => {
    if (!S.studyEditingAlg) return;
    S.studyEditingAlg = false;
    scheduleStudySave();
    refreshStudyPersonalUI();
  });
  DOM.studyNotesEditBtn?.addEventListener('click', () => {
    S.studyEditingNotes = true;
    refreshStudyPersonalUI();
    DOM.studyNotesInput?.focus();
  });
  DOM.studyNotesInput?.addEventListener('input', scheduleStudySave);
  DOM.studyNotesInput?.addEventListener('blur', () => {
    if (!S.studyEditingNotes) return;
    S.studyEditingNotes = false;
    scheduleStudySave();
    refreshStudyPersonalUI();
  });

  // ── Case search ───────────────────────────────────────────
  let searchTimer;
  DOM.caseSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderAccordion(DOM.caseSearch.value), 180);
  });

  // ── Practice shortcuts (desktop): N = nuevo, R = repetir ───
  window.addEventListener('keydown', e => {
    if (isTimerKeyboardBlocked()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    if (key === 'n') {
      e.preventDefault();
      goNextScramble();
    } else if (key === 'r') {
      e.preventDefault();
      repeatLastCase();
    }
  });

  // ── Timer — Keyboard (Space) ──────────────────────────────
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    if (isTimerKeyboardBlocked()) return;
    e.preventDefault();
    onPress(e);
  });
  window.addEventListener('keyup', e => {
    if (e.code !== 'Space') return;
    if (isTimerKeyboardBlocked()) return;
    e.preventDefault();
    onRelease();
  });

  // ── Timer — Touch ─────────────────────────────────────────
  DOM.timerArea.addEventListener('touchstart', e => {
    e.preventDefault();   // prevent scroll & ghost mouse events
    onPress(e);
  }, { passive: false });

  DOM.timerArea.addEventListener('touchend', e => {
    e.preventDefault();
    onRelease();
  }, { passive: false });

  // Also handle touch cancel (e.g. incoming call)
  DOM.timerArea.addEventListener('touchcancel', () => {
    if (S.timer.phase === 'READY') setTimerPhase('IDLE');
  });

  // While running on mobile, allow stopping from anywhere on screen.
  // We intercept the touch to avoid triggering other controls by mistake.
  document.addEventListener('touchstart', e => {
    if (S.timer.phase !== 'RUNNING') return;
    if (e.target.closest('#timer-area')) return;
    e.preventDefault();
    e.stopPropagation();
    onPress(e);
  }, { passive: false, capture: true });

  // ── Timer — Mouse click (desktop fallback) ─────────────────
  DOM.timerArea.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    onPress(e);
  });
  DOM.timerArea.addEventListener('mouseup', e => {
    if (e.button !== 0) return;
    onRelease();
  });

  // ── Stats table — Sort columns ────────────────────────────
  document.querySelectorAll('#stats-table th.sortable').forEach(th => {
    const sort = () => {
      const col = th.dataset.col;
      if (S.sortCol === col) S.sortDir *= -1;
      else { S.sortCol = col; S.sortDir = 1; }
      renderStats();
    };
    th.addEventListener('click', sort);
    th.addEventListener('keydown', e => { if (e.key === 'Enter') sort(); });
  });

  // ── Export / Import ───────────────────────────────────────
  DOM.exportBtn.addEventListener('click', exportStats);
  DOM.importFile.addEventListener('change', e => importStats(e.target.files?.[0]));

  // ── Stats filters ──────────────────────────────────────────
  DOM.statsSearch?.addEventListener('input', () => renderStats());
  DOM.statsSetFilter?.addEventListener('change', () => renderStats());
  DOM.statsLevelFilter?.addEventListener('change', () => renderStats());

  // ── Clear all stats ───────────────────────────────────────
  DOM.clearBtn.addEventListener('click', () => {
    showConfirm(
      t('confirm.clearAll'),
      t('confirm.clearAllBody'),
      () => { S.times = {}; saveTimes(); renderStats(); renderAccordion(DOM.caseSearch.value); showToast(t('toast.statsCleared'), 'success'); }
    );
  });
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
function refreshAppLanguage() {
  applyStaticI18n();
  updateDocumentMeta();
  updateSelectionBadge();
  updateSessionStatus();
  setTimerPhase(S.timer.phase);
  rebuildStatsFilterOptions();

  if (DOM.sidebarTitle) {
    DOM.sidebarTitle.textContent = S.appView === 'study'
      ? t('sidebar.titleStudy')
      : t('sidebar.title');
  }
  const sidebarHint = document.querySelector('.sidebar-hint');
  if (sidebarHint) {
    sidebarHint.textContent = S.appView === 'study'
      ? t('sidebar.hintStudy')
      : t('sidebar.hint');
  }

  renderAccordion(DOM.caseSearch?.value ?? '');
  renderStats();

  if (S.studyCurrentKey && S.appView === 'study') {
    const { set, cas } = parseKey(S.studyCurrentKey);
    const entries = S.grouped[set]?.[cas];
    if (entries?.length) {
      renderStudyCaseSetup(entries);
      renderStudyOfficialAlgs(entries);
    }
    if (DOM.studySaveHint && !S.studyEditingAlg && !S.studyEditingNotes) {
      DOM.studySaveHint.textContent = t('study.saveHint');
    }
    refreshStudyPersonalUI();
  }

  if (S.currentEntry) {
    displayScramble(S.currentEntry);
  } else if (S.selection.size === 0) {
    displayScramble(null);
  }
}
window.refreshAppLanguage = refreshAppLanguage;

async function init() {
  initI18n();
  // Restore persisted state
  loadSelection();
  loadOpenSets();
  loadOpenSubsets();
  loadTimes();
  loadStudy();

  document.body.classList.add('view-practice');

  // Boot PWA
  initPWA();

  // Wire up all event listeners
  initEvents();

  // Load data from JSON
  await loadData();

  // Render UI
  renderAccordion();
  updateSelectionBadge();
  updateSessionStatus();
  renderStats();

  // Pick first scramble
  const first = pickRandomEntry();
  displayScramble(first);

  if (S.selection.size === 0) {
    showToast(t('toast.selectSidebar'), 'info', 5000);
  }

  // Set initial timer phase
  setTimerPhase('IDLE');
}

// Kick off
init();
