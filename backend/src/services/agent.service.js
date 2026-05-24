import { aiInferenceService } from './aiInference.service.js';
import { taskExecutorService } from './taskExecutor.service.js';
import { taskFeedbackService } from './taskFeedback.service.js';
import { agentRuntime } from './orchestration/agentRuntime.js';
import { memoryEngine } from './memory/memoryEngine.js';

export const agentService = {
  runCommand: async ({ userId, command }) => {
    const retryState = await taskFeedbackService.checkRetryWindow({ userId, command });
    if (!retryState.canRetry) {
      const waitingExecution = taskFeedbackService.buildWaitingExecution({
        retryAfter: retryState.retryAfter,
      });

      await taskFeedbackService.logWaitingState({
        userId,
        command,
        normalizedCommand: retryState.normalizedCommand,
        action: retryState.latest?.action ?? '',
        parameters: retryState.latest?.parameters ?? {},
        retryAfter: retryState.retryAfter,
        attempts: retryState.attempts,
      });

      return {
        interpreted: {
          action: retryState.latest?.action ?? 'chat_only',
          args: retryState.latest?.parameters ?? {},
          source: 'retry_scheduler',
          route: retryState.latest?.action ? 'local' : 'chat',
        },
        execution: waitingExecution,
        assistantMessage: waitingExecution.result?.message ?? 'This task can be retried in 1 hour.',
      };
    }

    const attemptNumber =
      retryState.canRetry
        ? retryState.attempts
        : Math.max(1, Number(retryState.attempts ?? 1) + 1);

    let interpreted = {
      action: 'chat_only',
      args: {},
      source: 'langchain_gemini',
      route: 'chat',
      confidence: 1.0,
      correctedCommand: command,
    };

    let execution = {
      status: 'completed',
      progress: ['Parsed instruction', 'Agent Orchestration', 'Task completed'],
      result: { message: '' }
    };

    try {
      const preferences = await memoryEngine.getUserPreferences(userId);
      const agentResult = await agentRuntime.executeCommand({
        userId,
        command,
        userContext: preferences,
      });

      execution.result.message = agentResult.output;

      if (agentResult.intermediateSteps && agentResult.intermediateSteps.length > 0) {
        const lastStep = agentResult.intermediateSteps[agentResult.intermediateSteps.length - 1];
        const toolName = lastStep.action.tool;
        const toolInput = lastStep.action.toolInput;
        const observation = lastStep.observation;

        interpreted.action = toolName;
        interpreted.args = toolInput;
        interpreted.route = (toolName === 'app_launcher') ? 'local' : 'browser';

        try {
          const parsedObs = JSON.parse(observation);
          execution.status = parsedObs.status === 'success' || parsedObs.status === 'completed' ? 'completed' : 'failed';
          execution.result = { ...parsedObs, message: agentResult.output };
        } catch {
          execution.status = 'completed';
          execution.result = { observation, message: agentResult.output };
        }
      }

      await memoryEngine.logRlFeedback({
        userId,
        command,
        correctedCommand: command,
        stateVector: preferences,
        selectedAction: interpreted.action,
        reward: execution.status === 'completed' ? 1.0 : -1.0,
        source: 'langchain',
      });

    } catch (langchainError) {
      console.warn('LangChain agent failed, falling back to local ML model:', langchainError.message);
      
      interpreted = await aiInferenceService.interpretTaskCommand({ userId, command });
      execution = await taskExecutorService.execute({
        action: interpreted.action,
        args: interpreted.args,
        command,
      });
    }

    const feedback = await taskFeedbackService.processExecutionFeedback({
      userId,
      command,
      normalizedCommand: retryState.normalizedCommand,
      interpreted,
      execution,
      attempts: attemptNumber,
    });

    return {
      interpreted,
      execution: feedback.execution,
      assistantMessage: feedback.assistantMessage,
    };
  },
};
