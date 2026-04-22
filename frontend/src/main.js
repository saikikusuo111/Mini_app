import { telegramAuth } from './api/authApi.js';
import { getPurchaseFlow } from './api/configApi.js';
import { startSession } from './api/sessionApi.js';
import { initTelegram } from './bridge/telegram.js';
import { setAppState, appState } from './state/appState.js';
import { hydrateSessionDraft } from './state/sessionStore.js';
import { renderBootScreen } from './screens/bootScreen.js';
import { renderErrorScreen } from './screens/errorScreen.js';
import { renderIntroScreen } from './screens/introScreen.js';
import { renderQuestionScreen } from './screens/questionScreen.js';
import { renderPlaceholderScreen } from './screens/placeholderScreen.js';

const root = document.getElementById('app');

async function boot() {
  try {
    setAppState({ screen: 'BOOT', error: null });
    renderBootScreen(root, 'Проверяю Telegram-сессию и тяну конфиг');
    hydrateSessionDraft();

    const telegram = initTelegram();
    const auth = await telegramAuth(telegram.initData);
    const flowConfig = await getPurchaseFlow();

    setAppState({
      screen: 'INTRO',
      user: auth.user,
      sessionToken: auth.session_token,
      entitlement: auth.entitlement,
      flowConfig,
      currentSession: null,
    });

    renderIntro();
  } catch (error) {
    console.error('Boot failed:', error);
    setAppState({ screen: 'ERROR', error });
    renderErrorScreen(root, error, boot);
  }
}

function renderIntro() {
  renderIntroScreen(root, {
    user: appState.user,
    entitlement: appState.entitlement,
    flowConfig: appState.flowConfig,
    onStart: handleStartSession,
  });
}

async function handleStartSession(draft) {
  try {
    renderBootScreen(root, 'Создаю decision session');

    const session = await startSession({
      itemName: draft.itemName,
      itemPrice: draft.itemPrice,
      sessionToken: appState.sessionToken,
    });

    setAppState({
      screen: 'QUESTION_ACTIVE',
      currentSession: {
        sessionId: session.session_id,
        flowType: session.flow_type,
        startedAt: session.started_at,
        currentQuestionOrder: session.current_question_order,
        itemName: draft.itemName,
        itemPrice: draft.itemPrice,
      },
    });

    renderQuestion1();
  } catch (error) {
    console.error('Session start failed:', error);
    setAppState({ screen: 'ERROR', error });
    renderErrorScreen(root, error, boot);
  }
}

function renderQuestion1() {
  const question = appState.flowConfig?.questions?.[0];
  if (!question) {
    renderErrorScreen(root, { code: 'QUESTION_NOT_FOUND', message: 'Первый вопрос не найден в config.' }, boot);
    return;
  }

  renderQuestionScreen(root, {
    question,
    session: appState.currentSession,
    onNextPlaceholder: ({ answerValue, questionId, questionOrder }) => {
      renderPlaceholderScreen(root, {
        itemName: appState.currentSession.itemName,
        itemPrice: appState.currentSession.itemPrice,
        sessionId: appState.currentSession.sessionId,
        answerValue,
        questionId,
        questionOrder,
      });
    },
  });
}

boot();
