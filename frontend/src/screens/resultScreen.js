// frontend/src/screens/resultScreen.js
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildResultViewModel(finalResult = {}) {
  return {
    finalVerdict: finalResult.final_verdict || '—',
    finalVerdictLabel: finalResult.final_verdict_label || '—',
    resultBasis: finalResult.result_basis || '—',
    usedTiebreaker: Boolean(finalResult.used_tiebreaker),
    tiebreakerOptionId: finalResult.tiebreaker_option_id || '—',
    preliminaryVerdict: finalResult.preliminary_verdict || '—',
    preliminaryScoreFor: finalResult.preliminary_score_for,
    preliminaryScoreAgainst: finalResult.preliminary_score_against,
    preliminaryDiff: finalResult.preliminary_diff,
    preliminaryDiffPercent: finalResult.preliminary_diff_percent,
  };
}

export function renderResultScreen(root, payload = {}) {
  const finalResult = payload.finalResult || {};
  const view = buildResultViewModel(finalResult);

  root.innerHTML = `
    <section class="placeholder">
      <div class="card result-box stack-12">
        <div class="kicker">Result</div>
        <h1 class="placeholder-title">Финальный итог</h1>

        <div class="card">
          <div class="input-label">Финальное решение</div>
          <div class="mono"><strong>${escapeHtml(view.finalVerdictLabel)}</strong></div>
          <div class="note">final_verdict: <strong>${escapeHtml(view.finalVerdict)}</strong></div>
        </div>

        <div class="card">
          <div class="input-label">Основание результата</div>
          <div class="note">result_basis: <strong>${escapeHtml(view.resultBasis)}</strong></div>
          <div class="note">used_tiebreaker: <strong>${escapeHtml(view.usedTiebreaker)}</strong></div>
          <div class="note">tiebreaker_option_id: <strong>${escapeHtml(view.tiebreakerOptionId)}</strong></div>
        </div>

        <div class="card">
          <div class="input-label">Предварительная математика (до tie-breaker)</div>
          <div class="note">preliminary_verdict: <strong>${escapeHtml(view.preliminaryVerdict)}</strong></div>
          <div class="note">preliminary_score_for: <strong>${escapeHtml(view.preliminaryScoreFor)}</strong></div>
          <div class="note">preliminary_score_against: <strong>${escapeHtml(view.preliminaryScoreAgainst)}</strong></div>
          <div class="note">preliminary_diff: <strong>${escapeHtml(view.preliminaryDiff)}</strong></div>
          <div class="note">preliminary_diff_percent: <strong>${escapeHtml(view.preliminaryDiffPercent)}</strong></div>
        </div>
      </div>
    </section>
  `;
}
