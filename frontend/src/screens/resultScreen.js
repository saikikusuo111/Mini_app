function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderResultScreen(root, payload = {}) {
  const finalResult = payload.finalResult || {};

  root.innerHTML = `
    <section class="placeholder">
      <div class="card result-box stack-12">
        <div class="kicker">Result</div>
        <h1 class="placeholder-title">Предварительный итог готов</h1>
        <p class="subtitle">
          Это простой экран результата на основе ответа finalize.
          Полированный UI добавим позже.
        </p>

        <div class="card">
          <div class="input-label">Вердикт</div>
          <div class="mono"><strong>${escapeHtml(finalResult.preliminary_verdict || '—')}</strong></div>
        </div>

        <div class="card">
          <div class="input-label">Счёт</div>
          <div class="note">score_for: <strong>${escapeHtml(finalResult.score_for)}</strong></div>
          <div class="note">score_against: <strong>${escapeHtml(finalResult.score_against)}</strong></div>
          <div class="note">diff: <strong>${escapeHtml(finalResult.diff)}</strong></div>
          <div class="note">diff_percent: <strong>${escapeHtml(finalResult.diff_percent)}</strong></div>
        </div>
      </div>
    </section>
  `;
}
