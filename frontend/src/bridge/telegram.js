export function getTelegramWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getTelegramWebApp();
  if (!tg) {
    return {
      available: false,
      initData: 'dev_local_init_data',
      user: null,
      colorScheme: 'light',
    };
  }

  try {
    tg.ready();
    tg.expand();
  } catch (error) {
    console.warn('Telegram WebApp init warning:', error);
  }

  return {
    available: true,
    initData: tg.initData || '',
    user: tg.initDataUnsafe?.user ?? null,
    colorScheme: tg.colorScheme || 'light',
  };
}
