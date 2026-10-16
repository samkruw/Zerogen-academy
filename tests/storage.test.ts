import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Repository, STORAGE_KEY, BACKUP_KEY, parseBackup } from '../src/storage.ts';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
const courses = [{ id: 'a', title: 'Echter Kurs', url: 'https://example.org/course', order: 0, completed: true, score: 0, archived: false }];

test('reload preserves completion, zero score and unsynced changes', () => {
  const storage = new MemoryStorage();
  const repo = new Repository(storage);
  repo.saveCourses(courses);
  const reloaded = new Repository(storage);
  assert.deepEqual(reloaded.state.courses, courses);
  assert.equal(reloaded.state.dirty, true);
});
test('malformed persisted data is never silently replaced', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{broken');
  assert.throws(() => new Repository(storage));
  assert.equal(storage.getItem(STORAGE_KEY), '{broken');
});
test('failed persistence leaves original state intact', () => {
  const storage = new MemoryStorage();
  const repo = new Repository(storage);
  storage.setItem = () => { throw new Error('Quota'); };
  assert.throws(() => repo.saveCourses(courses));
  assert.deepEqual(repo.state.courses, []);
});
test('two tabs cannot silently overwrite each other', () => {
  const storage = new MemoryStorage();
  const a = new Repository(storage), b = new Repository(storage);
  a.saveCourses(courses);
  assert.throws(() => b.saveCourses([]), /anderen Tab/);
  assert.deepEqual(new Repository(storage).state.courses, courses);
});
test('backup roundtrip and import backs up previous state before replace', () => {
  const storage = new MemoryStorage();
  const repo = new Repository(storage);
  repo.saveCourses(courses);
  assert.deepEqual(parseBackup(repo.export()), courses);
  repo.import(JSON.stringify({ version: 1, courses: [] }));
  assert.deepEqual(parseBackup(storage.getItem(BACKUP_KEY)!), courses);
  assert.deepEqual(repo.state.courses, []);
  assert.throws(() => repo.import('{bad'));
  assert.throws(() => parseBackup(JSON.stringify({ version: 9, courses })));
});
