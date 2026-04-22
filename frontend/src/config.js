export const APP_VERSION = '0.1.0-wave1';

export function getApiBaseUrl() {
  if (window.__VESY_API_BASE_URL__) {
    return window.__VESY_API_BASE_URL__;
  }

  return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
}