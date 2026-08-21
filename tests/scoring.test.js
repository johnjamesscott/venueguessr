import test from 'node:test';
import assert from 'node:assert/strict';

import { applyIcpBoost, calculateScore } from '../src/utils/scoring.js';

test('ICP boost applies the configured multiplier to each round', () => {
  assert.equal(applyIcpBoost(4_000, true, 1.25), 5_000);
  assert.equal(applyIcpBoost(3_333, true, 1.5), 5_000);
  assert.equal(applyIcpBoost(4_000, false, 1.75), 4_000);
});

test('ICP boost rejects unsafe score and multiplier values', () => {
  assert.equal(applyIcpBoost(-100, true, 1.25), 0);
  assert.equal(applyIcpBoost(Number.NaN, true, 1.25), 0);
  assert.equal(applyIcpBoost(1_000, true, 99), 2_000);
  assert.equal(applyIcpBoost(1_000, true, 0.5), 1_000);
});

test('base score stays between zero and 5,000', () => {
  assert.equal(calculateScore(0), 5_000);
  assert.equal(calculateScore(2_000), 0);
  assert.ok(calculateScore(100) > calculateScore(500));
});
