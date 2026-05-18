import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Game, GameMessage, GamePoll } from '../../api/types';
import ActionLogPanel from './ActionLogPanel';
import GameDiscussionPanel from './GameDiscussionPanel';

type Tab = 'activity' | 'discussion';

type Props = {
  game: Game;
  externalPoll?: GamePoll | null;
  externalMessage?: GameMessage | null;
};

function TerminalTrafficDots() {
  return (
    <div className="flex gap-1.5 shrink-0" aria-hidden>
      <span className="w-2.5 h-2.5 bg-neon-red" style={{ boxShadow: '0 0 4px #ff0055' }} />
      <span className="w-2.5 h-2.5 bg-neon-yellow" style={{ boxShadow: '0 0 4px #ffdd00' }} />
      <span className="w-2.5 h-2.5 bg-neon-purple" style={{ boxShadow: '0 0 4px #b600ff' }} />
    </div>
  );
}

export default function GameSidebarPanel({ game, externalPoll, externalMessage }: Props) {
  const [tab, setTab] = useState<Tab>('activity');
  const [expanded, setExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : true,
  );

  return (
    <section className="terminal-log overflow-hidden flex flex-col" aria-label="Game sidebar">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[48px] touch-manipulation
          bg-neon-purple/5 hover:bg-neon-purple/10 border-b border-neon-purple/30 transition-colors"
      >
        <TerminalTrafficDots />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-pixel text-[9px] text-neon-purple glow-purple tracking-widest">
            GAME SIDEBAR
          </span>
          <span className="font-mono text-[9px] text-neon-purple/50">
            {tab === 'activity' ? 'ACTIVITY LOG' : 'CHAT & POLLS'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-neon-purple/60" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-neon-purple/60" />
        )}
      </button>

      {expanded && (
        <div className="flex border-b border-neon-purple/20">
          {(['activity', 'discussion'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 font-pixel text-[8px] py-2 tracking-wider transition-colors ${
                tab === t
                  ? 'bg-neon-purple/15 text-neon-purple border-b-2 border-neon-purple'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'activity' ? 'ACTIVITY' : 'DISCUSSION'}
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="max-h-[min(55vh,32rem)] xl:max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain p-3">
          {tab === 'activity' ? (
            <ActionLogPanel game={game} embedded className="!border-0 !shadow-none" />
          ) : (
            <GameDiscussionPanel
              game={game}
              externalPoll={externalPoll}
              externalMessage={externalMessage}
            />
          )}
        </div>
      )}
    </section>
  );
}
