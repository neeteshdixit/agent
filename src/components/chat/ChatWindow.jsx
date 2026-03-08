import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

function ChatWindow({ messages, onSendMessage, loading, agentMode, onToggleAgentMode }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const speech = useSpeechRecognition();
  const { transcript, clear } = speech;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (transcript) {
      setInput((prev) => `${prev}${prev ? ' ' : ''}${transcript}`.trim());
      clear();
    }
  }, [clear, transcript]);

  const submitMessage = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const value = input.trim();
    setInput('');
    await onSendMessage(value);
  };

  return (
    <section className="panel flex min-h-0 flex-1 flex-col p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Assistant Chat</h2>
          <p className="text-xs text-zinc-400">Conversation history is saved per session.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">
          <span>Agent Mode</span>
          <button
            type="button"
            onClick={onToggleAgentMode}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
              agentMode ? 'bg-brand-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                agentMode ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
            Start a conversation. When Agent Mode is enabled, executable commands will run automatically.
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id ?? `${message.role}-${message.createdAt ?? message.content}`} message={message} />
          ))
        )}
        {loading ? (
          <div className="text-sm text-zinc-400">
            Assistant is thinking...
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <footer className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-2">
          <textarea
            className="min-h-24 flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Type a message or command..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                speech.isListening ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              onClick={speech.isListening ? speech.stop : speech.start}
              disabled={!speech.supported}
            >
              {speech.isListening ? 'Stop' : 'Voice'}
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              onClick={submitMessage}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
        {!speech.supported ? <p className="text-xs text-zinc-500">Web Speech API is not supported in this browser.</p> : null}
        {speech.error ? <p className="text-xs text-red-400">{speech.error}</p> : null}
      </footer>
    </section>
  );
}

export default ChatWindow;
