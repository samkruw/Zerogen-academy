import { ownerUid, rules } from './rules-owner.ts';
import { test } from 'node:test';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, get } from 'firebase/database';
const env = await initializeTestEnvironment({ projectId: 'demo-zerogen', database: { host: '127.0.0.1', port: 9000, rules } });
const owner = env.authenticatedContext(ownerUid).database();
const stranger = env.authenticatedContext('stranger').database();
const anonymous = env.unauthenticatedContext().database();
const course = { id: 'course-1', title: 'Testkurs', url: 'https://example.org/course', order: 0, completed: true, score: 100, archived: false };
const path = `/users/${ownerUid}/courses`;
const snapshot = (revision: string, item = course) => ({ revision, items: { 'course-1': item } });
try {
  await env.clearDatabase();
  await test('owner can read and write courses, including score zero and null', async () => {
    await assertSucceeds(set(ref(owner, path), snapshot('one')));
    await assertSucceeds(get(ref(owner, path)));
    await assertSucceeds(set(ref(owner, path), snapshot('two', { ...course, score: 0 })));
    await assertSucceeds(set(ref(owner, path), snapshot('three', { ...course, score: null })));
  });
  await test('anonymous and other uid cannot read or write owner data', async () => {
    for (const db of [anonymous, stranger]) {
      await assertFails(get(ref(db, path)));
      await assertFails(set(ref(db, path), snapshot('forbidden')));
    }
    await assertFails(set(ref(stranger, '/users/stranger/courses'), snapshot('own-stranger')));
    await assertFails(get(ref(owner, '/users')));
    await assertFails(get(ref(owner, '/users/stranger/courses')));
  });
  await test('invalid scores, non-https, forged identity, extra data and missing revision denied', async () => {
    for (const score of [-1, 101, 2.5, '90']) await assertFails(set(ref(owner, path), snapshot(`bad-${score}`, { ...course, score })));
    await assertFails(set(ref(owner, path), snapshot('bad-incomplete', { ...course, completed: false })));
    await assertFails(set(ref(owner, path), snapshot('bad-url', { ...course, url: 'javascript:alert(1)' })));
    await assertFails(set(ref(owner, path), snapshot('bad-id', { ...course, id: 'forged' })));
    await assertFails(set(ref(owner, path), snapshot('bad-extra', { ...course, secret: 'extra' })));
    await assertFails(set(ref(owner, path), { items: { 'course-1': course } }));
    await assertFails(set(ref(owner, path), snapshot('three')));
    await assertFails(set(ref(owner, path), null));
    await assertSucceeds(set(ref(owner, path), { revision: 'empty' }));
  });
} finally { await env.cleanup(); }
