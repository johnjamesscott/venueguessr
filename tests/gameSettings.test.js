import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_GAME_SETTINGS, normalizeGameSettings } from '../src/utils/gameSettings.js';

test('game settings use safe defaults for older competitions', () => {
  assert.deepEqual(normalizeGameSettings({}), DEFAULT_GAME_SETTINGS);
  assert.deepEqual(normalizeGameSettings({
    icp_multiplier: null,
    round_count: null,
    round_seconds: '',
    kiosk_idle_seconds: null,
  }), DEFAULT_GAME_SETTINGS);
});

test('game settings support the public nested settings shape', () => {
  assert.deepEqual(normalizeGameSettings({
    settings: {
      icpMultiplier: 1.4,
      roundCount: 4,
      roundSeconds: 45,
      kioskIdleSeconds: 120,
    },
  }), {
    ...DEFAULT_GAME_SETTINGS,
    icpMultiplier: 1.4,
    roundCount: 4,
    roundSeconds: 45,
    kioskIdleSeconds: 120,
  });
});

test('game settings clamp admin values to kiosk-safe bounds', () => {
  assert.deepEqual(normalizeGameSettings({
    icp_multiplier: 5,
    round_count: 99,
    round_seconds: 2,
    kiosk_idle_seconds: 999,
  }), {
    ...DEFAULT_GAME_SETTINGS,
    icpMultiplier: 2,
    roundCount: 5,
    roundSeconds: 15,
    kioskIdleSeconds: 300,
  });
});

test('competition map settings preserve zero and clamp invalid bounds', () => {
  const zero = normalizeGameSettings({ map_latitude: 0, map_longitude: 0, map_zoom: 2 });
  assert.equal(zero.mapLatitude, 0);
  assert.equal(zero.mapLongitude, 0);
  assert.equal(zero.mapZoom, 2);
  const bounded = normalizeGameSettings({ settings: { mapLatitude: -100, mapLongitude: 200, mapZoom: 30 } });
  assert.equal(bounded.mapLatitude, -85);
  assert.equal(bounded.mapLongitude, 180);
  assert.equal(bounded.mapZoom, 18);
});
