import './style.css';
import { averageScore, nextCourse, ordered, parseCourses, progress, setCompletion } from './model.ts';
import type { Course } from './model.ts';
import { BACKUP_KEY, Repository, STORAGE_KEY, parseBackup } from './storage.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function notify(message: string, error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); }
function download(raw: string, filename: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let repo: Repository;
try { repo = new Repository(localStorage); }
catch (error) {
  $('notice').textContent = `Speicherung nicht verfügbar oder beschädigt: ${String(error)}. Bestehende Daten wurden nicht verändert.`;
  $('notice').classList.add('error');
  const button = document.createElement('button'); button.textContent = 'Rohdaten sichern';
  button.onclick = () => { try { download(localStorage.getItem(STORAGE_KEY) ?? 'null', 'zerogen-rohdaten.json'); } catch (e) { notify(String(e), true); } };
  $('now').append(button);
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('main button, main input').forEach(el => { if (el !== button) el.disabled = true; });
  throw error;
}

let onChange = () => {};
function save(courses: Course[]) {
  try { repo.saveCourses(courses); render(); notify('Auf diesem Gerät gespeichert.'); onChange(); return true; }
  catch (error) { render(); notify(`Nicht gespeichert: ${String(error)}`, true); return false; }
}
function openLink(course: Course, primary = false) {
  return `<a class="${primary ? 'primary' : 'course-link'}" href="${escape(course.url)}" target="_blank" rel="noopener noreferrer">${primary ? 'Kurs öffnen' : 'Öffnen'}<span class="sr-only">: ${escape(course.title)} (neuer Tab)</span></a>`;
}
function render() {
  const focused = document.activeElement as HTMLElement | null;
  const focusedId = focused?.closest<HTMLElement>('[data-id]')?.dataset.id;
  const focusedAction = focused?.dataset.action;
  const focusedName = focused?.getAttribute('name');
  const wasScoreButton = focused?.matches('.score-form button');
  const courses = repo.state.courses, next = nextCourse(courses), stats = progress(courses), average = averageScore(courses);
  $('next-course').innerHTML = next ? `<h2 class="next-title">${escape(next.title)}</h2><p class="muted">${escape(next.provider ?? new URL(next.url).hostname)}</p>${openLink(next, true)}<p class="hint">Kehre nach dem Kurs zurück und erfasse unten deinen Abschluss.</p>` : `<h2 class="next-title">${stats.total ? 'Alles abgeschlossen.' : 'Dein erster Kurs wartet.'}</h2><p class="muted">${stats.total ? 'Alle aktiven Kurse sind erledigt. Du kannst weitere Kurse hinzufügen.' : 'Füge einen echten externen Kurs hinzu oder importiere deine JSON-Sicherung.'}</p>`;
  const active = ordered(courses).filter(c => !c.archived);
  $('course-list').innerHTML = active.map((c, index) => `<li data-id="${c.id}">
    <div class="course-title"><span class="number">${String(index + 1).padStart(2, '0')}</span><div><h3>${escape(c.title)}</h3><p class="muted">${escape(c.provider ?? new URL(c.url).hostname)}</p></div>${openLink(c)}</div>
    <div class="course-options"><label class="completion"><input type="checkbox" data-action="complete" ${c.completed ? 'checked' : ''} /> Abgeschlossen<span class="sr-only">: ${escape(c.title)}</span></label>
    <form class="score-form"><label>Note <span class="muted">(optional)</span><input aria-label="Note für ${escape(c.title)}" name="score" type="number" min="0" max="100" step="1" placeholder="–" ${!c.completed ? 'disabled' : ''} value="${c.score ?? ''}" /></label><button ${!c.completed ? 'disabled' : ''} type="submit">Note speichern</button></form></div>
    <div class="course-tools"><button data-action="up" ${index === 0 ? 'disabled' : ''} aria-label="${escape(c.title)} nach oben">↑</button><button data-action="down" ${index === active.length - 1 ? 'disabled' : ''} aria-label="${escape(c.title)} nach unten">↓</button><button data-action="edit" aria-label="Ändern: ${escape(c.title)}">Ändern<span class="sr-only">: ${escape(c.title)}</span></button><button data-action="archive" aria-label="Archivieren: ${escape(c.title)}">Archivieren<span class="sr-only">: ${escape(c.title)}</span></button></div>
  </li>`).join('');
  const archived = ordered(courses).filter(c => c.archived);
  $('archive').hidden = !archived.length; $('archive-count').textContent = `(${archived.length})`;
  $('archive-list').innerHTML = archived.map(c => `<li data-id="${c.id}"><span>${escape(c.title)}</span><button data-action="restore" aria-label="Wiederherstellen: ${escape(c.title)}">Wiederherstellen<span class="sr-only">: ${escape(c.title)}</span></button></li>`).join('');
  $('stats').innerHTML = `<div class="stats-line"><p><strong>${stats.completed} / ${stats.total}</strong><span> abgeschlossen</span></p><p>${stats.percent} %</p></div><progress max="100" value="${stats.percent}" aria-label="Kursfortschritt">${stats.percent} %</progress><p class="muted">Notendurchschnitt: <strong>${average === null ? '—' : `${average.toLocaleString('de-CH', { maximumFractionDigits: 1 })} / 100`}</strong> · ${courses.filter(c => !c.archived && c.completed && c.score !== null).length} erfasste Noten</p>`;
  if (focusedId) {
    const row = document.querySelector<HTMLElement>(`[data-id="${focusedId}"]`);
    const target = focusedAction ? row?.querySelector<HTMLElement>(`[data-action="${focusedAction}"]`) : focusedName === 'score' ? row?.querySelector<HTMLElement>('[name="score"]') : wasScoreButton ? row?.querySelector<HTMLElement>('.score-form button') : null;
    (target ?? row?.querySelector<HTMLElement>('button') ?? $('add-course')).focus();
  }
  if ($('sync-status').textContent !== 'Konflikt') $('sync-status').textContent = navigator.onLine ? (repo.state.dirty ? 'nur lokal' : 'lokal') : 'offline';
}

let editing: string | null = null;
function edit(course?: Course) {
  editing = course?.id ?? null;
  $('editor-title').textContent = course ? 'Kurs ändern' : 'Kurs hinzufügen';
  const form = $<HTMLFormElement>('course-form');
  (form.elements.namedItem('title') as HTMLInputElement).value = course?.title ?? '';
  (form.elements.namedItem('url') as HTMLInputElement).value = course?.url ?? '';
  $('form-error').textContent = ''; $<HTMLDialogElement>('editor').showModal();
}
$('add-course').onclick = () => edit();
$('cancel-edit').onclick = () => $<HTMLDialogElement>('editor').close();
$('course-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget as HTMLFormElement);
  try {
    const existing = repo.state.courses.find(c => c.id === editing);
    const course = parseCourses([{ ...(existing ?? { id: crypto.randomUUID(), order: repo.state.courses.length, completed: false, score: null, archived: false }), title: String(data.get('title')).trim(), url: String(data.get('url')).trim() }])[0];
    const courses = existing ? repo.state.courses.map(c => c.id === course.id ? course : c) : [...ordered(repo.state.courses).map((c, order) => ({ ...c, order })), { ...course, order: repo.state.courses.length }];
    if (save(courses)) $<HTMLDialogElement>('editor').close();
    else $('form-error').textContent = $('notice').textContent;
  } catch (error) { $('form-error').textContent = String(error); }
};
function act(event: Event) {
  const target = event.target as HTMLElement;
  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  const id = target.closest<HTMLElement>('[data-id]')?.dataset.id;
  const course = repo.state.courses.find(c => c.id === id);
  if (!course || !action) return;
  if (action === 'complete' && event.type === 'change') {
    save(repo.state.courses.map(c => c.id === id ? setCompletion(c, (target as HTMLInputElement).checked) : c));
  } else if (event.type === 'click') {
    if (action === 'edit') edit(course);
    if (action === 'archive' || action === 'restore') save(repo.state.courses.map(c => c.id === id ? { ...c, archived: action === 'archive' } : c));
    if (action === 'up' || action === 'down') {
      const list = ordered(repo.state.courses).filter(c => !c.archived), index = list.findIndex(c => c.id === id), other = index + (action === 'up' ? -1 : 1);
      if (other < 0 || other >= list.length) return;
      [list[index], list[other]] = [list[other], list[index]];
      save([...list, ...ordered(repo.state.courses).filter(c => c.archived)].map((c, order) => ({ ...c, order })));
    }
  }
}
$('course-list').addEventListener('change', act); $('course-list').addEventListener('click', act); $('archive-list').addEventListener('click', act);
$('course-list').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target as HTMLFormElement, id = form.closest<HTMLElement>('[data-id]')?.dataset.id;
  const raw = String(new FormData(form).get('score')).trim();
  if (raw !== '' && !/^\d{1,3}$/.test(raw)) return notify('Note nicht gespeichert: ganze Zahl von 0 bis 100 eingeben.', true);
  try { save(parseCourses(repo.state.courses.map(c => c.id === id ? { ...c, score: raw === '' ? null : Number(raw) } : c))); }
  catch (error) { notify(String(error), true); }
});
$('export').onclick = () => download(repo.export(), 'zerogen-learning.json');
$('previous-backup').onclick = () => {
  try { const raw = localStorage.getItem(BACKUP_KEY); if (!raw) return notify('Noch kein vorheriger Stand vorhanden.'); download(raw, 'zerogen-vorheriger-stand.json'); }
  catch (error) { notify(String(error), true); }
};
$<HTMLInputElement>('import').onchange = async event => {
  const input = event.currentTarget as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 5_000_000) throw new Error('Sicherung ist zu gross (maximal 5 MB).');
    const raw = await file.text(), courses = parseBackup(raw);
    if (!confirm(`${courses.length} Kurse importieren und den aktuellen Stand ersetzen? Der vorherige Stand wird lokal gesichert.`)) return;
    repo.import(raw); render(); onChange(); notify('Import gespeichert. Vorheriger Stand ist als Sicherung verfügbar.');
  } catch (error) { notify(`Import abgebrochen: ${String(error)}`, true); }
  finally { input.value = ''; }
};
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) notify('Änderung in einem anderen Tab erkannt. Bitte Seite neu laden. Lokales Speichern ist bis dahin gesperrt.', true); });
window.addEventListener('offline', () => { $('sync-status').textContent = 'offline'; });
window.addEventListener('online', () => { render(); onChange(); });
render();

const cloudConfigured = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_DATABASE_URL', 'VITE_FIREBASE_PROJECT_ID', 'VITE_OWNER_UID'].every(key => Boolean(import.meta.env[key]));
if (cloudConfigured) {
  import('./cloud-ui.ts').then(({ attachCloud }) => { onChange = attachCloud(repo, render, notify); }).catch(() => notify('Firebase konnte nicht geladen werden. Dein Lernstand bleibt lokal.', true));
} else if (Object.keys(import.meta.env).some(key => key.startsWith('VITE_FIREBASE_') || key === 'VITE_OWNER_UID')) {
  $('cloud-info').textContent = 'Firebase-Konfiguration unvollständig. Dein Lernstand bleibt lokal.';
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' }).catch(() => notify('Offline-Oberfläche konnte nicht eingerichtet werden. Lokal gespeicherte Kurse bleiben erhalten.', true));
  });
}
