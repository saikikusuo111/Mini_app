import { createScalesWidget } from '../components/scales.js';

const DEFAULT_RANGE = 5;

function normalizeBalance(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(-1, Math.min(1, (numeric - DEFAULT_RANGE) / DEFAULT_RANGE));
}

function buildScaleCaption(value) {
  const diff = Number(value) - DEFAULT_RANGE;

  if (diff >= 4) {
    return 'Сильный перевес в сторону покупки';
  }

  if (diff >= 2) {
    return 'Уверенный уклон в сторону покупки';
  }

  if (diff <= -4) {
    return 'Сильный перевес против покупки';
  }

  if (diff <= -2) {
    return 'Уверенный уклон против покупки';
  }

  return 'Баланс почти ровный';
}

export function renderQuestionScreen(root, context) {
  const { question, session, totalQuestions = 0, onSubmitAnswer } = context;
  const questionNumber = Number(question.order) || 1;
  const total = Number(totalQuestions) || questionNumber;

  root.innerHTML = `
    <section class="question">
      <div class="card intro-box stack-12">
        <div class="kicker">Вопрос ${questionNumber} / ${total}</div>
        <h1 class="title">${escapeHtml(question.text)}</h1>
        <p class="subtitle">${escapeHtml(question.hint)}</p>

        <div class="card question-scales-card">
          <div class="input-label">Живой баланс ответа</div>
          <div id="question-scales-preview"></div>
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

        <div class="card">
          <div class="input-label">Сессия</div>
          <div class="note mono">${escapeHtml(session.sessionId)}</div>
          <div class="note">Решение фиксируется шаг за шагом. Текущий ответ сразу влияет на итоговый перевес.</div>
        </div>

        <div id="question-error" class="note" style="color:#b42318; display:none;"></div>
        <button id="next-btn" class="button">Сохранить ответ и идти дальше →</button>
      </div>
    </section>
  `;

  const scalesMount = root.querySelector('#question-scales-preview');
  const range = root.querySelector('#question-range');
  const value = root.querySelector('#range-value');
  const hint = root.querySelector('#context-hint');
  const nextBtn = root.querySelector('#next-btn');
  const errorBox = root.querySelector('#question-error');

  const scales = createScalesWidget({
    mode: 'question',
    balance: normalizeBalance(DEFAULT_RANGE),
    intensity: 0,
    leftLabel: question.label_left,
    rightLabel: question.label_right,
    caption: buildScaleCaption(DEFAULT_RANGE),
    live: true,
  });
  scalesMount.append(scales.element);

  function sync() {
    value.textContent = range.value;
    hint.textContent = question.context_hints?.[range.value] || '—';

    const nextBalance = normalizeBalance(range.value);
    scales.update({
      balance: nextBalance,
      intensity: Math.min(1, Math.abs(nextBalance)),
      caption: buildScaleCaption(range.value),
    });
  }

  range.addEventListener('input', sync);
  nextBtn.addEventListener('click', async () => {
    nextBtn.disabled = true;
    errorBox.style.display = 'none';
    errorBox.textContent = '';

    try {
      await onSubmitAnswer({
        answerValue: Number(range.value),
        questionId: question.id,
        questionOrder: question.order,
      });
    } catch (error) {
      errorBox.textContent = buildSaveErrorMessage(error);
      errorBox.style.display = 'block';
    } finally {
      nextBtn.disabled = false;
    }
  });

  sync();
}

function buildSaveErrorMessage(error) {
  const message = String(error?.message || '').trim();
  const code = String(error?.code || '').trim();

  if (message) {
    return `Не удалось сохранить ответ: ${message}`;
  }

  if (code) {
    return `Не удалось сохранить ответ (${code}). Проверь соединение и попробуй ещё раз.`;
  }

  return 'Не удалось сохранить ответ. Проверь соединение и попробуй ещё раз.';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
