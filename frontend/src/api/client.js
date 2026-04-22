import { getApiBaseUrl } from '../config.js';

export async function apiFetch(path, options = {}) {
  const url = `${getApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let error =
      data?.detail?.error ||
      data?.error || {
        code: 'HTTP_ERROR',
        message: `Request failed with status ${response.status}`,
        details: {},
      };

    if (response.status === 422 && Array.isArray(data?.detail)) {
      error = {
        code: 'VALIDATION_ERROR',
        message: data.detail
          .map((item) => `${(item.loc || []).join('.')} — ${item.msg}`)
          .join('; '),
        details: { raw: data.detail },
      };
    }

    throw error;
  }

  return data;
}
