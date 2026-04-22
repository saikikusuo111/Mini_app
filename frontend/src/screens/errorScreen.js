export function renderErrorScreen(root, error, onRetry) {
  root.innerHTML = `
    <section class="error">
      <div class="card error-box stack-12">
        <div class="kicker">Ошибка</div>
        <h1 class="title">Что-то пошло не так</h1>
        <p class="subtitle">${error?.message || 'Не удалось загрузить стартовый экран.'}</p>
        <div class="note mono">${error?.code || 'UNKNOWN_ERROR'}</div>
        <button id="retry-btn" class="button">Попробовать снова</button>
      </div>
    </section>
  `;

  root.querySelector('#retry-btn')?.addEventListener('click', onRetry);
}
