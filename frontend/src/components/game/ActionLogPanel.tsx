import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Game } from "../../api/types";
import {
  buildActionLogParts,
  chronologicalActions,
} from "../../utils/actionLogFormat";

type ActionLogPanelProps = {
  game: Game;
  className?: string;
};

function statusClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-900/40 text-amber-300 border border-amber-700/40";
    case "completed":
      return "bg-emerald-900/35 text-emerald-300 border border-emerald-700/35";
    case "blocked":
      return "bg-red-900/35 text-red-300 border border-red-700/35";
    case "challenged":
      return "bg-violet-900/35 text-violet-300 border border-violet-700/35";
    default:
      return "bg-neutral-800 text-neutral-300 border border-neutral-600";
  }
}

export default function ActionLogPanel({ game, className = "" }: ActionLogPanelProps) {
  /** Desktop: open by default; narrow viewports: collapsed to save vertical space (toggle anytime). */
  const [expanded, setExpanded] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1280px)").matches : true
  );

  const entries = useMemo(() => {
    const actions = chronologicalActions(game.actions);
    return actions.map((a) => buildActionLogParts(a));
  }, [game.actions]);

  const count = entries.length;

  return (
    <section
      className={`rounded-xl border border-neutral-700/80 bg-neutral-900/55 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col ${className}`}
      aria-label="Game action log"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-800/60 md:py-3 min-h-[48px] touch-manipulation"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-white md:text-base">
            Game log
          </span>
          <span className="text-xs text-neutral-500">
            {count === 0 ? "No actions yet" : `${count} event${count === 1 ? "" : "s"}`}
          </span>
        </div>
        <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="border-t border-neutral-700/80 max-h-[min(55vh,28rem)] xl:max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain px-3 pb-3 pt-1">
          {entries.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-neutral-500">
              Actions will appear here as the round unfolds.
            </p>
          ) : (
            <ol className="space-y-3">
              {entries.map((line) => (
                <li
                  key={line.id}
                  className="rounded-lg border border-neutral-700/50 bg-neutral-950/40 px-3 py-2.5 text-sm leading-snug"
                >
                  <p className="text-neutral-200">
                    <span className="font-semibold text-coup-gold">{line.actorName}</span>{" "}
                    <span className="text-neutral-100">{line.verb}</span>
                    {line.claim && (
                      <span className="text-purple-300"> (claims {line.claim})</span>
                    )}
                    {line.targetName && (
                      <span className="text-rose-300"> → {line.targetName}</span>
                    )}
                  </p>
                  {line.challengeSummary && (
                    <p className="mt-1.5 border-l-2 border-amber-500/50 pl-2 text-xs text-amber-100/95">
                      {line.challengeSummary}
                    </p>
                  )}
                  {line.blockSummary && (
                    <p className="mt-1.5 border-l-2 border-sky-500/50 pl-2 text-xs text-sky-200/95">
                      {line.blockSummary}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(
                        line.status
                      )}`}
                    >
                      {line.status}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
