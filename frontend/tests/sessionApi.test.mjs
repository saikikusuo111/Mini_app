import test from 'node:test';
import assert from 'node:assert/strict';

import { submitSessionAnswer } from '../src/api/sessionApi.js';

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
