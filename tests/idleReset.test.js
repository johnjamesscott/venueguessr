import test from 'node:test';
import assert from 'node:assert/strict';

import { createIdleResetController } from '../src/utils/idleReset.js';

test('idle reset reschedules on activity and fires once', () => {
  const timers = new Map();
  const cleared = [];
  let nextId = 0;
  let resetCount = 0;
  const controller = createIdleResetController({
    timeoutSeconds: 90,
    onIdle: () => { resetCount += 1; },
    setTimer: (callback, delay) => {
      nextId += 1;
      timers.set(nextId, { callback, delay });
      return nextId;
    },
    clearTimer: (id) => {
      cleared.push(id);
      timers.delete(id);
    },
  });

  assert.equal(timers.get(1).delay, 90_000);
  controller.activity();
  assert.deepEqual(cleared, [1]);
  timers.get(2).callback();
  assert.equal(resetCount, 1);
  controller.dispose();
});

test('disposed idle reset cannot fire', () => {
  let callback;
  let resetCount = 0;
  const controller = createIdleResetController({
    timeoutSeconds: 30,
    onIdle: () => { resetCount += 1; },
    setTimer: (nextCallback) => {
      callback = nextCallback;
      return 1;
    },
    clearTimer: () => {},
  });

  controller.dispose();
  callback();
  assert.equal(resetCount, 0);
});
