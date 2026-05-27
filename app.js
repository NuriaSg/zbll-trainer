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
  sortCol:      'set',
  sortDir:      1,
  installPrompt: null,
  expandedKey:  null,      // key of the currently expanded row in the stats table
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
  // Info bar
  infoSet:         $id('info-set'),
  infoCase:        $id('info-case'),
  infoAlgCount:    $id('info-alg-count'),
  // Scramble
  practiceTop:     $id('practice-top'),
  scrambleMoves:   $id('scramble-moves'),
  // Timer
  timerArea:       $id('timer-area'),
  timerDisplay:    $id('timer-display'),
  timerValue:      $id('timer-value'),
  timerHint:       $id('timer-hint'),
  // Result
  resultSection:   $id('result-section'),
  resultTime:      $id('result-time'),
  resultPbTag:     $id('result-pb-tag'),
  caseImg:         $id('case-img'),
  caseImgFallback: $id('case-img-fallback'),
  resultAlgText:   $id('result-alg-text'),
  resultCaseName:  $id('result-case-name'),
  // Stats
  statsPanel:      $id('stats-panel'),
  statsTbody:      $id('stats-tbody'),
  statsEmpty:      $id('stats-empty'),
  statsSummary:    $id('stats-summary'),
  exportBtn:       $id('export-btn'),
  importFile:      $id('import-file'),
  clearBtn:        $id('clear-stats-btn'),
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
};

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
 * Build a visualcube.app URL to render the ZBLL case.
 * We pass the INVERSE of the algorithm so that visualcube
 * shows the cube state that the algorithm would solve.
 */
