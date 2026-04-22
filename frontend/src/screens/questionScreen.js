export function renderQuestionScreen(root, context) {
  const { question, session, onNextPlaceholder } = context;

  root.innerHTML = `
    <section class="question">
      <div class="card intro-box stack-12">
        <div class="kicker">Вопрос 1 / 10</div>
        <h1 class="title">${escapeHtml(question.text)}</h1>
        <p class="subtitle">${escapeHtml(question.hint)}</p>

        <div class="card">
          <div class="input-label">Сессия</div>
          <div class="note mono">${escapeHtml(session.sessionId)}</div>
          <div class="note">Draft создан в SQLite. Это уже не плейсхолдер, а первая живая decision session.</div>
        </div>

        <div class="card">
          <div class="input-label">Шкала</div>
          <div style="display:grid; gap:12px;">
            <input id="question-range" type="range" min="0" max="10" step="1" value="5" />
            <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; color:#5d5d5d;">
              <span>${escapeHtml(question.label_left)}</span>
              <strong id="range-value">5</strong>
              <span style="text-align:right;">${escapeHtml(question.label_right)}</span>
            </div>
            <div class="note" id="context-hint">${escapeHtml(question.context_hints['5'] || '—')}</div>
          </div>
        </div>

        <button id="next-btn" class="button">Сохранить ответ и идти дальше →</button>
      </div>
    </section>
  `;

  const range = root.querySelector('#question-range');
  const value = root.querySelector('#range-value');
  const hint = root.querySelector('#context-hint');
  const nextBtn = root.querySelector('#next-btn');

  function sync() {
    value.textContent = range.value;
    hint.textContent = question.context_hints?.[range.value] || '—';
  }

  range.addEventListener('input', sync);
  nextBtn.addEventListener('click', () => {
    onNextPlaceholder({
      answerValue: Number(range.value),
      questionId: question.id,
      questionOrder: question.order,
    });
  });

  sync();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
