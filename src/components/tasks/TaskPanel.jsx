import { useEffect, useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { endpoints } from '../../lib/api';

function TaskPanel({ tasks, onRunCommand, running }) {
  const [command, setCommand] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({ budgetPreference: 'low', cabPreference: 'Rapido', focusMode: 'none' });
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const speech = useSpeechRecognition();
  const { transcript, clear } = speech;

  useEffect(() => {
    if (transcript) {
      setCommand((prev) => `${prev}${prev ? ' ' : ''}${transcript}`.trim());
      clear();
    }
  }, [clear, transcript]);

  // Load preferences and recommendations on mount
  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        setRecommendationsLoading(true);
        const [prefRes, recRes] = await Promise.all([
          endpoints.getPreferences(),
          endpoints.getRecommendations(),
        ]);
        if (prefRes?.preferences) {
          setPreferences((prev) => ({ ...prev, ...prefRes.preferences }));
        }
        if (recRes?.recommendations) {
          setRecommendations(recRes.recommendations);
        }
      } catch (err) {
        console.error('Failed to load platform data:', err);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchPlatformData();
  }, []);

  const handleRun = async () => {
    if (!command.trim() || running) {
      return;
    }

    const value = command.trim();
    setCommand('');
    await onRunCommand(value);
  };

  const handlePreferenceChange = async (key, value) => {
    try {
      setPreferences((prev) => ({ ...prev, [key]: value }));
      await endpoints.savePreference({ key, value });
    } catch (err) {
      console.error(`Failed to save preference ${key}:`, err);
    }
  };

  const handleRecAction = async (id, status, actionPayload = null) => {
    try {
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      await endpoints.updateRecommendationStatus(id, status);

      if (status === 'accepted' && actionPayload) {
        if (actionPayload.command) {
          await onRunCommand(actionPayload.command);
        }
      }
    } catch (err) {
      console.error(`Failed to update recommendation ${id}:`, err);
    }
  };

  return (
    <aside className="panel flex min-h-0 w-full flex-col p-4 md:w-96 overflow-y-auto">
      <h2 className="text-lg font-semibold">Task Runner</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Run commands directly or use speech recognition.
      </p>

      {/* Input area */}
      <div className="mt-4 space-y-2">
        <textarea
          className="h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2"
          placeholder="Enter command to execute..."
          value={command}
          onChange={(event) => setCommand(event.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={running || !command.trim()}
            className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {running ? 'Running...' : 'Run'}
          </button>
          <button
            type="button"
            onClick={speech.isListening ? speech.stop : speech.start}
            disabled={!speech.supported}
            className={`rounded-lg px-3 py-2 text-sm ${
              speech.isListening ? 'bg-red-500 text-white' : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {speech.isListening ? 'Stop' : 'Voice'}
          </button>
        </div>
      </div>

      {/* Focus Mode Selector */}
      <div className="mt-6 border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Focus Filter Mode</h3>
        <div className="grid grid-cols-4 gap-1">
          {['none', 'focus', 'meeting', 'driving'].map((mode) => (
            <button
              key={mode}
              onClick={() => handlePreferenceChange('focusMode', mode)}
              className={`rounded px-1 py-1.5 text-xs font-medium capitalize border transition ${
                preferences.focusMode === mode
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                  : 'bg-zinc-900 border-zinc-850 text-zinc-450 hover:bg-zinc-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Personalization Options */}
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase text-zinc-500">Travel/Hotel Budget</label>
          <select
            value={preferences.budgetPreference}
            onChange={(e) => handlePreferenceChange('budgetPreference', e.target.value)}
            className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
          >
            <option value="low">Budget-Friendly (Low Cost)</option>
            <option value="premium">Premium / High Rating</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-zinc-500">Preferred Cab Provider</label>
          <select
            value={preferences.cabPreference}
            onChange={(e) => handlePreferenceChange('cabPreference', e.target.value)}
            className="mt-1 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none"
          >
            <option value="Rapido">Rapido (Bikes/Budget Cabs)</option>
            <option value="Uber">Uber (Uber Go/Premier)</option>
            <option value="Ola">Ola Cabs</option>
          </select>
        </div>
      </div>

      {/* AI Recommendation Cards */}
      <div className="mt-6 border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Smart Recommendations</h3>
        {recommendationsLoading ? (
          <p className="text-xs text-zinc-500">Loading recommendations...</p>
        ) : recommendations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
            No recommendations at this time.
          </p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-brand-300">{rec.title}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Score: {Math.round(rec.score * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-zinc-400">{rec.description}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleRecAction(rec.id, 'accepted', rec.action_payload)}
                    className="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRecAction(rec.id, 'dismissed')}
                    className="rounded border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="mt-6 border-t border-zinc-800 pt-4">
        <h3 className="mb-2 text-sm font-medium text-zinc-300">Recent Tasks</h3>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
              No tasks executed yet.
            </p>
          ) : (
            tasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
                <p className="font-medium text-zinc-100">{task.command}</p>
                <p className="mt-1 text-zinc-400">
                  {task.action} -{' '}
                  <span
                    className={`uppercase ${
                      task.status === 'completed'
                        ? 'text-emerald-300'
                        : task.status === 'waiting'
                          ? 'text-amber-300'
                          : task.status === 'failed'
                            ? 'text-red-300'
                            : 'text-zinc-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </p>
                {Array.isArray(task.progress) && task.progress.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-zinc-400">
                    {task.progress.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : null}
                {task.result?.message ? <p className="mt-2 text-zinc-300">{task.result.message}</p> : null}
              </article>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export default TaskPanel;
