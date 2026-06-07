import React, { useEffect, useRef, useState } from 'react';
import type { GameMessage } from '../../api/types';

type Props = {
  messages: GameMessage[];
  onSend: (body: string) => void;
  sending?: boolean;
  disabled?: boolean;
};

export default function GameChatPanel({ messages, onSend, sending, disabled }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col min-h-[12rem] max-h-[20rem]">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
        {messages.length === 0 && (
          <p className="font-mono text-[9px] text-white/30 text-center py-4">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-[10px] font-mono">
            <span className="text-neon-cyan">{m.user?.username}: </span>
            <span className="text-white/80">{m.body}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || sending}
          placeholder="Message table..."
          maxLength={1000}
          className="flex-1 bg-black/50 border border-neon-cyan/30 px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-neon-cyan"
        />
        <button type="submit" disabled={disabled || sending} className="btn-cyan text-[8px] px-2">
          SEND
        </button>
      </form>
    </div>
  );
}
