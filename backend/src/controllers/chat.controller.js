import { ChatSession } from '../models/ChatSession.js';
import { TaskLog } from '../models/TaskLog.js';
import { AppError } from '../utils/AppError.js';
import { openaiService } from '../services/openai.service.js';
import { agentService } from '../services/agent.service.js';

const sessionSummary = (session) => ({
  id: session._id,
  title: session.title,
  updatedAt: session.updatedAt,
  createdAt: session.createdAt,
  messageCount: session.messages.length,
});

const deriveTitle = (message) => {
  const clean = message.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}...` : clean;
};

export const listSessions = async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(50);

  return res.json({
    sessions: sessions.map(sessionSummary),
  });
};

export const getSession = async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user._id,
  });

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  return res.json({
    session: {
      ...sessionSummary(session),
      messages: session.messages,
      lastAgentMode: session.lastAgentMode,
    },
  });
};

export const createSession = async (req, res) => {
  const session = await ChatSession.create({
    userId: req.user._id,
    title: 'New chat',
    messages: [],
  });

  return res.status(201).json({ session: sessionSummary(session) });
};

export const sendMessage = async (req, res) => {
  const { message, sessionId, agentMode } = req.validatedBody;

  let session = null;
  if (sessionId) {
    session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      throw new AppError('Chat session not found', 404);
    }
  }

  if (!session) {
    session = await ChatSession.create({
      userId: req.user._id,
      title: deriveTitle(message),
      messages: [],
    });
  }

  session.messages.push({
    role: 'user',
    content: message,
  });
  session.lastAgentMode = Boolean(agentMode);

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

    await TaskLog.create({
      userId: req.user._id,
      command: message,
      action: agentResult.interpreted.action,
      status: agentResult.execution.status,
      progress: agentResult.execution.progress,
      result: agentResult.execution.result,
    });
  } else {
    const messagesForModel = session.messages.slice(-16).map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: entry.content,
    }));

    assistantContent = await openaiService.generateChatReply({
      messages: messagesForModel,
    });
  }

  session.messages.push({
    role: 'assistant',
    content: assistantContent,
    task,
  });

  if (session.title === 'New chat') {
    session.title = deriveTitle(message);
  }

  await session.save();

  return res.json({
    sessionId: session._id,
    reply: assistantContent,
    task,
    messages: session.messages,
  });
};

export const deleteSession = async (req, res) => {
  const result = await ChatSession.deleteOne({ _id: req.params.sessionId, userId: req.user._id });
  if (result.deletedCount === 0) {
    throw new AppError('Chat session not found', 404);
  }

  return res.status(204).send();
};
