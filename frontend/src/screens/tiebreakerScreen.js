function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderTiebreakerScreen(root, payload = {}) {
  const options = [
    { id: 'buy_now', label: 'Купить сейчас' },
    { id: 'wait_24h', label: 'Подождать 24 часа' },
    { id: 'find_alternative', label: 'Поискать альтернативу' },
    { id: 'skip_purchase', label: 'Отказаться от покупки' },
  ];

  root.innerHTML = `
    <section class="placeholder">
      <div class="card tiebreaker-box stack-12">
        <div class="kicker">Tie-breaker</div>
        <h1 class="placeholder-title">Что важнее прямо сейчас?</h1>
        <p class="subtitle">
          Баланс почти равный. Выбери один вариант — бэкенд рассчитает финальный результат.
        </p>

        <div class="stack-8">
          ${options
            .map(
              (option) => `
              <button class="btn-primary" data-tiebreaker-option="${escapeHtml(option.id)}">
                ${escapeHtml(option.label)}
              </button>
            `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  const buttons = root.querySelectorAll('[data-tiebreaker-option]');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (typeof payload.onSubmit !== 'function') {
        return;
      }

      const optionId = button.getAttribute('data-tiebreaker-option');
      buttons.forEach((item) => {
        item.disabled = true;
      });

      try {
        await payload.onSubmit({ optionId });
      } finally {
        buttons.forEach((item) => {
          item.disabled = false;
        });
      }
    });
  });
}
