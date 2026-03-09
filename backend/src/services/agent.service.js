import { openaiService } from './openai.service.js';
import { taskExecutorService } from './taskExecutor.service.js';
import { taskFeedbackService } from './taskFeedback.service.js';

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

    const learned = await taskFeedbackService.resolveLearnedCommand({ userId, command });
    const interpreted = learned ?? (await openaiService.interpretTaskCommand({ command }));

    const execution = await taskExecutorService.execute({
      action: interpreted.action,
      args: interpreted.args,
      command,
    });

    const feedback = await taskFeedbackService.processExecutionFeedback({
      userId,
      command,
      normalizedCommand: retryState.normalizedCommand,
      interpreted,
      execution,
      attempts: retryState.attempts,
    });

    return {
      interpreted,
      execution: feedback.execution,
      assistantMessage: feedback.assistantMessage,
    };
  },
};
