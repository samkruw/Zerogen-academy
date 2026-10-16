import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Repository, BACKUP_KEY, parseBackup } from '../src/storage.ts';
import { SyncController } from '../src/sync.ts';
import type { Remote, RemoteStore } from '../src/sync.ts';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
const courses = [{ id: 'a', title: 'Test', url: 'https://example.org/course', order: 0, completed: false, score: null, archived: false }];
class Server implements RemoteStore {
  value: Remote = { revision: null, courses: [], etag: '0' };
  async read() { return structuredClone(this.value); }
  async write(expected: Remote, courses, revision: string) {
    if (expected.etag !== this.value.etag) return false;
    this.value = { revision, courses: structuredClone(courses), etag: revision }; return true;
  }
}
function client(server: Server, storage = new MemoryStorage()) {
  const repo = new Repository(storage), statuses: string[] = [];
  const sync = new SyncController(repo, server, status => statuses.push(status));
  return { repo, sync, statuses, storage };
}

test('two independent clients converge after explicit sync', async () => {
  const server = new Server(), a = client(server), b = client(server);
  a.repo.saveCourses(courses); await a.sync.run(); await b.sync.run();
  assert.deepEqual(b.repo.state.courses, courses);
  assert.equal(a.repo.state.dirty, false);
  assert.equal(b.statuses.at(-1), 'synchronisiert');
});
test('cloud first start with local changes produces conflict, never overwrites', async () => {
  const server = new Server(); server.value = { revision: 'remote', etag: 'remote', courses: [] };
  const a = client(server); a.repo.saveCourses(courses); await a.sync.run();
  assert.equal(a.statuses.at(-1), 'Konflikt'); assert.deepEqual(a.repo.state.courses, courses);
  assert.deepEqual(server.value.courses, []);
  await a.sync.resolve('remote');
  assert.deepEqual(a.repo.state.courses, []);
  assert.deepEqual(parseBackup(a.storage.getItem(BACKUP_KEY)!), courses);
});
test('offline changes survive restart and conflict requires conscious local choice', async () => {
  const server = new Server(), a = client(server), b = client(server);
  a.repo.saveCourses(courses); await a.sync.run(); await b.sync.run();
  a.repo.saveCourses([{ ...courses[0], title: 'A' }]); await a.sync.run();
  b.repo.saveCourses([{ ...courses[0], title: 'B' }]);
  const reloaded = client(server, b.storage); await reloaded.sync.run();
  assert.equal(reloaded.statuses.at(-1), 'Konflikt');
  await reloaded.sync.resolve('local');
  assert.equal(server.value.courses[0].title, 'B');
  assert.equal(parseBackup(b.storage.getItem(BACKUP_KEY)!)[0].title, 'A');
});
test('remote race on compare-and-set becomes conflict', async () => {
  const server = new Server(), a = client(server);
  a.repo.saveCourses(courses);
  server.write = async () => { server.value = { revision: 'raced', etag: 'raced', courses: [] }; return false; };
  await a.sync.run();
  assert.equal(a.statuses.at(-1), 'Konflikt'); assert.equal(a.repo.state.dirty, true);
});
test('edits during upload remain dirty and are uploaded on next sync', async () => {
  const server = new Server(), a = client(server);
  a.repo.saveCourses(courses);
  const write = server.write.bind(server);
  server.write = async (...args) => {
    a.repo.saveCourses([{ ...courses[0], title: 'Während Upload' }]);
    server.write = write; return write(...args);
  };
  await a.sync.run(); assert.equal(a.repo.state.dirty, true);
  assert.equal(a.repo.state.courses[0].title, 'Während Upload');
  await a.sync.run(); assert.equal(server.value.courses[0].title, 'Während Upload');
});
test('connection failure keeps local changes and reports offline', async () => {
  const server = new Server(), a = client(server); a.repo.saveCourses(courses);
  server.read = async () => { throw new TypeError('offline'); };
  await a.sync.run(); assert.equal(a.repo.state.dirty, true); assert.equal(a.statuses.at(-1), 'offline');
});
