import test from 'node:test';
import assert from 'node:assert/strict';

import { withTimeout } from '../src/utils/withTimeout.js';

test('request timeout preserves successful responses', async () => {
  assert.equal(await withTimeout(Promise.resolve('ready'), 50), 'ready');
});

test('request timeout rejects stalled work with a useful message', async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 5, 'Venue load timed out'),
    /Venue load timed out/,
  );
});
