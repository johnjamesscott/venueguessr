import test from 'node:test';
import assert from 'node:assert/strict';

import { applyIcpBoost } from '../src/utils/scoring.js';
import { calculateDistance } from '../src/utils/distance.js';
import {
  calculateVerifiedRound,
  MAX_BASE_ROUND_SCORE,
  normalizeGuess,
  normalizeIcpMultiplier,
} from '../base44/functions/createPendingSubmission/scoreSubmission.js';

test('browser and backend calculate the same distance and configured boost', () => {
  const venue = { latitude: 51.4965109, longitude: -0.1760019 };
  const guess = normalizeGuess(55.9533, -3.1883);
  const browserDistance = calculateDistance(guess.lat, guess.lng, venue.latitude, venue.longitude);
  const verified = calculateVerifiedRound({ venue, guess, boosted: true, multiplier: 1.25 });

  assert.equal(verified.distanceKm, browserDistance.km);
  assert.equal(verified.score, applyIcpBoost(verified.baseScore, true, 1.25));
});

test('backend awards zero when no valid guess was submitted', () => {
  const venue = { latitude: 51.5, longitude: -0.1 };
  assert.equal(normalizeGuess('not-a-latitude', 0), null);
  assert.equal(normalizeGuess(91, 0), null);
  assert.deepEqual(
    calculateVerifiedRound({ venue, guess: null, boosted: true, multiplier: 1.25 }),
    { baseScore: 0, score: 0, distanceKm: 0 },
  );
});

test('backend uses the 1.25 default for older competition records', () => {
  assert.equal(normalizeIcpMultiplier(null), 1.25);
  assert.equal(normalizeIcpMultiplier(''), 1.25);
  const perfect = calculateVerifiedRound({
    venue: { latitude: 51.5, longitude: -0.1 },
    guess: { lat: 51.5, lng: -0.1 },
    boosted: true,
    multiplier: null,
  });
  assert.equal(perfect.baseScore, MAX_BASE_ROUND_SCORE);
  assert.equal(perfect.score, 6_250);
});
