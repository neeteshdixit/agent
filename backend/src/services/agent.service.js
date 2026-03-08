import { openaiService } from './openai.service.js';
import { taskExecutorService } from './taskExecutor.service.js';

export const agentService = {
  runCommand: async ({ command }) => {
    const interpreted = await openaiService.interpretTaskCommand({ command });
    const execution = await taskExecutorService.execute({
      action: interpreted.action,
      args: interpreted.args,
      command,
    });

    const assistantMessage =
      execution.status === 'completed'
        ? `Task completed: ${execution.result?.message ?? 'Done.'}`
        : `Task status: ${execution.status}. ${execution.result?.message ?? 'No details available.'}`;

    return {
      interpreted,
      execution,
      assistantMessage,
    };
  },
};
