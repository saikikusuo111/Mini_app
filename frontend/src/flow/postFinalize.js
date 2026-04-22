export function resolvePostFinalizeScreen(finalResult) {
  if (!finalResult || typeof finalResult !== 'object') {
    return 'FALLBACK';
  }

  if (finalResult.needs_tiebreaker === true) {
    return 'TIEBREAKER';
  }

  if (finalResult.needs_tiebreaker === false) {
    return 'RESULT';
  }

  return 'FALLBACK';
}
