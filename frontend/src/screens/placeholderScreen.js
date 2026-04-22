export function renderPlaceholderScreen(root, payload = {}) {
  const answers = payload.answers || {};
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = Number(payload.totalQuestions || 0);

  root.innerHTML = `
    <section class="placeholder">
      <div class="card placeholder-box stack-12">
        <div class="kicker">Flow complete</div>
        <h1 class="placeholder-title">Опрос завершён</h1>
        <p class="subtitle">
          Все вопросы пройдены. Следующий шаг — собрать
          <span class="mono">finalize / drama / result</span>.
        </p>

        <div class="card">
          <div class="input-label">Сессия</div>
          <div class="mono"><strong>${escapeHtml(payload.sessionId || '—')}</strong></div>
          <div class="note">Отвечено: ${answeredCount} из ${totalQuestions}</div>
        </div>

        <div class="card">
          <div class="input-label">Ответы</div>
          ${renderAnswersList(answers)}
        </div>
      </div>
    </section>
  `;
}

function renderAnswersList(answers) {
  const entries = Object.entries(answers || {});
  if (!entries.length) {
    return '<div class="note">Ответы пока не найдены.</div>';
  }

  return `
    <div style="display:grid; gap:8px;">
      ${entries
        .map(
          ([questionId, value]) => `
            <div class="note">
              <strong>${escapeHtml(questionId)}</strong>: ${escapeHtml(value)}
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
