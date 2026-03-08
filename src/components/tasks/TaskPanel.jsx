import { useEffect, useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

function TaskPanel({ tasks, onRunCommand, running }) {
  const [command, setCommand] = useState('');
  const speech = useSpeechRecognition();

  useEffect(() => {
    if (speech.transcript) {
      setCommand((prev) => `${prev}${prev ? ' ' : ''}${speech.transcript}`.trim());
      speech.clear();
    }
  }, [speech.clear, speech.transcript]);

  const handleRun = async () => {
    if (!command.trim() || running) {
      return;
    }

    const value = command.trim();
    setCommand('');
    await onRunCommand(value);
  };

  return (
    <aside className="panel flex min-h-0 w-full flex-col p-4 md:w-96">
      <h2 className="text-lg font-semibold">Task Runner</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Run commands directly. Examples: Open WhatsApp, Create a document, Write mail: Hello team.
      </p>

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
        {speech.error ? <p className="text-xs text-red-400">{speech.error}</p> : null}
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <h3 className="mb-2 text-sm font-medium text-zinc-300">Recent Tasks</h3>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-500">
              No tasks executed yet.
            </p>
          ) : (
            tasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
                <p className="font-medium text-zinc-100">{task.command}</p>
                <p className="mt-1 text-zinc-400">
                  {task.action} • <span className="uppercase">{task.status}</span>
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
