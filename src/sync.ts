import type { Course } from './model.ts';
import type { Repository } from './storage.ts';
export interface Remote { revision: string | null; courses: Course[]; etag: string; }
export interface RemoteStore {
  read(): Promise<Remote>;
  write(expected: Remote, courses: Course[], revision: string): Promise<boolean>;
}
export type SyncStatus = 'lokal' | 'nur lokal' | 'synchronisiert' | 'Konflikt' | 'offline';
export class SyncController {
  private repo: Repository;
  private remote: RemoteStore;
  private changed: (status: SyncStatus, error?: string) => void;
  private busy = false;
  conflict: Remote | null = null;
  constructor(repo: Repository, remote: RemoteStore, changed: (status: SyncStatus, error?: string) => void) {
    this.repo = repo; this.remote = remote; this.changed = changed;
  }
  async run() {
    if (this.busy) return;
    this.busy = true;
    try {
      const remote = await this.remote.read(), local = this.repo.state;
      if (local.dirty && remote.revision !== local.baseRevision) this.showConflict(remote);
      else if (local.dirty) await this.push(remote);
      else {
        if (remote.revision !== local.baseRevision) {
          // Keep the previous local view recoverable, including a clean first start.
          this.repo.backup();
          this.repo.persist({ ...local, courses: remote.courses, baseRevision: remote.revision, dirty: false });
        }
        this.conflict = null; this.changed('synchronisiert');
      }
    } catch (error) { this.failure(error); }
    finally { this.busy = false; }
  }
  private showConflict(remote: Remote) { this.conflict = remote; this.changed('Konflikt'); }
  private async push(remote: Remote) {
    const courses = structuredClone(this.repo.state.courses), fingerprint = JSON.stringify(courses), revision = crypto.randomUUID();
    if (!await this.remote.write(remote, courses, revision)) { this.showConflict(await this.remote.read()); return; }
    const current = this.repo.state;
    const dirty = JSON.stringify(current.courses) !== fingerprint;
    this.repo.persist({ ...current, baseRevision: revision, dirty });
    this.conflict = null; this.changed(dirty ? 'nur lokal' : 'synchronisiert');
  }
  async resolve(choice: 'local' | 'remote') {
    if (!this.conflict || this.busy) return;
    this.busy = true;
    const shown = this.conflict, localBefore = this.repo.export();
    try {
      const latest = await this.remote.read();
      if (latest.etag !== shown.etag || this.repo.export() !== localBefore) {
        this.showConflict(latest); this.changed('Konflikt', 'Stand hat sich erneut geändert. Bitte Auswahl prüfen.'); return;
      }
      if (choice === 'remote') {
        this.repo.backup();
        this.repo.persist({ ...this.repo.state, courses: latest.courses, baseRevision: latest.revision, dirty: false });
        this.conflict = null; this.changed('synchronisiert');
      } else {
        // Save the cloud version before the consciously chosen replacement.
        this.repo.backup(latest.courses);
        await this.push(latest);
      }
    } catch (error) { this.failure(error); }
    finally { this.busy = false; }
  }
  private failure(error: unknown) {
    this.changed(error instanceof TypeError || (error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name)) ? 'offline' : 'nur lokal', `Synchronisierung nicht abgeschlossen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}
