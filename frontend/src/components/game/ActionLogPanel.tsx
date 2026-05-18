import React, { useMemo, useRef, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Game } from "../../api/types";
import {
  buildActionLogParts,
  chronologicalActions,
} from "../../utils/actionLogFormat";

type ActionLogPanelProps = {
  game: Game;
  className?: string;
  embedded?: boolean;
};

function terminalStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "PENDING", color: "text-neon-yellow border-neon-yellow/60" };
    case "completed":
      return { label: "RESOLVED", color: "text-neon-purple border-neon-purple/60" };
    case "blocked":
      return { label: "BLOCKED", color: "text-neon-red border-neon-red/60" };
    case "challenged":
      return { label: "CHALLENGED", color: "text-neon-cyan border-neon-cyan/60" };
    default:
      return { label: status.toUpperCase(), color: "text-white/50 border-white/20" };
  }
}

function padIndex(n: number): string {
  return String(n + 1).padStart(3, '0');
}

function TerminalTrafficDots() {
  return (
    <div className="flex gap-1.5 shrink-0" aria-hidden>
      <span className="w-2.5 h-2.5 bg-neon-red" style={{ boxShadow: '0 0 4px #ff0055' }} />
      <span className="w-2.5 h-2.5 bg-neon-yellow" style={{ boxShadow: '0 0 4px #ffdd00' }} />
      <span className="w-2.5 h-2.5 bg-neon-purple" style={{ boxShadow: '0 0 4px #b600ff' }} />
    </div>
  );
}

function ActionLogList({
  entries,
  scrollRef,
  className,
}: {
  entries: ReturnType<typeof buildActionLogParts>[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  return (
    <div ref={scrollRef} className={className}>
      {entries.length === 0 ? (
        <p className="px-1 py-5 text-center font-mono text-[10px] text-neon-purple/40">
          &gt; Awaiting game events...
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((line, i) => {
            const { label, color } = terminalStatusLabel(line.status);
            return (
              <li
                key={line.id}
                className="border border-neon-purple/15 bg-black/40 px-3 py-2.5"
                style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[9px] text-neon-purple/40 shrink-0">
                    [{padIndex(i)}]
                  </span>
                  <span
                    className={`font-pixel text-[7px] border px-1.5 py-0.5 shrink-0 ${color}`}
                    style={{ boxShadow: '1px 1px 0px #000' }}
                  >
                    {label}
                  </span>
                </div>
                <p className="font-mono text-[10px] leading-relaxed">
                  <span className="text-neon-yellow">{line.actorName}</span>{" "}
                  <span className="text-neon-purple/80">{line.verb}</span>
                  {line.claim && (
                    <span className="text-neon-cyan"> (claims {line.claim})</span>
                  )}
                  {line.targetName && (
                    <span className="text-neon-red"> → {line.targetName}</span>
                  )}
                </p>
                {line.challengeSummary && (
                  <p className="mt-1.5 pl-3 font-mono text-[9px] text-neon-yellow/80 border-l-2 border-neon-yellow/40">
                    &gt; {line.challengeSummary}
                  </p>
                )}
                {line.blockSummary && (
                  <p className="mt-1.5 pl-3 font-mono text-[9px] text-neon-cyan/80 border-l-2 border-neon-cyan/40">
                    &gt; {line.blockSummary}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function ActionLogPanel({ game, className = "", embedded = false }: ActionLogPanelProps) {
  const [expanded, setExpanded] = useState(() =>
    embedded ? true : typeof window !== "undefined" ? window.matchMedia("(min-width: 1280px)").matches : true
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    const actions = chronologicalActions(game.actions);
    return actions.map((a) => buildActionLogParts(a));
  }, [game.actions]);

  const count = entries.length;

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, expanded]);

  const listClassName = embedded
    ? "overflow-y-auto overscroll-contain"
    : "max-h-[min(55vh,28rem)] xl:max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain px-3 pb-3 pt-2";

  if (embedded) {
    return (
      <div className={className} aria-label="Game action log">
        <ActionLogList entries={entries} scrollRef={scrollRef} className={listClassName} />
      </div>
    );
  }

  return (
    <section
      className={`terminal-log overflow-hidden flex flex-col ${className}`}
      aria-label="Game action log"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[48px] touch-manipulation
          bg-neon-purple/5 hover:bg-neon-purple/10 border-b border-neon-purple/30 transition-colors"
      >
        <TerminalTrafficDots />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-pixel text-[9px] text-neon-purple glow-purple tracking-widest">
            ACTIVITY LOG
          </span>
          <span className="font-mono text-[9px] text-neon-purple/50">
            {count === 0 ? "NO EVENTS" : `${count} EVENT${count === 1 ? "" : "S"} LOGGED`}
          </span>
        </div>
        <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-neon-purple/60" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-neon-purple/60" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-2 border-b border-neon-purple/10 bg-black/30">
          <span className="font-mono text-[10px] text-neon-purple/40">
            root@coup-terminal:~$ <span className="animate-blink">_</span>
          </span>
        </div>
      )}

      {expanded && (
        <ActionLogList entries={entries} scrollRef={scrollRef} className={listClassName} />
      )}
    </section>
  );
}
