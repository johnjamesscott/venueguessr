import test from 'node:test';
import assert from 'node:assert/strict';

import { createTourPreloadQueue, selectMountedTours } from '../src/utils/tourPreload.js';

test('tour preload queue is limited to playable rounds', () => {
  const venues = [
    { tourUrl: 'tour-a' },
    { tourUrl: 'tour-b' },
    { tourUrl: 'tour-c' },
    { tourUrl: 'spare-tour' },
  ];
  assert.deepEqual(createTourPreloadQueue(venues, 3), ['tour-a', 'tour-b', 'tour-c']);
});

test('tour preload queue ignores missing and duplicate URLs', () => {
  const venues = [
    { matterport_url: 'tour-a' },
    { tourUrl: '' },
    { tourUrl: 'tour-a' },
    { tourUrl: 'tour-b' },
  ];
  assert.deepEqual(createTourPreloadQueue(venues, 4), ['tour-a', 'tour-b']);
});

test('preloading off mounts only the active tour and removes hidden tours', () => {
  assert.deepEqual(selectMountedTours('a', 'b', 'b', false, false), []);
  assert.deepEqual(selectMountedTours('a', 'b', 'b', true, false), ['a']);
  assert.deepEqual(selectMountedTours('b', 'c', 'c', true, false), ['b']);
});
test('explicit preloading opt-in retains the bounded lookahead', () => {
  assert.deepEqual(selectMountedTours('a', 'b', null, false, true), ['a']);
  assert.deepEqual(selectMountedTours('a', 'b', 'b', true, true), ['a', 'b']);
  assert.deepEqual(selectMountedTours('a', 'a', 'a', true, true), ['a']);
});
