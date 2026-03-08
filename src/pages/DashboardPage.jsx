import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import TaskPanel from '../components/tasks/TaskPanel';
import { useAuth } from '../context/AuthContext';
import { endpoints } from '../lib/api';

function DashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agentMode, setAgentMode] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [taskRunning, setTaskRunning] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');

  const refreshSessions = useCallback(async () => {
    const response = await endpoints.listSessions(token);
    setSessions(response.sessions);
    return response.sessions;
  }, [token]);

  const loadSession = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setMessages([]);
        setActiveSessionId('');
        return;
      }

      const response = await endpoints.getSession(sessionId, token);
      setMessages(response.session.messages);
      setActiveSessionId(sessionId);
      setAgentMode(Boolean(response.session.lastAgentMode));
    },
    [token],
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setInitializing(true);
        setError('');

        const [sessionList, taskHistory] = await Promise.all([
          refreshSessions(),
          endpoints.taskHistory(token),
        ]);

        if (!mounted) {
          return;
        }

        setTasks(taskHistory.tasks);

        if (sessionList.length > 0) {
          await loadSession(sessionList[0].id);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [token, refreshSessions, loadSession]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCreateSession = async () => {
    try {
      setError('');
      const response = await endpoints.createSession(token);
      const newSession = response.session;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setError('');
      await endpoints.deleteSession(sessionId, token);
      const updated = sessions.filter((session) => session.id !== sessionId);
      setSessions(updated);

      if (sessionId === activeSessionId) {
        if (updated.length > 0) {
          await loadSession(updated[0].id);
        } else {
          setActiveSessionId('');
          setMessages([]);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleSendMessage = async (message) => {
    const optimistic = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, optimistic]);
    setChatLoading(true);

    try {
      setError('');
      const response = await endpoints.sendMessage(
        {
          sessionId: activeSessionId || undefined,
          message,
          agentMode,
        },
        token,
      );

      setMessages(response.messages);
      const updatedSessions = await refreshSessions();
      if (!activeSessionId && response.sessionId) {
        setActiveSessionId(response.sessionId);
      }

      if (response.task) {
        setTasks((prev) => [
          {
            id: `chat-task-${Date.now()}`,
            command: message,
            action: response.task.action,
            status: response.task.status,
            progress: response.task.progress,
            result: response.task.result,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      if (!activeSessionId && updatedSessions.length > 0) {
        setSessions(updatedSessions);
      }
    } catch (requestError) {
      setError(requestError.message);
      setMessages((prev) => prev.filter((item) => item._id !== optimistic._id));
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunTask = async (command) => {
    setTaskRunning(true);
    try {
      setError('');
      const response = await endpoints.runTask({ command }, token);
      setTasks((prev) => [response.task, ...prev]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTaskRunning(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col gap-3 bg-zinc-950 p-3 md:flex-row">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={loadSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={chatLoading}
          agentMode={agentMode}
          onToggleAgentMode={() => setAgentMode((prev) => !prev)}
        />
        <TaskPanel tasks={tasks} onRunCommand={handleRunTask} running={taskRunning} />
      </div>

      {error ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-xl -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default DashboardPage;
