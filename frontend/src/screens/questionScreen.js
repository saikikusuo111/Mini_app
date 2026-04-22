import { createScalesWidget } from '../components/scales.js';
import { computePreviewWeights, preserveVisualContinuity } from '../scales/state.js';

const DEFAULT_RANGE = 5;

function buildScaleCaption(diff) {
  if (diff >= 8) return 'Сильный перевес в сторону покупки';
  if (diff >= 3) return 'Умеренный перевес в сторону покупки';
  if (diff <= -8) return 'Сильный перевес против покупки';
  if (diff <= -3) return 'Умеренный перевес против покупки';
  return 'Баланс близок к нейтральному';
}

function formatCompact(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
}

export function renderQuestionScreen(root, context) {
  const { question, session, totalQuestions = 0, onSubmitAnswer, onVisualChange } = context;
  const questionNumber = Number(question.order) || 1;
  const total = Number(totalQuestions) || questionNumber;

  root.innerHTML = `
    <section class="question">
      <div class="card intro-box question-layout">
        <div class="kicker">Вопрос ${questionNumber} / ${total}</div>
        <h1 class="title">${escapeHtml(question.text)}</h1>
        <p class="subtitle">${escapeHtml(question.hint)}</p>

        <div class="question-scales-card">
          <div id="question-scales-preview"></div>
          <div class="scales-metrics">
            <div class="metric-box">
              <span>Против</span>
              <strong id="metric-against">0</strong>
            </div>
            <div class="metric-box">
              <span>Текущий вклад</span>
              <strong id="metric-impact">5 / 10</strong>
            </div>
            <div class="metric-box">
              <span>За</span>
              <strong id="metric-for">0</strong>
            </div>
          </div>
        </div>

        <div class="question-controls">
          <input id="question-range" type="range" min="0" max="10" step="1" value="5" />
          <div class="question-range-labels">
            <span>${escapeHtml(question.label_left)}</span>
            <strong id="range-value">5</strong>
            <span>${escapeHtml(question.label_right)}</span>
          </div>
          <div class="note" id="context-hint">${escapeHtml(question.context_hints['5'] || '—')}</div>
        </div>

        <div class="question-footnote">
          <span class="inline-pill">Session ${escapeHtml(session.sessionId)}</span>
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

  const metricFor = root.querySelector('#metric-for');
  const metricAgainst = root.querySelector('#metric-against');
  const metricImpact = root.querySelector('#metric-impact');

  const previousBalance = Number(session?.scalesVisual?.balance) || 0;
  const initialPreview = computePreviewWeights({
    answers: session?.answers || {},
    currentQuestionId: question.id,
    currentValue: DEFAULT_RANGE,
  });

  const scales = createScalesWidget({
    mode: 'question',
    startBalance: previousBalance,
    balance: preserveVisualContinuity(previousBalance, initialPreview.balance, 0.72),
    intensity: Math.min(1, Math.abs(initialPreview.balance)),
    leftLabel: question.label_left,
    rightLabel: question.label_right,
    caption: buildScaleCaption(initialPreview.diff),
  });
  scalesMount.append(scales.element);

  function sync() {
    value.textContent = range.value;
    hint.textContent = question.context_hints?.[range.value] || '—';

    const preview = computePreviewWeights({
      answers: session?.answers || {},
      currentQuestionId: question.id,
      currentValue: range.value,
    });

    metricFor.textContent = formatCompact(preview.scoreFor);
    metricAgainst.textContent = formatCompact(preview.scoreAgainst);
    metricImpact.textContent = `${range.value} / 10`;

    scales.update({
      balance: preview.balance,
      intensity: Math.min(1, Math.abs(preview.balance)),
      caption: buildScaleCaption(preview.diff),
    });

    onVisualChange?.({
      balance: preview.balance,
      scoreFor: preview.scoreFor,
      scoreAgainst: preview.scoreAgainst,
      source: 'question_live',
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
