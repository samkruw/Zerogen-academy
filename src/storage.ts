import { parseCourses } from './model.ts';
import type { Course } from './model.ts';

export const STORAGE_KEY = 'zerogen-learning-v1';
export const BACKUP_KEY = 'zerogen-learning-before-replace';
interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export interface LocalState { version: 1; courses: Course[]; baseRevision: string | null; dirty: boolean; }

export function parseBackup(raw: string): Course[] {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1) throw new Error('Unbekanntes Sicherungsformat. Erwartet: Version 1.');
  return parseCourses(value.courses);
}

export class Repository {
  private storage: StorageLike;
  private raw: string | null;
  state: LocalState;

  constructor(storage: StorageLike) {
    this.storage = storage;
    this.raw = storage.getItem(STORAGE_KEY);
    if (this.raw === null) this.state = { version: 1, courses: [], baseRevision: null, dirty: false };
    else {
      const value = JSON.parse(this.raw);
      const courses = parseBackup(this.raw);
      if (typeof value.dirty !== 'boolean' || !(value.baseRevision === null || typeof value.baseRevision === 'string'))
        throw new Error('Lokale Speicherdaten sind beschädigt. Bitte Rohdaten sichern.');
      this.state = { version: 1, courses, dirty: value.dirty, baseRevision: value.baseRevision };
    }
  }

  persist(state: LocalState) {
    if (this.storage.getItem(STORAGE_KEY) !== this.raw)
      throw new Error('Änderung in einem anderen Tab erkannt. Seite neu laden, bevor du weiter speicherst.');
    const checked = { ...state, courses: parseCourses(state.courses) };
    const raw = JSON.stringify(checked);
    this.storage.setItem(STORAGE_KEY, raw);
    this.raw = raw;
    this.state = checked;
  }
  saveCourses(courses: Course[]) { this.persist({ ...this.state, courses, dirty: true }); }
  export(): string { return JSON.stringify({ version: 1, courses: this.state.courses }, null, 2); }
  backup(courses = this.state.courses) { this.storage.setItem(BACKUP_KEY, JSON.stringify({ version: 1, courses: parseCourses(courses) })); }
  import(raw: string) {
    const courses = parseBackup(raw);
    this.backup();
    this.saveCourses(courses);
  }
}
