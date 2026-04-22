import { sessionStore, persistSessionDraft } from '../state/sessionStore.js';

function parsePrice(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function isValid(itemName, itemPrice) {
  const nameValid = itemName.trim().length >= 2 && itemName.trim().length <= 80;
  const numeric = parsePrice(itemPrice);
  const priceValid = Number.isFinite(numeric) && numeric > 0;
  return nameValid && priceValid;
}

export function renderIntroScreen(root, context) {
  const { user, entitlement, flowConfig, onStart } = context;

  root.innerHTML = `
    <section class="intro">
      <div class="card intro-box">
        <div class="kicker">Холодные весы · Wave 2</div>
        <h1 class="title">Стоит ли это покупать?</h1>
        <p class="subtitle">${flowConfig?.copy?.intro_subtitle || '10 вопросов. Без AI. Только математика твоих приоритетов.'}</p>
        <div class="intro-grid">
          <div>
            <label class="input-label" for="item-name">Что взвешиваем</label>
            <input id="item-name" class="input" type="text" placeholder="Например: куртка за $180" value="${escapeHtml(sessionStore.itemName)}" />
          </div>
          <div>
            <label class="input-label" for="item-price">Цена</label>
            <input id="item-price" class="input" type="text" inputmode="decimal" placeholder="180" value="${escapeHtml(sessionStore.itemPrice)}" />
          </div>
          <div class="meta-row">
            <div class="card">
              <div class="input-label">План</div>
              <div><strong>${entitlement?.plan || 'free'}</strong></div>
              <div class="note">Осталось сегодня: ${entitlement?.remaining_today ?? '—'}</div>
            </div>
            <div class="card">
              <div class="input-label">Пользователь</div>
              <div><strong>${escapeHtml(user?.first_name || user?.username || 'Гость')}</strong></div>
              <div class="note">@${escapeHtml(user?.username || 'local_dev')}</div>
            </div>
          </div>
          <div class="note">
            Wave 2: после клика создаётся draft session в SQLite и открывается первый вопрос.
          </div>
          <button id="start-btn" class="button" disabled>На весы →</button>
        </div>
      </div>
    </section>
  `;

  const itemNameInput = root.querySelector('#item-name');
  const itemPriceInput = root.querySelector('#item-price');
  const startBtn = root.querySelector('#start-btn');

  function sync() {
    sessionStore.itemName = itemNameInput.value;
    sessionStore.itemPrice = itemPriceInput.value;
    persistSessionDraft();
    startBtn.disabled = !isValid(sessionStore.itemName, sessionStore.itemPrice);
  }

  itemNameInput.addEventListener('input', sync);
  itemPriceInput.addEventListener('input', sync);
  startBtn.addEventListener('click', () => onStart({ ...sessionStore }));

  sync();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
