export function renderPlaceholderScreen(root, draft) {
  root.innerHTML = `
    <section class="placeholder">
      <div class="card placeholder-box stack-12">
        <div class="kicker">Wave 2 complete</div>
        <h1 class="placeholder-title">Первая decision session создана</h1>
        <p class="subtitle">
          Session стартовала, первый вопрос показан, первый ответ собран на фронте.
          Следующий шаг — сделать <span class="mono">POST /sessions/{id}/answer</span>
          и полноценный переход ко второму вопросу.
        </p>
        <div class="card">
          <div class="input-label">Сессия</div>
          <div class="mono"><strong>${escapeHtml(draft.sessionId || '—')}</strong></div>
          <div class="note">${escapeHtml(draft.itemName || 'покупка')} · $${escapeHtml(draft.itemPrice || '')}</div>
        </div>
        <div class="card">
          <div class="input-label">Первый ответ</div>
          <div><strong>${escapeHtml(draft.questionId || 'question')} = ${escapeHtml(draft.answerValue ?? '—')}</strong></div>
          <div class="note">Порядок вопроса: ${escapeHtml(draft.questionOrder ?? '—')}</div>
        </div>
      </div>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
