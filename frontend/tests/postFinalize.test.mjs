import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePostFinalizeScreen } from '../src/flow/postFinalize.js';

test('resolvePostFinalizeScreen returns tie-breaker stage when backend asks for tie-breaker', () => {
  assert.equal(resolvePostFinalizeScreen({ needs_tiebreaker: true }), 'TIEBREAKER');
});

test('resolvePostFinalizeScreen returns result stage when tie-breaker is not required', () => {
  assert.equal(resolvePostFinalizeScreen({ needs_tiebreaker: false }), 'RESULT');
});
