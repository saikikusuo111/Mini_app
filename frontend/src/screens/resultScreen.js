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

function formatNumber(value, fractionDigits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numeric);
}

export function buildResultCopy(view) {
  const finalDecisionTitle = view.finalVerdictLabel || 'Решение готово';
  const basisHeadline = view.usedTiebreaker
    ? 'Финальный выбор сделан на этапе tie-breaker.'
    : 'Финальный выбор сделан напрямую по взвешенной математике.';

  const basisDetail = view.usedTiebreaker
    ? 'Когда предварительные баллы оказались слишком близкими, система запросила дополнительный выбор. Именно этот выбор зафиксировал итог.'
    : 'Дополнительный tie-breaker не потребовался: разница в итоговых весах оказалась достаточной для прямого решения.';

  const preliminaryVerdictText = view.preliminaryVerdict === 'tiebreaker_required'
    ? 'Предварительный расчет показал пограничный результат, поэтому понадобился tie-breaker.'
    : 'Предварительный расчет сразу дал достаточно уверенный перевес.';

  return {
    finalDecisionTitle,
    basisHeadline,
    basisDetail,
    preliminaryVerdictText,
    preliminaryFor: formatNumber(view.preliminaryScoreFor),
    preliminaryAgainst: formatNumber(view.preliminaryScoreAgainst),
    preliminaryDiff: formatNumber(view.preliminaryDiff),
    preliminaryDiffPercent: formatNumber(view.preliminaryDiffPercent),
  };
}

export function renderResultScreen(root, payload = {}) {
  const finalResult = payload.finalResult || {};
  const view = buildResultViewModel(finalResult);
  const copy = buildResultCopy(view);

  root.innerHTML = `
    <section class="placeholder">
      <div class="card result-box stack-12">
        <div class="kicker">Result</div>
        <h1 class="placeholder-title">Финальный итог</h1>

        <div class="card result-highlight">
          <div class="input-label">Финальное решение</div>
          <div class="result-decision">${escapeHtml(copy.finalDecisionTitle)}</div>
        </div>

        <div class="card">
          <div class="input-label">Почему получился именно такой итог</div>
          <div class="result-basis-title">${escapeHtml(copy.basisHeadline)}</div>
          <div class="note">${escapeHtml(copy.basisDetail)}</div>
        </div>

        <div class="card">
          <div class="input-label">Что показал предварительный расчет</div>
          <div class="note">${escapeHtml(copy.preliminaryVerdictText)}</div>
          <div class="result-math-grid">
            <div class="math-item">
              <div class="math-key">За покупку</div>
              <div class="math-value">${escapeHtml(copy.preliminaryFor)}</div>
            </div>
            <div class="math-item">
              <div class="math-key">Против покупки</div>
              <div class="math-value">${escapeHtml(copy.preliminaryAgainst)}</div>
            </div>
            <div class="math-item">
              <div class="math-key">Разница</div>
              <div class="math-value">${escapeHtml(copy.preliminaryDiff)}</div>
            </div>
            <div class="math-item">
              <div class="math-key">Разница, %</div>
              <div class="math-value">${escapeHtml(copy.preliminaryDiffPercent)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
