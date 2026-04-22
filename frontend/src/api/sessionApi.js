import { apiFetch } from './client.js';

function parsePrice(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const num = Number(normalized);

  if (!Number.isFinite(num) || num <= 0) {
    throw {
      code: 'INVALID_PRICE',
      message: 'Цена указана некорректно',
      details: { value },
    };
  }

  return num;
}

export async function startSession({ itemName, itemPrice, sessionToken }) {
  const cleanName = String(itemName ?? '').trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    throw {
      code: 'INVALID_ITEM_NAME',
      message: 'Название должно быть от 2 до 80 символов',
      details: { value: itemName },
    };
  }

  return apiFetch('/sessions/start', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      item_name: cleanName,
      item_price: parsePrice(itemPrice),
    }),
  });
}
