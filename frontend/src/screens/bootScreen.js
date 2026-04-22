export function renderBootScreen(root, statusText = 'Запускаю вертикальный срез') {
  root.innerHTML = `
    <section class="boot">
      <div class="card boot-box">
        <div class="status-line"><span class="pulse"></span>BOOT</div>
        <h1 class="title">Весы</h1>
        <p class="subtitle">${statusText}</p>
        <div class="inline-pill mono">Wave 1 · auth/config slice</div>
      </div>
    </section>
  `;
}
