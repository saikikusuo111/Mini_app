import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computePreviewWeights,
  deriveResultWeights,
  preserveVisualContinuity,
} from '../src/scales/state.js';

test('computePreviewWeights maps answers and current value to readable for/against weights', () => {
  const preview = computePreviewWeights({
    answers: { q1: 8, q2: 2 },
    currentQuestionId: 'q3',
    currentValue: 7,
  });

  assert.equal(preview.scoreFor, 17);
  assert.equal(preview.scoreAgainst, 13);
  assert.equal(preview.diff, 4);
  assert.equal(Math.round(preview.balance * 1000) / 1000, 0.267);
});

test('computePreviewWeights can compute persisted state without synthetic current input', () => {
  const preview = computePreviewWeights({
    answers: { q1: 9, q2: 4, q3: 6 },
    includeCurrent: false,
  });

  assert.equal(preview.scoreFor, 19);
  assert.equal(preview.scoreAgainst, 11);
  assert.equal(preview.diff, 8);
});

test('preserveVisualContinuity keeps motion stateful between screens', () => {
  const bridged = preserveVisualContinuity(0.8, -0.2, 0.4);
  assert.equal(Math.round(bridged * 1000) / 1000, 0.4);
});

test('deriveResultWeights maps finalized math to scales balance', () => {
  const weights = deriveResultWeights({
    preliminary_score_for: 15,
    preliminary_score_against: 10,
  });

  assert.equal(weights.scoreFor, 15);
  assert.equal(weights.scoreAgainst, 10);
  assert.equal(Math.round(weights.balance * 1000) / 1000, 0.4);
});
