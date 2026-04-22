import { apiFetch } from './client.js';

export async function telegramAuth(initData) {
  return apiFetch('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ init_data: initData || '' }),
  });
}
