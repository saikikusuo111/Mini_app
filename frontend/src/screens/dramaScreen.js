import { createScalesWidget } from '../components/scales.js';
import { preserveVisualContinuity } from '../scales/state.js';

function formatCompact(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(Number(value) || 0);
}

export function renderDramaScreen(root, context = {}) {
  const previousVisual = context.previousVisual || {};
  const startBalance = Number(previousVisual.balance) || 0;
  const convergingBalance = preserveVisualContinuity(startBalance, 0, 0.45);

  root.innerHTML = `
    <section class="placeholder">
      <div class="card drama-box stack-12">
        <div class="kicker">Drama mode</div>
        <h1 class="placeholder-title">Взвешиваем все «за» и «против»</h1>
        <p class="subtitle">Фиксируем последние веса и готовим финальный вердикт.</p>

        <div class="drama-scales-card">
          <div id="drama-scales-preview"></div>
          <div class="scales-metrics scales-metrics--drama">
            <div class="metric-box">
              <span>Против</span>
              <strong>${formatCompact(previousVisual.scoreAgainst)}</strong>
            </div>
            <div class="metric-box metric-box--muted">
              <span>Статус</span>
              <strong>Сходимость…</strong>
            </div>
            <div class="metric-box">
              <span>За</span>
              <strong>${formatCompact(previousVisual.scoreFor)}</strong>
            </div>
          </div>
        </div>

        <div class="status-line"><span class="pulse" aria-hidden="true"></span>Калибрую финальный баланс…</div>
      </div>
    </section>
  `;

  const mount = root.querySelector('#drama-scales-preview');
  const scales = createScalesWidget({
    mode: 'drama',
    startBalance,
    balance: convergingBalance,
    intensity: 0.78,
    caption: 'Система стабилизирует итоговые веса',
    leftLabel: 'Против',
    rightLabel: 'За',
  });

  mount.append(scales.element);
}
