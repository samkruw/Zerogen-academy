import { setupFirebase } from './firebase.ts';
import { SyncController } from './sync.ts';
import type { Repository } from './storage.ts';

export function attachCloud(repo: Repository, rerender: () => void, notify: (message: string, error?: boolean) => void) {
  const controls = document.getElementById('cloud-controls')!;
  const info = document.getElementById('cloud-info')!;
  const status = document.getElementById('sync-status')!;
  let sync: SyncController | null = null;
  let pending = false;
  let epoch = 0;
  async function run() {
    if (!sync || pending) return;
    if (!navigator.onLine) { status.textContent = 'offline'; return; }
    pending = true;
    try { await sync.run(); }
    finally { pending = false; }
  }
  const firebase = setupFirebase((remote, message) => {
    const currentEpoch = ++epoch;
    info.textContent = message;
    if (!remote) { sync = null; loginForm(); status.textContent = navigator.onLine ? 'lokal' : 'offline'; return; }
    controls.innerHTML = '<div class="actions"><button id="sync-now">Jetzt synchronisieren</button><button id="sign-out">Abmelden</button></div><div id="sync-conflict" class="conflict" role="status" hidden></div>';
    sync = new SyncController(repo, remote, (state, error) => {
      if (currentEpoch !== epoch) return;
      rerender(); status.textContent = state;
      if (error) notify(error, true);
      const conflict = document.getElementById('sync-conflict')!;
      conflict.hidden = !sync?.conflict;
      if (sync?.conflict) {
        const localDone = repo.state.courses.filter(c => c.completed).length, remoteDone = sync.conflict.courses.filter(c => c.completed).length;
        conflict.innerHTML = `<p>Lokale und Cloud-Änderungen überschneiden sich.</p><p>Lokal: ${repo.state.courses.length} Kurse, ${localDone} abgeschlossen.<br>Cloud: ${sync.conflict.courses.length} Kurse, ${remoteDone} abgeschlossen.</p><p>Exportiere beide Stände zum Vergleichen. Beim Ersetzen wird der verdrängte Stand lokal gesichert.</p><div class="actions"><button id="export-cloud">Cloud-Stand exportieren</button><button id="keep-local">Lokalen Stand verwenden</button><button id="keep-remote">Cloud-Stand verwenden</button></div>`;
        document.getElementById('export-cloud')!.onclick = () => {
          const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, courses: sync!.conflict!.courses }, null, 2)], { type: 'application/json' }));
          const a = document.createElement('a'); a.href = url; a.download = 'zerogen-cloud-konflikt.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        for (const [id, choice] of [['keep-local', 'local'], ['keep-remote', 'remote']] as const)
          document.getElementById(id)!.onclick = async () => {
            if (!confirm(choice === 'local' ? 'Cloud-Stand durch deinen lokalen Stand ersetzen?' : 'Lokalen Stand durch den Cloud-Stand ersetzen?')) return;
            await sync?.resolve(choice);
          };
        notify('Sync-Konflikt: Bitte unter „Sicherung & Synchronisierung“ beide Stände prüfen.', true);
      }
    });
    document.getElementById('sync-now')!.onclick = run;
    document.getElementById('sign-out')!.onclick = async () => { await firebase.logout(); };
    void run();
  });
  function loginForm() {
    controls.innerHTML = '<form id="login"><label>E-Mail<input type="email" name="email" required autocomplete="username" /></label><label>Passwort<input type="password" name="password" required autocomplete="current-password" /></label><button type="submit">Eigentümerkonto anmelden</button></form>';
    const form = document.getElementById('login') as HTMLFormElement;
    form.onsubmit = async event => {
      event.preventDefault(); const data = new FormData(form), button = form.querySelector('button')!; button.disabled = true;
      try { await firebase.login(String(data.get('email')), String(data.get('password'))); }
      catch { notify('Anmeldung fehlgeschlagen. Eigentümerkonto, Passwort und Firebase-Konfiguration prüfen.', true); }
      finally { form.reset(); button.disabled = false; }
    };
  }
  window.addEventListener('focus', () => { void run(); });
  return () => { void run(); };
}
