import test from 'node:test';
import assert from 'node:assert/strict';

import { finalizeSession, submitSessionAnswer, submitSessionTiebreaker } from '../src/api/sessionApi.js';

test('submitSessionAnswer sends payload to backend answer endpoint', async () => {
  global.window = {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
    },
  };

  let capturedUrl = null;
  let capturedOptions = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;

    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, session_id: 'ses_1', current_question_order: 2 };
      },
    };
  };

  const result = await submitSessionAnswer({
    sessionId: 'ses_1',
    questionId: 'desire',
    questionOrder: 1,
    answerValue: 7,
  });

  assert.equal(capturedUrl, 'http://localhost:8000/api/v1/sessions/ses_1/answer');
  assert.equal(capturedOptions.method, 'POST');
  assert.deepEqual(JSON.parse(capturedOptions.body), {
    question_id: 'desire',
    question_order: 1,
    answer_value: 7,
  });
  assert.equal(result.current_question_order, 2);
});

test('finalizeSession sends request to finalize endpoint', async () => {
  global.window = {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
    },
  };

  let capturedUrl = null;
  let capturedOptions = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          session_id: 'ses_1',
          score_for: 10,
          score_against: 6,
          diff: 4,
          diff_percent: 25,
          needs_tiebreaker: false,
          preliminary_verdict: 'buy',
        };
      },
    };
  };

  const result = await finalizeSession({ sessionId: 'ses_1' });
  assert.equal(capturedUrl, 'http://localhost:8000/api/v1/sessions/ses_1/finalize');
  assert.equal(capturedOptions.method, 'POST');
  assert.equal(result.preliminary_verdict, 'buy');
});

test('submitSessionTiebreaker sends selected option to backend tiebreaker endpoint', async () => {
  global.window = {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
    },
  };

  let capturedUrl = null;
  let capturedOptions = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          session_id: 'ses_1',
          score_for: 10,
          score_against: 9.5,
          diff: 0.5,
          diff_percent: 2.56,
          needs_tiebreaker: false,
          preliminary_verdict: 'buy',
          tiebreaker_option_id: 'wait_24h',
        };
      },
    };
  };

  const result = await submitSessionTiebreaker({ sessionId: 'ses_1', optionId: 'wait_24h' });
  assert.equal(capturedUrl, 'http://localhost:8000/api/v1/sessions/ses_1/tiebreaker');
  assert.equal(capturedOptions.method, 'POST');
  assert.deepEqual(JSON.parse(capturedOptions.body), { option_id: 'wait_24h' });
  assert.equal(result.tiebreaker_option_id, 'wait_24h');
});
