import { apiFetch } from './client.js';

export async function getPurchaseFlow() {
  return apiFetch('/config/purchase-flow');
}
