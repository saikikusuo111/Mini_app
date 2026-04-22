function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderTiebreakerScreen(root, payload = {}) {
  root.innerHTML = `
    <section class="placeholder">
      <div class="card tiebreaker-box stack-12">
        <div class="kicker">Tie-breaker pending</div>
        <h1 class="placeholder-title">Нужен дополнительный вопрос</h1>
        <p class="subtitle">
          Баланс почти равный, поэтому следующий шаг — tie-breaker экран.
          Пока оставляем это как заглушку.
        </p>

        <div class="card">
          <div class="input-label">Сессия</div>
          <div class="mono"><strong>${escapeHtml(payload.sessionId || payload.finalResult?.session_id || '—')}</strong></div>
        </div>

        <div class="card">
          <div class="input-label">Pre-result (fallback)</div>
          <div class="note">diff: <strong>${escapeHtml(payload.finalResult?.diff)}</strong></div>
          <div class="note">diff_percent: <strong>${escapeHtml(payload.finalResult?.diff_percent)}</strong></div>
          <div class="note">preliminary_verdict: <strong>${escapeHtml(payload.finalResult?.preliminary_verdict)}</strong></div>
        </div>
      </div>
    </section>
  `;
}
