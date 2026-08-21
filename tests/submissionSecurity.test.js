import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getExpiredSubmissionIds,
  getRateLimitDecision,
  getRequestFingerprint,
  isSubmissionExpired,
  SUBMISSION_TTL_MS,
} from '../base44/functions/createPendingSubmission/submissionSecurity.js';

const NOW = Date.parse('2026-08-21T12:00:00.000Z');

test('submission expiry honours explicit expiry and legacy creation date', () => {
  assert.equal(isSubmissionExpired({ expires_at: '2026-08-21T11:59:59.000Z' }, NOW), true);
  assert.equal(isSubmissionExpired({ expires_at: '2026-08-21T12:00:01.000Z' }, NOW), false);
  assert.equal(isSubmissionExpired({ created_date: new Date(NOW - SUBMISSION_TTL_MS).toISOString() }, NOW), true);
});

test('cleanup selects only expired anonymous submissions', () => {
  const records = [
    { id: 'old-pending', status: 'pending', expires_at: '2026-08-20T12:00:00.000Z' },
    { id: 'old-expired', status: 'expired', expires_at: '2026-08-20T12:00:00.000Z' },
    { id: 'completed', status: 'completed', expires_at: '2026-08-20T12:00:00.000Z' },
    { id: 'fresh', status: 'pending', expires_at: '2026-08-22T12:00:00.000Z' },
  ];
  assert.deepEqual(getExpiredSubmissionIds(records, NOW), ['old-pending', 'old-expired']);
});

test('submission rate limit allows normal play and blocks bursts', () => {
  const recent = Array.from({ length: 4 }, (_, index) => ({
    created_date: new Date(NOW - index * 10_000).toISOString(),
  }));
  assert.equal(getRateLimitDecision(recent.slice(0, 3), NOW).limited, false);
  assert.deepEqual(getRateLimitDecision(recent, NOW), { limited: true, retryAfterSeconds: 60 });
});

test('rate limiting stores a one-way fingerprint instead of the raw address', async () => {
  const request = new Request('https://example.test', {
    headers: {
      'x-forwarded-for': '203.0.113.42',
      'user-agent': 'VenueGuessr kiosk',
    },
  });
  const fingerprint = await getRequestFingerprint(request);
  assert.match(fingerprint, /^[a-f0-9]{32}$/);
  assert.equal(fingerprint.includes('203.0.113.42'), false);
});
