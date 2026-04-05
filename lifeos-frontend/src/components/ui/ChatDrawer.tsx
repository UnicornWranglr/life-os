// ChatDrawer — floating chat button (bottom-right) that opens a slide-in
// assistant panel. Maintains conversation history for the session.

import { useEffect, useRef, useState, useCallback } from 'react';
import { chatApi } from '@/api/chat';
import type { ChatMessage } from '@/api/chat';

// ── Sub-components ─────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-accent text-primary rounded-br-sm'
            : 'bg-surface2 text-primary rounded-bl-sm border border-border'
          }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface2 border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ChatDrawer() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send the history *before* the new message (backend appends it)
      const { reply } = await chatApi.send(text, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-[80px] right-4 z-40 w-12 h-12 rounded-full
                   bg-accent shadow-lg flex items-center justify-center
                   active:opacity-80 transition-opacity"
      >
        {/* Sparkle / chat icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-primary" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.02 2 11c0 2.54 1.1 4.84 2.87 6.49L4 22l4.64-1.55C9.97 20.79 10.97 21 12 21c5.52 0 10-4.02 10-9s-4.48-9-10-9z"/>
        </svg>
      </button>

      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed top-0 right-0 h-full z-50 flex flex-col
                     w-full max-w-app bg-surface border-l border-border
                     animate-slide-in-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-14 pb-3 border-b border-border flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-primary">LifeOS Assistant</p>
              <p className="text-xs text-muted">Ask anything about your goals &amp; progress</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full
                         bg-surface2 border border-border active:opacity-70"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-muted" fill="none"
                strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-1">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-accent-light">
                    <path d="M12 2C6.48 2 2 6.02 2 11c0 2.54 1.1 4.84 2.87 6.49L4 22l4.64-1.55C9.97 20.79 10.97 21 12 21c5.52 0 10-4.02 10-9s-4.48-9-10-9z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-primary">How can I help?</p>
                <p className="text-xs text-muted leading-relaxed">
                  Ask about your goals, rocks, habits, or daily priorities. I know your full LifeOS context.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}

            {loading && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            className="flex-shrink-0 border-t border-border bg-surface px-4 pt-3 pb-4 flex gap-2 items-end"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message your assistant…"
              className="flex-1 bg-surface2 border border-border rounded-2xl px-3.5 py-2.5
                         text-sm text-primary placeholder:text-muted/50 outline-none
                         focus:border-accent transition-colors resize-none leading-relaxed
                         min-h-[42px]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-[42px] h-[42px] flex-shrink-0 rounded-full bg-accent flex items-center
                         justify-center disabled:opacity-30 active:opacity-70 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
