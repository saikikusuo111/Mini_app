// frontend/tests/resultScreen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildResultCopy, buildResultViewModel } from '../src/screens/resultScreen.js';

test('buildResultViewModel keeps preliminary math while using tiebreaker final verdict', () => {
  const view = buildResultViewModel({
    preliminary_score_for: 10.1,
    preliminary_score_against: 9.8,
    preliminary_diff: 0.3,
    preliminary_diff_percent: 1.51,
    preliminary_verdict: 'tiebreaker_required',
    final_verdict: 'wait_24h',
    final_verdict_label: 'Подождать 24 часа',
    used_tiebreaker: true,
    tiebreaker_option_id: 'wait_24h',
    result_basis: 'tiebreaker_choice',
  });

  assert.deepEqual(view, {
    finalVerdict: 'wait_24h',
    finalVerdictLabel: 'Подождать 24 часа',
    resultBasis: 'tiebreaker_choice',
    usedTiebreaker: true,
    tiebreakerOptionId: 'wait_24h',
    preliminaryVerdict: 'tiebreaker_required',
    preliminaryScoreFor: 10.1,
    preliminaryScoreAgainst: 9.8,
    preliminaryDiff: 0.3,
    preliminaryDiffPercent: 1.51,
  });
});

test('buildResultCopy explains that final decision came from weighted math when tie-breaker was not used', () => {
  const view = buildResultViewModel({
    final_verdict_label: 'Покупать',
    preliminary_verdict: 'buy_now',
    preliminary_score_for: 12,
    preliminary_score_against: 8,
    preliminary_diff: 4,
    preliminary_diff_percent: 33.33,
    used_tiebreaker: false,
  });

  const copy = buildResultCopy(view);

  assert.equal(copy.finalDecisionTitle, 'Покупать');
  assert.match(copy.basisHeadline, /взвешенной математике/);
  assert.match(copy.basisDetail, /tie-breaker не потребовался/);
});
