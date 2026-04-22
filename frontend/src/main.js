import { telegramAuth } from './api/authApi.js';
import { getPurchaseFlow } from './api/configApi.js';
import { startSession, submitSessionAnswer } from './api/sessionApi.js';
import { initTelegram } from './bridge/telegram.js';
import { setAppState, appState } from './state/appState.js';
import { hydrateSessionDraft } from './state/sessionStore.js';
import { renderBootScreen } from './screens/bootScreen.js';
import { renderErrorScreen } from './screens/errorScreen.js';
import { renderIntroScreen } from './screens/introScreen.js';
import { renderQuestionScreen } from './screens/questionScreen.js';

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
        answers: {},
      },
    });

    renderCurrentQuestion();
  } catch (error) {
    console.error('Session start failed:', error);
    setAppState({ screen: 'ERROR', error });
    renderErrorScreen(root, error, boot);
  }
}

function renderCurrentQuestion() {
  const order = appState.currentSession?.currentQuestionOrder;
  const question = appState.flowConfig?.questions?.find((item) => item.order === order);

  if (!question) {
    renderErrorScreen(
      root,
      { code: 'QUESTION_NOT_FOUND', message: `Вопрос с порядком ${order} не найден в config.` },
      boot,
    );
    return;
  }

  renderQuestionScreen(root, {
    question,
    session: appState.currentSession,
    totalQuestions: appState.flowConfig?.questions?.length || 0,
    onSubmitAnswer: async ({ answerValue, questionId, questionOrder }) => {
      const response = await submitSessionAnswer({
        sessionId: appState.currentSession.sessionId,
        questionId,
        questionOrder,
        answerValue,
      });

      setAppState({
        currentSession: {
          ...appState.currentSession,
          currentQuestionOrder: response.current_question_order,
          answers: {
            ...(appState.currentSession.answers || {}),
            [questionId]: answerValue,
          },
        },
      });

      renderCurrentQuestion();
    },
  });
}

boot();
