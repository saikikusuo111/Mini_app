import test from 'node:test';
import assert from 'node:assert/strict';

import { isFlowCompleted } from '../src/flow/completion.js';

test('isFlowCompleted returns true when current question order is beyond the configured flow', () => {
  assert.equal(isFlowCompleted(4, 3), true);
});

test('isFlowCompleted returns false when still inside configured flow', () => {
  assert.equal(isFlowCompleted(3, 3), false);
});
