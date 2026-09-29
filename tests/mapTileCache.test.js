import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapTileCache, initialMapTiles, warmMapTiles } from '../src/utils/mapTileCache.js';

const tile = { z: 5, x: 15, y: 10 };
test('preload and gameplay share a request; later rounds use the cached image', async () => {
  let calls = 0;
  let finish;
  const cache = createMapTileCache(() => { calls++; return new Promise((resolve) => { finish = resolve; }); });
  const preload = cache.get(tile);
  const gameplay = cache.get(tile);
  assert.equal(preload, gameplay);
  await Promise.resolve();
  const blob = new Blob(['map']);
  finish(blob);
  assert.equal(await preload, blob);
  assert.equal(await cache.get(tile), blob);
  assert.equal(calls, 1);
});

test('failed requests retry; expired images refresh', async () => {
  let calls = 0;
  let clock = 0;
  const cache = createMapTileCache(async () => {
    if (++calls === 1) throw new Error('offline');
    return new Blob(['map']);
  }, { now: () => clock, ttlMs: 100 });
  await assert.rejects(cache.get(tile));
  await cache.get(tile);
  await cache.get(tile);
  assert.equal(calls, 2);
  clock = 101;
  await cache.get(tile);
  assert.equal(calls, 3);
});

test('cache evicts least recently used images and respects byte limits', async () => {
  let calls = 0;
  const cache = createMapTileCache(async () => { calls++; return new Blob(['1234']); }, { maxEntries: 2, maxBytes: 8 });
  const a = { ...tile, x: 1 }, b = { ...tile, x: 2 }, c = { ...tile, x: 3 };
  await cache.get(a); await cache.get(b); await cache.get(a); await cache.get(c);
  await cache.get(a);
  assert.equal(calls, 3);
  await cache.get(b);
  assert.equal(calls, 4);
  const tiny = createMapTileCache(async () => { calls++; return new Blob(['1234']); }, { maxBytes: 3 });
  await tiny.get(a); await tiny.get(a);
  assert.equal(calls, 6);
});

test('starting viewport includes the central tile, wraps world edges, and stays bounded', () => {
  const uk = initialMapTiles({ lat: 54.5, lng: -3.5, zoom: 5, width: 1248, height: 288 });
  assert.ok(uk.some(({ x, y }) => x === 15 && y === 10));
  const world = initialMapTiles({ lat: 20, lng: 0, zoom: 2, width: 4000, height: 1000 });
  assert.ok(world.length <= 16);
  assert.equal(new Set(world.map(({ x, y }) => `${x}/${y}`)).size, world.length);
  assert.ok(world.every(({ x, y }) => x >= 0 && x < 4 && y >= 0 && y < 4));
});

test('background preloading limits concurrency and stops queuing after cleanup', async () => {
  const resolvers = [];
  let active = 0, maxActive = 0, calls = 0, stopped = false;
  const cache = { get: () => {
    calls++; active++; maxActive = Math.max(active, maxActive);
    return new Promise((resolve) => resolvers.push(() => { active--; resolve(new Blob()); }));
  } };
  const preload = warmMapTiles(cache, Array.from({ length: 10 }, () => tile), () => stopped);
  assert.equal(calls, 3);
  stopped = true;
  resolvers.forEach((resolve) => resolve());
  await preload;
  assert.equal(calls, 3);
  assert.equal(maxActive, 3);
});
