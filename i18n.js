/* ZBLL Trainer — i18n (ES / EN) */
'use strict';

const I18N_MESSAGES = {
  es: {
    'meta.title': 'ZBLL Trainer - Aprende ZBLL 3x3 y entrena casos',
    'meta.description': 'ZBLL Trainer para aprender ZBLL en 3x3: práctica con cronómetro, modo aprender, estadísticas y uso offline.',
    'nav.practice': 'Practicar',
    'nav.study': 'Aprender',
    'nav.stats': 'Estadísticas',
    'nav.sections': 'Secciones de la aplicación',
    'header.toggleSidebar': 'Abrir/cerrar selector de casos',
    'header.selectedCases': 'Casos seleccionados',
    'header.install': 'Instalar',
    'header.installApp': 'Instalar aplicación',
    'header.langSwitch': 'Cambiar idioma',
    'sidebar.title': 'Selección de Casos',
    'sidebar.titleStudy': 'Casos para aprender',
    'sidebar.selectAll': 'Todo',
    'sidebar.deselectAll': 'Ninguno',
    'sidebar.collapseAll': 'Cerrar',
    'sidebar.collapseAllTitle': 'Cerrar todos los sets y bloques',
    'sidebar.search': 'Buscar caso…',
    'sidebar.trainTools': 'Herramientas de entrenamiento',
    'sidebar.filterSlowTitle': 'Casos con media mayor de 2.0s',
    'sidebar.filterLowTitle': 'Casos con menos de 10 resoluciones',
    'sidebar.filterUnseenTitle': 'Casos sin practicar',
    'sidebar.filterUnseen': 'Sin practicar',
    'sidebar.hint': 'Abre un set (H, U…) y un bloque (Set 1, Set 2…) para ver los casos. Usa «Cerrar» para plegar todo.',
    'sidebar.hintStudy': 'Abre un set y pulsa un caso para ver algoritmos, imagen y tus notas. Usa «Cerrar» para plegar todo.',
    'sidebar.contact': 'Contacto',
    'sidebar.contactAria': 'Contactar por correo',
    'sidebar.casesLabel': 'Selector de casos ZBLL',
    'cases.zero': '0 casos',
    'cases.one': '1 caso',
    'cases.many': '{n} casos',
    'practice.selectToStart': 'Selecciona casos para empezar',
    'practice.selectCasesArrow': 'Selecciona al menos un caso →',
    'practice.noCases': 'Sin casos seleccionados',
    'practice.scramble': 'SCRAMBLE',
    'practice.nextScramble': '↻ Siguiente scramble',
    'practice.nextScrambleAria': 'Mostrar siguiente scramble',
    'practice.loading': 'Cargando casos…',
    'practice.loadError': 'Error al cargar datos',
    'practice.scrambleSection': 'Scramble actual',
    'timer.area': 'Cronómetro — pulsa espacio o toca para usar',
    'timer.idle': 'Mantén <kbd>ESPACIO</kbd> o <kbd>toca</kbd> para preparar · <kbd>N</kbd> nuevo · <kbd>R</kbd> repetir',
    'timer.ready': '¡Suelta para empezar!',
    'timer.running': 'Pulsa para parar',
    'result.section': 'Resultado de la resolución',
    'result.time': 'Tiempo:',
    'result.algorithm': 'Algoritmo:',
    'result.discard': '🗑 Descartar tiempo',
    'result.discardTitle': 'Quitar este tiempo de las estadísticas (por ejemplo, si paraste sin querer)',
    'result.repeat': 'Repetir caso',
    'result.repeatTitle': 'Mostrar el mismo caso en el siguiente scramble',
    'result.learn': '📖 Aprender caso',
    'result.learnTitle': 'Ver algoritmos y notas de este caso',
    'result.caseDiagram': 'Diagrama del caso ZBLL',
    'result.noImageOffline': 'Sin imagen offline',
    'study.section': 'Modo aprendizaje',
    'study.empty': 'Elige un caso en el panel izquierdo para ver su imagen, algoritmos y tus notas.',
    'study.prev': '← Anterior',
    'study.next': 'Siguiente →',
    'study.prevAria': 'Caso anterior',
    'study.nextAria': 'Caso siguiente',
    'study.noImage': 'Sin imagen',
    'study.practiceOnly': 'Practicar solo este caso',
    'study.setup': 'Mezcla',
    'study.copySetup': 'Copiar mezcla',
    'study.myAlg': 'Mi algoritmo',
    'study.noCustomAlg': 'Sin versión personalizada',
    'study.editAlg': 'Editar algoritmo',
    'study.editAlgAria': 'Editar mi algoritmo',
    'study.algPlaceholder': "Ej: (R U R') (U') (R U2 R')",
    'study.editNotes': 'Editar observación',
    'study.officialAlgs': 'Algoritmos oficiales',
    'study.notes': 'Observaciones',
    'study.notesPlaceholder': 'Patrones, comparaciones con otros casos, recordatorios…',
    'study.saveHint': 'Los cambios se guardan automáticamente en este dispositivo.',
    'study.saved': 'Guardado ✓',
    'study.noSetup': 'Sin mezcla en la base de datos.',
    'stats.section': 'Estadísticas de práctica',
    'stats.title': 'Estadísticas',
    'stats.export': '⬆ Exportar',
    'stats.exportAria': 'Exportar estadísticas en JSON',
    'stats.import': '⬇ Importar',
    'stats.importAria': 'Importar estadísticas desde JSON',
    'stats.clear': '🗑 Limpiar',
    'stats.clearAria': 'Borrar todos los tiempos',
    'stats.search': 'Buscar caso o set…',
    'stats.allSets': 'Todos los sets',
    'stats.allLevels': 'Todos',
    'stats.onlyWeak': 'Solo flojos',
    'stats.onlyStrong': 'Solo dominados',
    'stats.table': 'Tabla de tiempos',
    'stats.colSet': 'Set',
    'stats.colCase': 'Caso',
    'stats.colCount': 'Count',
    'stats.colMean': 'Media',
    'stats.colLast': 'Último',
    'stats.colActions': 'Acciones',
    'stats.empty': 'Aún no hay tiempos registrados.<br />¡Empieza a practicar!',
    'stats.details': '🔍 Detalles',
    'stats.close': '▲ Cerrar',
    'stats.delete': '🗑 Borrar',
    'stats.noImage': 'Sin imagen',
    'stats.availableAlgs': 'Algoritmos disponibles',
    'stats.timeHistory': 'Historial de Tiempos ({n})',
    'stats.deleteTimeTitle': 'Borrar este tiempo',
    'stats.deleteTimeAria': 'Borrar tiempo {n}',
    'stats.summarySolves': 'Total Resoluciones',
    'stats.summaryCases': 'Casos Practicados',
    'stats.summaryMean': 'Media Global',
    'stats.filters': 'Filtros de estadísticas',
    'modal.confirmTitle': '¿Confirmar acción?',
    'modal.cancel': 'Cancelar',
    'modal.confirm': 'Confirmar',
    'diff.new': 'nuevo',
    'diff.dominated': 'dominado',
    'diff.weak': 'flojo',
    'copy': 'Copiar',
    'copy.ok': 'Copiado',
    'copy.error': 'Error al copiar',
    'copy.setup': 'Mezcla copiada',
    'copy.alg': 'Algoritmo copiado',
    'copy.algClipboard': 'Algoritmo copiado al portapapeles',
    'copy.algError': 'Error al copiar algoritmo',
    'algs.none': 'Sin algoritmos en la base de datos.',
    'algs.showMore': 'Ver {n} algoritmo más',
    'algs.showMorePlural': 'Ver {n} algoritmos más',
    'algs.hideExtra': 'Ocultar algoritmos extra',
    'acc.openLearn': 'Abrir {case} para aprender',
    'acc.selectSubset': 'Seleccionar Set {n} del set {set}',
    'acc.selectSet': 'Seleccionar todos los casos del set {set}',
    'acc.subset': 'Set {n}',
    'session.label': 'Sesión {done}/{target}',
    'seo.title': 'Aprender ZBLL y practicar ZBLL 3x3',
    'seo.p1': 'ZBLL Trainer es una web para aprender ZBLL en 3x3 y entrenar casos con cronómetro instantáneo. Incluye modo Aprender, selección de casos, mezclas cómodas para practicar y estadísticas por caso.',
    'seo.p2': 'Si buscas un ZBLL trainer para mejorar tus tiempos, esta app te permite practicar de forma continua desde móvil o escritorio, incluso sin conexión.',
    'toast.selectCases': 'Selecciona al menos un caso para practicar',
    'toast.stopTimer': 'Para el cronómetro antes de cambiar de scramble',
    'toast.solveFirst': 'Resuelve un caso antes de repetir',
    'toast.casePinned': 'Caso fijado para repetir',
    'toast.selectSidebar': 'Selecciona casos en el panel izquierdo para empezar',
    'toast.loadError': 'Error cargando los algoritmos: {msg}',
    'toast.sessionComplete': 'Sesión completa: media {avg}, mejor {best}',
    'toast.practiceOnly': 'Practicando solo este caso',
    'toast.noDiscard': 'No hay un tiempo reciente que descartar',
    'toast.discardFail': 'No se pudo eliminar el tiempo',
    'toast.discarded': 'Tiempo descartado',
    'toast.timeDeleted': 'Tiempo eliminado',
    'toast.timesDeleted': 'Tiempos eliminados',
    'toast.statsCleared': 'Estadísticas eliminadas',
    'toast.noExport': 'No hay datos que exportar',
    'toast.exportOk': 'Estadísticas exportadas correctamente',
    'toast.importOk': 'Importado: {added} casos nuevos, {merged} tiempos fusionados',
    'toast.importError': 'Error al importar: archivo no válido',
    'toast.filter': 'Filtro "{label}": {n} casos',
    'toast.sessionNeedCases': 'Necesitas al menos {n} casos ya practicados entre los seleccionados',
    'toast.sessionStart': 'Sesión iniciada: {n} casos flojos',
    'toast.sessionSelectFirst': 'Selecciona casos primero para iniciar la sesión',
    'toast.installed': '¡App instalada! Ya puedes usarla offline',
    'toast.allSelected': 'Todos los casos seleccionados',
    'toast.selectionCleared': 'Selección limpiada',
    'toast.listsClosed': 'Listas cerradas',
    'filter.slow': '> 2.0s',
    'filter.low': '< 10',
    'filter.unseen': 'sin practicar',
    'confirm.deleteTimes': '¿Borrar tiempos?',
    'confirm.deleteTimesBody': 'Se eliminarán todos los tiempos de "{case}" (set {set}). Esta acción no se puede deshacer.',
    'confirm.clearAll': '¿Borrar todas las estadísticas?',
    'confirm.clearAllBody': 'Esta acción eliminará TODOS los tiempos registrados de TODOS los casos. No se puede deshacer.',
    'confirm.detailsCase': 'Ver detalles de {case}',
    'confirm.deleteCaseTimes': 'Borrar tiempos de {case}',
    'mail.subject': 'Contacto desde ZBLL Trainer',
  },
  en: {
    'meta.title': 'ZBLL Trainer - Learn ZBLL on 3x3 and train cases',
    'meta.description': 'ZBLL Trainer to learn ZBLL on 3x3: timed practice, study mode, statistics and offline support.',
    'nav.practice': 'Practice',
    'nav.study': 'Study',
    'nav.stats': 'Statistics',
    'nav.sections': 'App sections',
    'header.toggleSidebar': 'Open/close case selector',
    'header.selectedCases': 'Selected cases',
    'header.install': 'Install',
    'header.installApp': 'Install app',
    'header.langSwitch': 'Change language',
    'sidebar.title': 'Case Selection',
    'sidebar.titleStudy': 'Cases to study',
    'sidebar.selectAll': 'All',
    'sidebar.deselectAll': 'None',
    'sidebar.collapseAll': 'Close',
    'sidebar.collapseAllTitle': 'Close all sets and blocks',
    'sidebar.search': 'Search case…',
    'sidebar.trainTools': 'Training tools',
    'sidebar.filterSlowTitle': 'Cases with average above 2.0s',
    'sidebar.filterLowTitle': 'Cases with fewer than 10 solves',
    'sidebar.filterUnseenTitle': 'Unpracticed cases',
    'sidebar.filterUnseen': 'Unpracticed',
    'sidebar.hint': 'Open a set (H, U…) and a block (Set 1, Set 2…) to see cases. Use "Close" to collapse all.',
    'sidebar.hintStudy': 'Open a set and tap a case to see algorithms, image and your notes. Use "Close" to collapse all.',
    'sidebar.contact': 'Contact',
    'sidebar.contactAria': 'Contact by email',
    'sidebar.casesLabel': 'ZBLL case selector',
    'cases.zero': '0 cases',
    'cases.one': '1 case',
    'cases.many': '{n} cases',
    'practice.selectToStart': 'Select cases to start',
    'practice.selectCasesArrow': 'Select at least one case →',
    'practice.noCases': 'No cases selected',
    'practice.scramble': 'SCRAMBLE',
    'practice.nextScramble': '↻ Next scramble',
    'practice.nextScrambleAria': 'Show next scramble',
    'practice.loading': 'Loading cases…',
    'practice.loadError': 'Failed to load data',
    'practice.scrambleSection': 'Current scramble',
    'timer.area': 'Timer — press space or tap to use',
    'timer.idle': 'Hold <kbd>SPACE</kbd> or <kbd>tap</kbd> to ready · <kbd>N</kbd> new · <kbd>R</kbd> repeat',
    'timer.ready': 'Release to start!',
    'timer.running': 'Press to stop',
    'result.section': 'Solve result',
    'result.time': 'Time:',
    'result.algorithm': 'Algorithm:',
    'result.discard': '🗑 Discard time',
    'result.discardTitle': 'Remove this time from statistics (e.g. if you stopped by mistake)',
    'result.repeat': 'Repeat case',
    'result.repeatTitle': 'Show the same case on the next scramble',
    'result.learn': '📖 Study case',
    'result.learnTitle': 'View algorithms and notes for this case',
    'result.caseDiagram': 'ZBLL case diagram',
    'result.noImageOffline': 'No offline image',
    'study.section': 'Study mode',
    'study.empty': 'Pick a case in the left panel to see its image, algorithms and your notes.',
    'study.prev': '← Previous',
    'study.next': 'Next →',
    'study.prevAria': 'Previous case',
    'study.nextAria': 'Next case',
    'study.noImage': 'No image',
    'study.practiceOnly': 'Practice this case only',
    'study.setup': 'Scramble',
    'study.copySetup': 'Copy scramble',
    'study.myAlg': 'My algorithm',
    'study.noCustomAlg': 'No custom version',
    'study.editAlg': 'Edit algorithm',
    'study.editAlgAria': 'Edit my algorithm',
    'study.algPlaceholder': 'E.g. (R U R\') (U\') (R U2 R\')',
    'study.editNotes': 'Edit note',
    'study.officialAlgs': 'Official algorithms',
    'study.notes': 'Notes',
    'study.notesPlaceholder': 'Patterns, comparisons with other cases, reminders…',
    'study.saveHint': 'Changes are saved automatically on this device.',
    'study.saved': 'Saved ✓',
    'study.noSetup': 'No scramble in the database.',
    'stats.section': 'Practice statistics',
    'stats.title': 'Statistics',
    'stats.export': '⬆ Export',
    'stats.exportAria': 'Export statistics as JSON',
    'stats.import': '⬇ Import',
    'stats.importAria': 'Import statistics from JSON',
    'stats.clear': '🗑 Clear',
    'stats.clearAria': 'Delete all times',
    'stats.search': 'Search case or set…',
    'stats.allSets': 'All sets',
    'stats.allLevels': 'All',
    'stats.onlyWeak': 'Weak only',
    'stats.onlyStrong': 'Mastered only',
    'stats.table': 'Times table',
    'stats.colSet': 'Set',
    'stats.colCase': 'Case',
    'stats.colCount': 'Count',
    'stats.colMean': 'Mean',
    'stats.colLast': 'Last',
    'stats.colActions': 'Actions',
    'stats.empty': 'No times recorded yet.<br />Start practicing!',
    'stats.details': '🔍 Details',
    'stats.close': '▲ Close',
    'stats.delete': '🗑 Delete',
    'stats.noImage': 'No image',
    'stats.availableAlgs': 'Available algorithms',
    'stats.timeHistory': 'Time History ({n})',
    'stats.deleteTimeTitle': 'Delete this time',
    'stats.deleteTimeAria': 'Delete time {n}',
    'stats.summarySolves': 'Total Solves',
    'stats.summaryCases': 'Cases Practiced',
    'stats.summaryMean': 'Global Mean',
    'stats.filters': 'Statistics filters',
    'modal.confirmTitle': 'Confirm action?',
    'modal.cancel': 'Cancel',
    'modal.confirm': 'Confirm',
    'diff.new': 'new',
    'diff.dominated': 'mastered',
    'diff.weak': 'weak',
    'copy': 'Copy',
    'copy.ok': 'Copied',
    'copy.error': 'Copy failed',
    'copy.setup': 'Scramble copied',
    'copy.alg': 'Algorithm copied',
    'copy.algClipboard': 'Algorithm copied to clipboard',
    'copy.algError': 'Failed to copy algorithm',
    'algs.none': 'No algorithms in the database.',
    'algs.showMore': 'Show {n} more algorithm',
    'algs.showMorePlural': 'Show {n} more algorithms',
    'algs.hideExtra': 'Hide extra algorithms',
    'acc.openLearn': 'Open {case} to study',
    'acc.selectSubset': 'Select Set {n} of set {set}',
    'acc.selectSet': 'Select all cases in set {set}',
    'acc.subset': 'Set {n}',
    'session.label': 'Session {done}/{target}',
    'seo.title': 'Learn ZBLL and train ZBLL on 3x3',
    'seo.p1': 'ZBLL Trainer is a web app to learn ZBLL on 3x3 and train cases with an instant timer. It includes Study mode, case selection, comfortable scrambles and per-case statistics.',
    'seo.p2': 'If you are looking for a ZBLL trainer to improve your times, this app lets you practice continuously on mobile or desktop, even offline.',
    'toast.selectCases': 'Select at least one case to practice',
    'toast.stopTimer': 'Stop the timer before changing scramble',
    'toast.solveFirst': 'Solve a case before repeating',
    'toast.casePinned': 'Case pinned for repeat',
    'toast.selectSidebar': 'Select cases in the left panel to start',
    'toast.loadError': 'Failed to load algorithms: {msg}',
    'toast.sessionComplete': 'Session complete: mean {avg}, best {best}',
    'toast.practiceOnly': 'Practicing this case only',
    'toast.noDiscard': 'No recent time to discard',
    'toast.discardFail': 'Could not delete the time',
    'toast.discarded': 'Time discarded',
    'toast.timeDeleted': 'Time deleted',
    'toast.timesDeleted': 'Times deleted',
    'toast.statsCleared': 'Statistics cleared',
    'toast.noExport': 'Nothing to export',
    'toast.exportOk': 'Statistics exported successfully',
    'toast.importOk': 'Imported: {added} new cases, {merged} merged times',
    'toast.importError': 'Import failed: invalid file',
    'toast.filter': 'Filter "{label}": {n} cases',
    'toast.sessionNeedCases': 'You need at least {n} already practiced cases among the selected ones',
    'toast.sessionStart': 'Session started: {n} weak cases',
    'toast.sessionSelectFirst': 'Select cases first to start the session',
    'toast.installed': 'App installed! You can use it offline now',
    'toast.allSelected': 'All cases selected',
    'toast.selectionCleared': 'Selection cleared',
    'toast.listsClosed': 'Lists collapsed',
    'filter.slow': '> 2.0s',
    'filter.low': '< 10',
    'filter.unseen': 'unpracticed',
    'confirm.deleteTimes': 'Delete times?',
    'confirm.deleteTimesBody': 'All times for "{case}" (set {set}) will be deleted. This cannot be undone.',
    'confirm.clearAll': 'Delete all statistics?',
    'confirm.clearAllBody': 'This will delete ALL recorded times for ALL cases. This cannot be undone.',
    'confirm.detailsCase': 'View details for {case}',
    'confirm.deleteCaseTimes': 'Delete times for {case}',
    'mail.subject': 'Contact from ZBLL Trainer',
  },
};

