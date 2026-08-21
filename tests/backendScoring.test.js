import test from 'node:test';
import assert from 'node:assert/strict';

import { applyIcpBoost } from '../src/utils/scoring.js';
import {
  calculateSubmittedRoundScore,
  MAX_BASE_ROUND_SCORE,
  normalizeIcpMultiplier,
} from '../base44/functions/createPendingSubmission/scoreSubmission.js';

test('browser and backend calculate the same configured round boost', () => {
  for (const baseScore of [0, 1, 999, 3_333, MAX_BASE_ROUND_SCORE]) {
    assert.equal(
      calculateSubmittedRoundScore(baseScore, true, 1.25),
      applyIcpBoost(baseScore, true, 1.25),
    );
  }
});

test('backend ignores a submitted boosted total and rebuilds safe round scores', () => {
  assert.equal(calculateSubmittedRoundScore(99_999, false, 1.25), 5_000);
  assert.equal(calculateSubmittedRoundScore(99_999, true, 1.25), 6_250);
  assert.equal(calculateSubmittedRoundScore(-1_000, true, 1.25), 0);
});

test('backend uses the 1.25 default for older competition records', () => {
  assert.equal(normalizeIcpMultiplier(null), 1.25);
  assert.equal(normalizeIcpMultiplier(''), 1.25);
  assert.equal(calculateSubmittedRoundScore(4_000, true, null), 5_000);
});
