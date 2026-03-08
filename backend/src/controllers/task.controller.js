import { agentService } from '../services/agent.service.js';
import { taskRepository } from '../repositories/task.repository.js';

export const runTask = async (req, res) => {
  const { command } = req.validatedBody;
  const agentResult = await agentService.runCommand({ command });

  const log = await taskRepository.create({
    userId: req.user.id,
    command,
    action: agentResult.interpreted.action,
    status: agentResult.execution.status,
    progress: agentResult.execution.progress,
    result: agentResult.execution.result,
  });

  return res.status(201).json({ task: log });
};

export const getTaskHistory = async (req, res) => {
  const tasks = await taskRepository.listByUser({
    userId: req.user.id,
    limit: 30,
  });

  return res.json({ tasks });
};
