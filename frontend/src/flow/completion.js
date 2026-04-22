export function isFlowCompleted(currentQuestionOrder, totalQuestions) {
  const order = Number(currentQuestionOrder);
  const total = Number(totalQuestions);

  if (!Number.isFinite(order) || !Number.isFinite(total) || total < 1) {
    return false;
  }

  return order > total;
}
