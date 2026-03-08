import { TaskLog } from '../models/TaskLog.js';
import { agentService } from '../services/agent.service.js';

export const runTask = async (req, res) => {
  const { command } = req.validatedBody;
  const agentResult = await agentService.runCommand({ command });

  const log = await TaskLog.create({
    userId: req.user._id,
    command,
    action: agentResult.interpreted.action,
    status: agentResult.execution.status,
    progress: agentResult.execution.progress,
    result: agentResult.execution.result,
  });

  return res.status(201).json({
    task: {
      id: log._id,
      command: log.command,
      action: log.action,
      status: log.status,
      progress: log.progress,
      result: log.result,
      createdAt: log.createdAt,
    },
  });
};

export const getTaskHistory = async (req, res) => {
  const history = await TaskLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);

  return res.json({
    tasks: history.map((entry) => ({
      id: entry._id,
      command: entry.command,
      action: entry.action,
      status: entry.status,
      progress: entry.progress,
      result: entry.result,
      createdAt: entry.createdAt,
    })),
  });
};
