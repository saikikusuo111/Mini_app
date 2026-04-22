function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function computePreviewWeights({ answers = {}, currentQuestionId, currentValue = 5, includeCurrent = true } = {}) {
  const entries = Object.entries(answers || {});
  let scoreFor = 0;
  let scoreAgainst = 0;

  for (const [questionId, answerValue] of entries) {
    if (currentQuestionId && String(questionId) === String(currentQuestionId)) {
      continue;
    }

    const value = clamp(toNumber(answerValue, 5), 0, 10);
    scoreFor += value;
    scoreAgainst += 10 - value;
  }

  if (includeCurrent) {
    const live = clamp(toNumber(currentValue, 5), 0, 10);
    scoreFor += live;
    scoreAgainst += 10 - live;
  }

  const total = Math.max(scoreFor + scoreAgainst, 1);
  const diff = scoreFor - scoreAgainst;

  return {
    scoreFor,
    scoreAgainst,
    diff,
    balance: clamp(diff / (total * 0.5), -1, 1),
  };
}

export function deriveResultWeights(finalResult = {}) {
  const scoreFor = toNumber(finalResult.preliminary_score_for, NaN);
  const scoreAgainst = toNumber(finalResult.preliminary_score_against, NaN);

  if (Number.isFinite(scoreFor) && Number.isFinite(scoreAgainst)) {
    const total = Math.max(Math.abs(scoreFor) + Math.abs(scoreAgainst), 1);
    return {
      scoreFor,
      scoreAgainst,
      diff: scoreFor - scoreAgainst,
      balance: clamp((scoreFor - scoreAgainst) / (total * 0.5), -1, 1),
    };
  }

  return {
    scoreFor: 0,
    scoreAgainst: 0,
    diff: 0,
    balance: 0,
  };
}

export function preserveVisualContinuity(previousBalance = 0, targetBalance = 0, softness = 0.35) {
  const prev = clamp(toNumber(previousBalance), -1, 1);
  const target = clamp(toNumber(targetBalance), -1, 1);
  const factor = clamp(toNumber(softness, 0.35), 0.05, 1);

  return prev + (target - prev) * factor;
}
