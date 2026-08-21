import test from 'node:test';
import assert from 'node:assert/strict';

import { createTourPreloadQueue } from '../src/utils/tourPreload.js';

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
