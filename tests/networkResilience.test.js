import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestQueue, tourLookaheadDelay } from '../src/utils/networkQueue.js';
import { createPersistentTileStore } from '../src/utils/persistentMapTiles.js';

test('map traffic has a global concurrency cap and a failure releases its slot', async () => {
  const queue = createRequestQueue(2);
  let active = 0;
  let peak = 0;
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => queue(async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 2));
    active--;
    if (index === 0) throw new Error('offline');
    return index;
  })));
  assert.equal(peak, 2);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 7);
});

test('speculative tours back off on weak or metered networks', () => {
  assert.equal(tourLookaheadDelay(undefined), 8000);
  assert.equal(tourLookaheadDelay({ effectiveType: '3g' }), 20000);
  for (const connection of [{ effectiveType: '2g' }, { effectiveType: 'slow-2g' }, { saveData: true }]) {
    assert.equal(tourLookaheadDelay(connection), null);
  }
  assert.equal(tourLookaheadDelay(undefined, false), null);
});

test('map images survive store recreation, expire, and remain bounded', async () => {
  const entries = new Map();
  const cache = {
    match: async key => entries.get(key)?.clone(),
    put: async (key, response) => { entries.set(key, response); },
    delete: async key => entries.delete(key),
    keys: async () => [...entries.keys()],
  };
  let time = 100;
  const options = { now: () => time, maxEntries: 2, ttlMs: 1000 };
  const first = createPersistentTileStore(async () => cache, options);
  const a = { z: 5, x: 1, y: 1 };
  await first.write(a, new Blob(['tile']));
  const refreshed = createPersistentTileStore(async () => cache, options);
  assert.equal(await (await refreshed.read(a)).text(), 'tile');
  await Promise.all([2, 3].map(x => refreshed.write({ ...a, x }, new Blob(['next']))));
  assert.equal(entries.size, 2);
  assert.equal(await refreshed.read(a), null);
  time = 1200;
  assert.equal(await refreshed.read({ ...a, x: 3 }), null);
});

test('blocked browser storage never prevents network fallback', async () => {
  const store = createPersistentTileStore(async () => { throw new Error('Storage unavailable'); });
  assert.equal(await store.read({ z: 1, x: 0, y: 0 }), null);
  await store.write({ z: 1, x: 0, y: 0 }, new Blob(['tile']));
});
