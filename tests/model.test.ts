import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/model.ts';

const course = (id: string, order = 0, completed = false, score: number | null = null) =>
  ({ id, title: id, url: 'https://example.org/course', order, completed, score, archived: false });

test('empty list and 0/0 progress', () => {
  assert.equal(model.nextCourse([]), undefined);
  assert.deepEqual(model.progress([]), { completed: 0, total: 0, percent: 0 });
});
test('first unfinished course follows order, ignores archived, all done is explicit', () => {
  const list = [course('later', 2), course('done', 0, true), course('next', 1), { ...course('archive', -1), archived: true }];
  assert.equal(model.nextCourse(list)?.id, 'next');
  assert.equal(model.nextCourse([course('done', 0, true)]), undefined);
});
test('score accepts only null or integer 0–100', () => {
  for (const value of [null, 0, 100, 83]) assert.equal(model.validateScore(value), true);
  for (const value of [-1, 101, 1.5, NaN, Infinity, '', '90', undefined]) assert.equal(model.validateScore(value), false);
});
test('undo clears score; averages use only real completed scores including zero', () => {
  assert.deepEqual(model.setCompletion(course('a', 0, true, 90), false), course('a'));
  assert.equal(model.averageScore([course('a', 0, true, 0), course('b', 1, true, 100), course('c', 2, true)]), 50);
  assert.equal(model.averageScore([course('a')]), null);
  assert.deepEqual(model.progress([course('a', 0, true), course('b', 1)]), { completed: 1, total: 2, percent: 50 });
});
test('imports validate schema, unique ids, https and authentic score semantics', () => {
  assert.deepEqual(model.parseCourses([course('a')]), [course('a')]);
  for (const list of [[course('a'), course('a')], [{ ...course('a'), url: 'javascript:alert(1)' }], [{ ...course('a'), title: ' ' }], [course('a', 0, false, 80)], [course('a', 0, true, 101)], [{ ...course('a'), archived: 'yes' }]]) {
    assert.throws(() => model.parseCourses(list));
  }
});
