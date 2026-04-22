export const appState = {
  screen: 'BOOT',
  user: null,
  sessionToken: null,
  entitlement: null,
  flowConfig: null,
  currentSession: null,
  loading: false,
  error: null,
};

export function setAppState(patch) {
  Object.assign(appState, patch);
}
