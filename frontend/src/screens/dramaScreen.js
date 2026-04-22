import { createScalesWidget } from '../components/scales.js';

export function renderDramaScreen(root) {
  root.innerHTML = `
    <section class="placeholder">
      <div class="card drama-box stack-12">
        <div class="kicker">Drama mode</div>
        <h1 class="placeholder-title">Взвешиваем все «за» и «против»</h1>
        <p class="subtitle">Ещё пару секунд — считаем итог по твоим ответам.</p>

        <div class="card drama-scales-card">
          <div class="input-label">Финальное взвешивание</div>
          <div id="drama-scales-preview"></div>
        </div>

        <div class="status-line"><span class="pulse" aria-hidden="true"></span>Фиксирую баланс и готовлю вердикт…</div>
      </div>
    </section>
  `;

  const mount = root.querySelector('#drama-scales-preview');
  const scales = createScalesWidget({
    mode: 'drama',
    balance: 0,
    intensity: 0.8,
    caption: 'Система стабилизирует итоговый перевес',
    leftLabel: 'Против',
    rightLabel: 'За',
  });

  mount.append(scales.element);
}