const LS_LANG = 'zbll_lang';
let currentLocale = 'es';

function detectLocale() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('lang');
  if (fromUrl === 'en' || fromUrl === 'es') return fromUrl;

  try {
    const saved = localStorage.getItem(LS_LANG);
    if (saved === 'en' || saved === 'es') return saved;
  } catch (_) {}

  const nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
  return nav.startsWith('en') ? 'en' : 'es';
}

function getLocale() {
  return currentLocale;
}

function t(key, vars = {}) {
  const msg = I18N_MESSAGES[currentLocale]?.[key]
    ?? I18N_MESSAGES.es[key]
    ?? key;
  return msg.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

function setLocale(locale) {
  if (locale !== 'en' && locale !== 'es') return;
  currentLocale = locale;
  try { localStorage.setItem(LS_LANG, locale); } catch (_) {}
  document.documentElement.lang = locale;
  applyStaticI18n();
  updateDocumentMeta();
  if (typeof window.refreshAppLanguage === 'function') {
    window.refreshAppLanguage();
  }
}

function updateDocumentMeta() {
  document.title = t('meta.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.description'));
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });

  const contact = document.querySelector('.sidebar-contact-link');
  if (contact) {
    contact.href = `https://mail.google.com/mail/?view=cm&fs=1&to=contact@zblltrainer.com&su=${encodeURIComponent(t('mail.subject'))}`;
  }

  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    const lang = btn.dataset.langBtn;
    btn.classList.toggle('active', lang === currentLocale);
    btn.setAttribute('aria-pressed', String(lang === currentLocale));
  });
}

function initI18n() {
  currentLocale = detectLocale();
  document.documentElement.lang = currentLocale;
  applyStaticI18n();
  updateDocumentMeta();
}

function showMoreAlgsLabel(count) {
  if (count === 1) return t('algs.showMore', { n: count });
  return t('algs.showMorePlural', { n: count });
}

function formatSelectedCases(n) {
  if (n === 0) return t('cases.zero');
  if (n === 1) return t('cases.one');
  return t('cases.many', { n });
}

function diffLabel(cls) {
  if (cls === 'new') return t('diff.new');
  if (cls === 'strong') return t('diff.dominated');
  return t('diff.weak');
}
