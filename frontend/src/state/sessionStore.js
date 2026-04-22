const KEY = 'vesy_wave1_session_draft';

export const sessionStore = {
  itemName: '',
  itemPrice: '',
};

export function hydrateSessionDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    sessionStore.itemName = parsed.itemName || '';
    sessionStore.itemPrice = parsed.itemPrice || '';
  } catch (error) {
    console.warn('Failed to hydrate session draft:', error);
  }
}

export function persistSessionDraft() {
  localStorage.setItem(KEY, JSON.stringify(sessionStore));
}
