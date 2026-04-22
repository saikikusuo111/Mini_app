import { telegramAuth } from './api/authApi.js';
import { getPurchaseFlow } from './api/configApi.js';
import {
  finalizeSession,
  startSession,
  submitSessionAnswer,
  submitSessionTiebreaker,
} from './api/sessionApi.js';
import { initTelegram } from './bridge/telegram.js';
import { setAppState, appState } from './state/appState.js';
import { hydrateSessionDraft } from './state/sessionStore.js';
import { renderBootScreen } from './screens/bootScreen.js';
import { renderErrorScreen } from './screens/errorScreen.js';
import { renderIntroScreen } from './screens/introScreen.js';
import { renderQuestionScreen } from './screens/questionScreen.js';
import { renderPlaceholderScreen } from './screens/placeholderScreen.js';
import { renderDramaScreen } from './screens/dramaScreen.js';
import { renderTiebreakerScreen } from './screens/tiebreakerScreen.js';
import { renderResultScreen } from './screens/resultScreen.js';
import { resolvePostFinalizeScreen } from './flow/postFinalize.js';
import { isFlowCompleted } from './flow/completion.js';
import { computePreviewWeights, deriveResultWeights } from './scales/state.js';

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
        scalesVisual: {
          balance: 0,
          scoreFor: 5,
          scoreAgainst: 5,
          source: 'session_start',
        },
      },
    });

    await renderCurrentQuestion();
  } catch (error) {
    console.error('Session start failed:', error);
    setAppState({ screen: 'ERROR', error });
    renderErrorScreen(root, error, boot);
  }
}

async function renderCurrentQuestion() {
  const order = appState.currentSession?.currentQuestionOrder;
  const totalQuestions = appState.flowConfig?.questions?.length || 0;

  if (isFlowCompleted(order, totalQuestions)) {
    renderDramaScreen(root, { previousVisual: appState.currentSession?.scalesVisual || {} });
    await new Promise((resolve) => setTimeout(resolve, 900));

    const finalResult = await finalizeSession({
      sessionId: appState.currentSession.sessionId,
    });

    const resultWeights = deriveResultWeights(finalResult);

    setAppState({
      currentSession: {
        ...appState.currentSession,
        finalResult,
        scalesVisual: {
          ...(appState.currentSession?.scalesVisual || {}),
          balance: resultWeights.balance,
          scoreFor: resultWeights.scoreFor,
          scoreAgainst: resultWeights.scoreAgainst,
          source: 'finalize_result',
        },
      },
    });

    const nextScreen = resolvePostFinalizeScreen(finalResult);
    if (nextScreen === 'TIEBREAKER') {
      renderTiebreakerScreen(root, {
        sessionId: appState.currentSession.sessionId,
        finalResult,
        onSubmit: handleSubmitTiebreaker,
      });
      return;
    }

    if (nextScreen === 'RESULT') {
      renderResultScreen(root, {
        sessionId: appState.currentSession.sessionId,
        finalResult,
        previousVisual: appState.currentSession?.scalesVisual || {},
      });
      return;
    }

    renderPlaceholderScreen(root, {
      sessionId: appState.currentSession.sessionId,
      totalQuestions,
      answers: appState.currentSession.answers || {},
      finalResult,
    });
    return;
  }

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
    totalQuestions,
    onVisualChange: (visualPatch) => {
      setAppState({
        currentSession: {
          ...appState.currentSession,
          scalesVisual: {
            ...(appState.currentSession?.scalesVisual || {}),
            ...visualPatch,
          },
        },
      });
    },
    onSubmitAnswer: async ({ answerValue, questionId, questionOrder }) => {
      const response = await submitSessionAnswer({
        sessionId: appState.currentSession.sessionId,
        questionId,
        questionOrder,
        answerValue,
      });

      const answers = {
        ...(appState.currentSession.answers || {}),
        [questionId]: answerValue,
      };

      const preview = computePreviewWeights({
        answers,
        currentQuestionId: null,
        includeCurrent: false,
      });

      setAppState({
        currentSession: {
          ...appState.currentSession,
          currentQuestionOrder: response.current_question_order,
          answers,
          scalesVisual: {
            ...(appState.currentSession?.scalesVisual || {}),
            balance: preview.balance,
            scoreFor: preview.scoreFor,
            scoreAgainst: preview.scoreAgainst,
            source: 'question_submit',
          },
        },
      });

      await renderCurrentQuestion();
    },
  });
}

async function handleSubmitTiebreaker({ optionId }) {
  const finalResult = await submitSessionTiebreaker({
    sessionId: appState.currentSession.sessionId,
    optionId,
  });

  const resultWeights = deriveResultWeights(finalResult);

  setAppState({
    currentSession: {
      ...appState.currentSession,
      finalResult,
      scalesVisual: {
        ...(appState.currentSession?.scalesVisual || {}),
        balance: resultWeights.balance,
        scoreFor: resultWeights.scoreFor,
        scoreAgainst: resultWeights.scoreAgainst,
        source: 'tiebreaker_result',
      },
    },
  });

  renderResultScreen(root, {
    sessionId: appState.currentSession.sessionId,
    finalResult,
    previousVisual: appState.currentSession?.scalesVisual || {},
  });
}

boot();
