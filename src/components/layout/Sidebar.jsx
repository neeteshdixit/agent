function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  user,
  onLogout,
}) {
  return (
    <aside className="panel flex w-full flex-col p-4 md:w-72">
      <div className="mb-4 border-b border-zinc-800 pb-4">
        <h1 className="text-lg font-semibold text-zinc-100">AI Assistant</h1>
        <p className="mt-1 text-xs text-zinc-400">{user?.email}</p>
      </div>

      <button
        type="button"
        onClick={onCreateSession}
        className="mb-3 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        + New Chat
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-500">
            No conversation yet.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group rounded-lg border p-2 text-sm transition ${
                activeSessionId === session.id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <button
                type="button"
                className="w-full truncate text-left text-zinc-200"
                onClick={() => onSelectSession(session.id)}
                title={session.title}
              >
                {session.title}
              </button>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{new Date(session.updatedAt).toLocaleString()}</span>
                <button
                  type="button"
                  className="opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  onClick={() => onDeleteSession(session.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
