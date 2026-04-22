import { apiFetch } from './client.js';

function parsePrice(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const num = Number(normalized);

  if (!Number.isFinite(num) || num <= 0) {
    throw {
      code: 'INVALID_PRICE',
      message: 'Цена указана некорректно',
      details: { value },
    };
  }

  return num;
}

export async function startSession({ itemName, itemPrice, sessionToken }) {
  const cleanName = String(itemName ?? '').trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    throw {
      code: 'INVALID_ITEM_NAME',
      message: 'Название должно быть от 2 до 80 символов',
      details: { value: itemName },
    };
  }

  return apiFetch('/sessions/start', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      item_name: cleanName,
      item_price: parsePrice(itemPrice),
    }),
  });
}

export async function submitSessionAnswer({ sessionId, questionId, questionOrder, answerValue }) {
  const cleanSessionId = String(sessionId ?? '').trim();
  const cleanQuestionId = String(questionId ?? '').trim();

  if (!cleanSessionId) {
    throw {
      code: 'INVALID_SESSION_ID',
      message: 'Не удалось сохранить ответ: отсутствует session_id',
      details: { sessionId },
    };
  }

  if (!cleanQuestionId) {
    throw {
      code: 'INVALID_QUESTION_ID',
      message: 'Не удалось сохранить ответ: отсутствует question_id',
      details: { questionId },
    };
  }

  return apiFetch(`/sessions/${encodeURIComponent(cleanSessionId)}/answer`, {
    method: 'POST',
    body: JSON.stringify({
      question_id: cleanQuestionId,
      question_order: Number(questionOrder),
      answer_value: Number(answerValue),
    }),
  });
}

export async function finalizeSession({ sessionId }) {
  const cleanSessionId = String(sessionId ?? '').trim();
  if (!cleanSessionId) {
    throw {
      code: 'INVALID_SESSION_ID',
      message: 'Не удалось завершить: отсутствует session_id',
      details: { sessionId },
    };
  }

  return apiFetch(`/sessions/${encodeURIComponent(cleanSessionId)}/finalize`, {
    method: 'POST',
  });
}

export async function submitSessionTiebreaker({ sessionId, optionId }) {
  const cleanSessionId = String(sessionId ?? '').trim();
  const cleanOptionId = String(optionId ?? '').trim();

  if (!cleanSessionId) {
    throw {
      code: 'INVALID_SESSION_ID',
      message: 'Не удалось отправить tie-breaker: отсутствует session_id',
      details: { sessionId },
    };
  }

  if (!cleanOptionId) {
    throw {
      code: 'INVALID_TIEBREAKER_OPTION',
      message: 'Не удалось отправить tie-breaker: отсутствует option_id',
      details: { optionId },
    };
  }

  return apiFetch(`/sessions/${encodeURIComponent(cleanSessionId)}/tiebreaker`, {
    method: 'POST',
    body: JSON.stringify({
      option_id: cleanOptionId,
    }),
  });
}