function buildVisualCubeUrl(algorithm, size = 200) {
  const inv = invertScramble(algorithm);
  const enc = encodeURIComponent(inv);
  // stage=ll  → renders only the last layer
  // view=plan → top-down view
  // sch=yrgwob → U=yellow R=red F=green D=white L=orange B=blue
  return `https://visualcube.api.cubing.net/visualcube.php?fmt=png&size=${size}&stage=ll&view=plan&sch=yrgwob&alg=${enc}`;
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
  DOM.scrambleMoves.innerHTML = '<span class="scramble-placeholder">Cargando casos…</span>';
  try {
    const resp = await fetch('./zbll_cases.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    S.cases = await resp.json();
    groupCases();
  } catch (err) {
    console.error('Failed to load zbll_cases.json:', err);
    showToast('Error cargando los algoritmos: ' + err.message, 'error', 8000);
    DOM.scrambleMoves.innerHTML = '<span class="scramble-placeholder">Error al cargar datos</span>';
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

function onSelectionChange() {
  saveSelection();
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
  DOM.selectedBadge.textContent = n === 0 ? '0 casos' : `${n} caso${n !== 1 ? 's' : ''}`;
  DOM.selectedBadge.classList.toggle('active', n > 0);
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
  const cid  = `case-chk-${key.replace(/[^a-z0-9]/gi, '-')}`;
  const alg  = cases[cn][0]?.algorithm;
  const thumb = alg
    ? `<img class="acc-case-thumb" src="${esc(buildVisualCubeUrl(alg, 48))}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />`
    : '';
  return `
    <label class="acc-case-item${sel ? ' selected' : ''}" data-key="${esc(key)}" for="${cid}">
      <input
        type="checkbox"
        id="${cid}"
        class="case-chk"
        data-key="${esc(key)}"
        ${sel ? 'checked' : ''}
        aria-label="${esc(cn)}"
      />
      <span class="acc-case-name">${esc(cn)}</span>
      ${thumb}
    </label>`;
}

/** Case list HTML: flat for H; else Set 1 / Set 2 … (12 cases each, collapsible) */
function buildAccCasesHtml(setName, allNames, filtered, cases, searchActive = false) {
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
      return `
        <div class="acc-subset${subsetOpen ? ' open' : ''}" data-subset="${subsetNum}">
          <div class="acc-subset-header" role="button" tabindex="0" aria-expanded="${subsetOpen}">
            <span class="acc-toggle-icon" aria-hidden="true">▶</span>
            <input
              type="checkbox"
              class="acc-subset-check"
              id="${subsetId}"
              data-set="${esc(setName)}"
              data-cases="${esc(visible.join(','))}"
              aria-label="Seleccionar Set ${subsetNum} del set ${setName}"
              ${allChunkSel ? 'checked' : ''}
            />
            <span class="acc-subset-label">Set ${subsetNum}</span>
            <span class="acc-subset-badge">${selInChunk}/${visible.length}</span>
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
  if (!wasOpen) S.openSubsets.add(key);
  else S.openSubsets.delete(key);
  saveOpenSubsets();
}

function renderAccordion(filter = '') {
  const fl           = filter.toLowerCase().trim();
  const searchActive = fl !== '';
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

    setEl.innerHTML = `
      <div class="acc-set-header" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="acc-toggle-icon" aria-hidden="true">▶</span>
        <input
          type="checkbox"
          class="acc-set-check"
          id="set-chk-${setName}"
          aria-label="Seleccionar todos los casos del set ${setName}"
          ${allSel ? 'checked' : ''}
        />
        <label class="acc-set-name" for="set-chk-${setName}">${esc(setName)}</label>
        <span class="acc-set-badge ${allSel ? 'all-selected' : ''}">
          ${selCount}/${filtered.length}
        </span>
      </div>
      <div class="acc-cases">
        ${buildAccCasesHtml(setName, allNames, filtered, cases, searchActive)}
      </div>
    `;

    // Apply indeterminate state after render
    const setChk = setEl.querySelector('.acc-set-check');
    setChk.indeterminate = someSel;

    // Header: toggle open
    const hdr = setEl.querySelector('.acc-set-header');
    hdr.addEventListener('click', e => {
      if (e.target.classList.contains('acc-set-check') ||
          e.target.htmlFor?.startsWith('set-chk')) return;
      toggleSet(setName, setEl);
    });
    hdr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSet(setName, setEl); }
    });

    // Set checkbox: select/deselect all in set
    setChk.addEventListener('change', e => {
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
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSubset(setName, subsetNum, subsetEl);
        }
      });
    });

    // Subset checkboxes (Set 1, Set 2 … — 12 cases each)
    setEl.querySelectorAll('.acc-subset-check').forEach(chk => {
      chk.addEventListener('change', e => {
        e.stopPropagation();
        const casesInSubset = chk.dataset.cases.split(',');
        toggleAllInSet(chk.dataset.set, casesInSubset, e.target.checked);
      });
    });

    // Case checkboxes
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

    DOM.accordion.appendChild(setEl);
  }
}

function toggleSet(setName, setEl) {
  const wasOpen = setEl.classList.contains('open');
  setEl.classList.toggle('open', !wasOpen);
  setEl.querySelector('.acc-set-header')?.setAttribute('aria-expanded', String(!wasOpen));
  if (!wasOpen) S.openSets.add(setName);
  else S.openSets.delete(setName);
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

/**
 * Pick a random entry with "smart training" weights:
 * - slower cases appear more often
 * - under-practiced cases appear more often
 */
function pickRandomEntry() {
  const casePool = [];
  for (const key of S.selection) {
    const { set, cas } = parseKey(key);
    const entries = S.grouped[set]?.[cas];
    if (entries?.length) casePool.push({ key, entries });
  }
  if (!casePool.length) return null;

  // Compute per-case mean for normalization (only cases with solves)
  const means = [];
  for (const c of casePool) {
    const rec = S.times[c.key];
    if (!rec?.times?.length) continue;
    const avg = rec.times.reduce((s, t) => s + t.time, 0) / rec.times.length;
    means.push(avg);
  }
  const minMean = means.length ? Math.min(...means) : 0;
  const maxMean = means.length ? Math.max(...means) : 0;
  const range = Math.max(1, maxMean - minMean);

  // Build weighted distribution
  const weighted = casePool.map(c => {
    const rec = S.times[c.key];
    const n = rec?.times?.length ?? 0;
    let meanNorm = 0.5; // neutral default for unseen cases

    if (n > 0) {
      const avg = rec.times.reduce((s, t) => s + t.time, 0) / n;
      meanNorm = (avg - minMean) / range; // 0 fast .. 1 slow
    }

    // Harder/slower cases and low-volume practice get a higher chance.
    const speedWeight = 1 + (2.2 * Math.max(0, Math.min(1, meanNorm)));
    const practiceWeight = 1 + Math.max(0, (10 - n)) / 10; // boost until 10 solves
    const weight = speedWeight * practiceWeight;

    return { ...c, weight };
  });

  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const c of weighted) {
    r -= c.weight;
    if (r <= 0) {
      return c.entries[Math.floor(Math.random() * c.entries.length)];
    }
  }

  // Fallback: should not happen, but keep safe behavior.
  const last = weighted[weighted.length - 1];
  return last.entries[Math.floor(Math.random() * last.entries.length)];
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
    DOM.scrambleMoves.innerHTML = '<span class="scramble-placeholder">Selecciona al menos un caso →</span>';
    DOM.infoSet.textContent     = '—';
    DOM.infoCase.textContent    = 'Sin casos seleccionados';
    DOM.infoAlgCount.textContent = '';
    return;
  }

  DOM.scrambleMoves.innerHTML = formatMoves(entry.scramble);

  // Info bar — hide case name (revealed after solve)
  DOM.infoSet.textContent = entry.set_name;
  DOM.infoCase.textContent = '';     // revealed after solve
  const totalAlgs = S.grouped[entry.set_name]?.[entry.case_name]?.length ?? 1;
  DOM.infoAlgCount.textContent = '';
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
      DOM.timerHint.innerHTML = 'Mantén <kbd>ESPACIO</kbd> o <kbd>toca</kbd> para preparar';
      break;
    case 'READY':
      DOM.timerHint.textContent = '¡Suelta para empezar!';
      DOM.timerValue.textContent = '0.000';
      break;
    case 'RUNNING':
      DOM.timerHint.textContent = 'Pulsa para parar';
      break;
  }
}

/** Called on keydown (space) or touchstart on timer area */
function onPress(e) {
  if (e?.repeat) return; // ignore held key

  // Don't trigger when focused on interactive elements
  const tag = document.activeElement?.tagName ?? '';
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;

  const phase = S.timer.phase;

  if (phase === 'IDLE') {
    if (!S.currentEntry) {
      showToast('Selecciona al menos un caso para practicar', 'error');
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
    const isPB = recordTime(entry, elapsedMs);
    showResult(entry, elapsedMs, isPB);
    renderStats();
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
  DOM.resultPbTag.classList.toggle('hidden', !isPB);

  // Algorithm
  DOM.resultAlgText.textContent = entry.algorithm;

  // Case name
  DOM.resultCaseName.textContent = entry.case_name;

  // Update info bar case name now that solve is done
  DOM.infoCase.textContent = entry.case_name;

  // Case image via visualcube (shown only after solve)
  const url = buildVisualCubeUrl(entry.algorithm);
  DOM.caseImg.classList.remove('hidden');
  DOM.caseImgFallback.classList.add('hidden');

  DOM.caseImg.onload  = () => {
    DOM.caseImg.classList.remove('hidden');
    DOM.caseImgFallback.classList.add('hidden');
  };
  DOM.caseImg.onerror = () => {
    DOM.caseImg.classList.add('hidden');
    DOM.caseImgFallback.classList.remove('hidden');
  };
  DOM.caseImg.src     = url;

  // Show section with animation (do not auto-scroll on mobile)
  DOM.resultSection.classList.remove('hidden');
}

function hideResult() {
  DOM.resultSection.classList.add('hidden');
  DOM.caseImg.src = '';
  DOM.infoCase.textContent = '';
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

/** Record a time, returns true if it's a new PB */
function recordTime(entry, ms) {
  const key = makeKey(entry.set_name, entry.case_name);
  if (!S.times[key]) {
    S.times[key] = { set: entry.set_name, case: entry.case_name, times: [] };
  }
  const record = S.times[key];
  const prevPB = record.times.length
    ? Math.min(...record.times.map(t => t.time))
    : Infinity;

  record.times.push({ id: entry.id, time: ms, ts: Date.now() });
  saveTimes();
  return ms < prevPB;
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
    return { key, set: rec.set, case: rec.case, ...st };
  }).filter(Boolean);

  // Sort
  const col = S.sortCol;
  const dir = S.sortDir;
  rows.sort((a, b) => {
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
  for (const row of rows) {
    const isExpanded = S.expandedKey === row.key;
    tableRows.push(`
      <tr data-key="${esc(row.key)}" class="${isExpanded ? 'row-expanded-parent' : ''}">
        <td><span class="info-badge info-set">${esc(row.set)}</span></td>
        <td>${esc(row.case)}</td>
        <td class="mono-val">${row.count}</td>
        <td class="pb-cell">${T(row.pb)}</td>
        <td class="mono-val">${T(row.mean)}</td>
        <td class="mono-val">${T(row.ao5)}</td>
        <td class="mono-val">${T(row.ao12)}</td>
        <td class="mono-val">${T(row.last)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="row-details-btn btn-sm btn-outline" data-key="${esc(row.key)}"
              aria-label="Ver detalles de ${esc(row.case)}">
              ${isExpanded ? '▲ Cerrar' : '🔍 Detalles'}
            </button>
            <button class="row-delete-btn btn-sm btn-danger" data-key="${esc(row.key)}"
              aria-label="Borrar tiempos de ${esc(row.case)}">
              🗑 Borrar
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
      const imgUrl = primaryAlg ? buildVisualCubeUrl(primaryAlg, 120) : '';

      tableRows.push(`
        <tr class="details-row" data-key="${esc(row.key)}">
          <td colspan="9">
            <div class="details-expanded-content">
              
              <div class="details-img-wrap">
                ${imgUrl 
                  ? `<img class="details-img" src="${imgUrl}" alt="VisualCube ${esc(row.case)}" />` 
                  : `<span style="color:var(--text-dim);font-size:0.75rem;">Sin imagen</span>`
                }
              </div>

              <div class="details-info">
                <div class="details-algs-section">
                  <span class="details-section-title">Algoritmos Disponibles</span>
                  ${entries.map(entry => `
                    <div class="details-alg-item">
                      <span class="details-alg-text">${esc(entry.algorithm)}</span>
                      <button class="btn-copy" data-text="${esc(entry.algorithm)}">Copiar</button>
                    </div>
                  `).join('')}
                </div>

                <div class="details-history-section">
                  <span class="details-section-title">Historial de Tiempos (${rec.times.length})</span>
                  <div class="details-history-list">
                    ${rec.times.map((t, idx) => `
                      <span class="details-history-item">
                        #${idx + 1}: <span class="details-history-time">${fmtTime(t.time)}</span>
                        <button class="btn-delete-time" data-key="${esc(row.key)}" data-ts="${t.ts}" title="Eliminar este tiempo">&times;</button>
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

  // Copy buttons
  DOM.statsTbody.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Algoritmo copiado al portapapeles', 'success');
      }).catch(() => {
        showToast('Error al copiar algoritmo', 'error');
      });
    });
  });

  // Delete individual time buttons
  DOM.statsTbody.querySelectorAll('.btn-delete-time').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const ts = parseInt(btn.dataset.ts, 10);
      const rec = S.times[key];
      if (rec) {
        rec.times = rec.times.filter(t => t.ts !== ts);
        if (rec.times.length === 0) {
          delete S.times[key];
          if (S.expandedKey === key) S.expandedKey = null;
        }
        saveTimes();
        renderStats();
        showToast('Tiempo eliminado', 'success');
      }
    });
  });

  // Delete buttons
  DOM.statsTbody.querySelectorAll('.row-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key        = btn.dataset.key;
      const { set, cas } = parseKey(key);
      showConfirm(
        '¿Borrar tiempos?',
        `Se eliminarán todos los tiempos de "${cas}" (set ${set}). Esta acción no se puede deshacer.`,
        () => { 
          delete S.times[key]; 
          if (S.expandedKey === key) S.expandedKey = null;
          saveTimes(); 
          renderStats(); 
          showToast('Tiempos eliminados', 'success'); 
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

  let totalSolves = 0, globalPB = Infinity, totalTime = 0;
  for (const key of keys) {
    const rec = S.times[key];
    if (!rec?.times?.length) continue;
    const st = computeStats(rec.times);
    if (!st) continue;
    totalSolves += st.count;
    totalTime   += st.mean * st.count;
    if (st.pb < globalPB) globalPB = st.pb;
  }
  const globalMean = totalSolves > 0 ? totalTime / totalSolves : null;

  DOM.statsSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-card-label">Total Resoluciones</span>
      <span class="summary-card-value accent">${totalSolves}</span>
    </div>
    <div class="summary-card">
      <span class="summary-card-label">Casos Practicados</span>
      <span class="summary-card-value">${keys.length}</span>
    </div>
    <div class="summary-card">
      <span class="summary-card-label">Mejor Tiempo (PB)</span>
      <span class="summary-card-value accent">${globalPB !== Infinity ? fmtTime(globalPB) : '—'}</span>
    </div>
    <div class="summary-card">
      <span class="summary-card-label">Media Global</span>
      <span class="summary-card-value">${globalMean != null ? fmtTime(globalMean) : '—'}</span>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════════════════

function exportStats() {
  if (!Object.keys(S.times).length) {
    showToast('No hay tiempos que exportar', 'info');
    return;
  }
  const payload = { version: 1, exported: new Date().toISOString(), times: S.times };
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
  showToast('Estadísticas exportadas correctamente', 'success');
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
      saveTimes();
      renderStats();
      showToast(`Importado: ${added} nuevos casos, ${merged} tiempos fusionados`, 'success');
    } catch (err) {
      showToast('Error al importar: archivo no válido', 'error');
    } finally {
      DOM.importFile.value = '';
    }
  };
  reader.readAsText(file);
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
      showToast('¡App instalada! Ya puedes usarla offline', 'success');
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
    showToast('Todos los casos seleccionados', 'success');
  });

  DOM.deselectAllBtn.addEventListener('click', () => {
    S.selection.clear();
    onSelectionChange();
    renderAccordion(DOM.caseSearch.value);
    showToast('Selección limpiada', 'info');
  });

  DOM.collapseAllBtn?.addEventListener('click', () => {
    collapseAllAccordion();
    showToast('Listas cerradas', 'info');
  });

  // ── Case search ───────────────────────────────────────────
  let searchTimer;
  DOM.caseSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderAccordion(DOM.caseSearch.value), 180);
  });

  // ── Timer — Keyboard (Space) ──────────────────────────────
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    onPress(e);
  });
  window.addEventListener('keyup', e => {
    if (e.code !== 'Space') return;
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

  // ── Clear all stats ───────────────────────────────────────
  DOM.clearBtn.addEventListener('click', () => {
    showConfirm(
      '¿Borrar todas las estadísticas?',
      'Esta acción eliminará TODOS los tiempos registrados de TODOS los casos. No se puede deshacer.',
      () => { S.times = {}; saveTimes(); renderStats(); showToast('Estadísticas eliminadas', 'success'); }
    );
  });
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
async function init() {
  // Restore persisted state
  loadSelection();
  loadOpenSets();
  loadOpenSubsets();
  loadTimes();

  // Boot PWA
  initPWA();

  // Wire up all event listeners
  initEvents();

  // Load data from JSON
  await loadData();

  // Render UI
  renderAccordion();
  updateSelectionBadge();
  renderStats();

  // Pick first scramble
  const first = pickRandomEntry();
  displayScramble(first);

  if (S.selection.size === 0) {
    showToast('Selecciona casos en el panel izquierdo para empezar', 'info', 5000);
  }

  // Set initial timer phase
  setTimerPhase('IDLE');
}

// Kick off
init();
