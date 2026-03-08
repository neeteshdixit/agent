import { AppError } from '../utils/AppError.js';
import { openaiService } from '../services/openai.service.js';
import { agentService } from '../services/agent.service.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { taskRepository } from '../repositories/task.repository.js';

const sessionSummary = (session) => ({
  id: session.id,
  title: session.title,
  updatedAt: session.updatedAt,
  createdAt: session.createdAt,
  messageCount: Number(session.messageCount ?? 0),
});

const deriveTitle = (message) => {
  const clean = message.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}...` : clean;
};

export const listSessions = async (req, res) => {
  const sessions = await chatRepository.listSessionsByUser(req.user.id);
  return res.json({ sessions: sessions.map(sessionSummary) });
};

export const getSession = async (req, res) => {
  const session = await chatRepository.findSessionById({
    sessionId: req.params.sessionId,
    userId: req.user.id,
  });

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  const messages = await chatRepository.listMessages(session.id);
  return res.json({
    session: {
      ...sessionSummary(session),
      messages,
      lastAgentMode: session.lastAgentMode,
    },
  });
};

export const createSession = async (req, res) => {
  const session = await chatRepository.createSession({
    userId: req.user.id,
    title: 'New chat',
  });

  return res.status(201).json({ session: sessionSummary(session) });
};

export const sendMessage = async (req, res) => {
  const { message, sessionId, agentMode } = req.validatedBody;

  let session = null;
  if (sessionId) {
    session = await chatRepository.findSessionById({
      sessionId,
      userId: req.user.id,
    });
    if (!session) {
      throw new AppError('Chat session not found', 404);
    }
  }

  if (!session) {
    session = await chatRepository.createSession({
      userId: req.user.id,
      title: deriveTitle(message),
    });
  }

  await chatRepository.appendMessage({
    sessionId: session.id,
    role: 'user',
    content: message,
  });

  let assistantContent = '';
  let task = null;

  if (agentMode) {
    const agentResult = await agentService.runCommand({ command: message });
    assistantContent = agentResult.assistantMessage;
    task = {
      action: agentResult.interpreted.action,
      args: agentResult.interpreted.args,
      status: agentResult.execution.status,
      progress: agentResult.execution.progress,
      result: agentResult.execution.result,
    };

    await taskRepository.create({
      userId: req.user.id,
      command: message,
      action: agentResult.interpreted.action,
      status: agentResult.execution.status,
      progress: agentResult.execution.progress,
      result: agentResult.execution.result,
    });
  } else {
    const messagesForModel = await chatRepository.listRecentMessagesForModel({
      sessionId: session.id,
      limit: 16,
    });

    assistantContent = await openaiService.generateChatReply({
      messages: messagesForModel,
    });
  }

  await chatRepository.appendMessage({
    sessionId: session.id,
    role: 'assistant',
    content: assistantContent,
    task,
  });

  await chatRepository.updateSession({
    sessionId: session.id,
    title: session.title === 'New chat' ? deriveTitle(message) : undefined,
    lastAgentMode: Boolean(agentMode),
  });

  const messages = await chatRepository.listMessages(session.id);
  return res.json({
    sessionId: session.id,
    reply: assistantContent,
    task,
    messages,
  });
};

export const deleteSession = async (req, res) => {
  const deleted = await chatRepository.deleteSession({
    sessionId: req.params.sessionId,
    userId: req.user.id,
  });

  if (!deleted) {
    throw new AppError('Chat session not found', 404);
  }

  return res.status(204).send();
};
