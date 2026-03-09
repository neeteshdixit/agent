function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const taskStatus = String(message.task?.status ?? '').toLowerCase();
  const statusClass =
    taskStatus === 'completed'
      ? 'text-emerald-300'
      : taskStatus === 'waiting'
        ? 'text-amber-300'
        : taskStatus === 'failed'
          ? 'text-red-300'
          : 'text-zinc-100';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-500 text-white'
            : 'border border-zinc-700 bg-zinc-800/80 text-zinc-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.task ? (
          <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900/70 p-3 text-xs text-zinc-300">
            <p className={`font-semibold ${statusClass}`}>
              Action: {message.task.action} ({message.task.status})
            </p>
            {Array.isArray(message.task.progress) && message.task.progress.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {message.task.progress.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}
            {message.task.result?.message ? <p className="mt-2">{message.task.result.message}</p> : null}
            {message.task.result?.retryAfter ? (
              <p className="mt-2 text-amber-300">
                Retry after: {new Date(message.task.result.retryAfter).toLocaleString()}
              </p>
            ) : null}
            {message.task.result?.suggestion?.action ? (
              <p className="mt-2 text-sky-300">
                Suggested fallback: {message.task.result.suggestion.action}
              </p>
            ) : null}
            {message.task.result?.learning?.datasetUpdated ? (
              <p className="mt-2 text-emerald-300">
                Learned from this command for future runs.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MessageBubble;
