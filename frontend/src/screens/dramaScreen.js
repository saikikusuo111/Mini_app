export function renderDramaScreen(root) {
  root.innerHTML = `
    <section class="placeholder">
      <div class="card drama-box stack-12">
        <div class="kicker">Drama mode</div>
        <h1 class="placeholder-title">Взвешиваем все «за» и «против»</h1>
        <p class="subtitle">Ещё пару секунд — считаем итог по твоим ответам.</p>
        <div class="status-line"><span class="pulse" aria-hidden="true"></span>Собираю финальный вывод…</div>
      </div>
    </section>
  `;
}
