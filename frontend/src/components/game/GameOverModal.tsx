import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type GameOverModalProps = {
  open: boolean;
  winnerName: string;
  isCurrentUserWinner: boolean;
  onContinue: () => void;
  isDeleting?: boolean;
};

/** Pixel role glyphs — same set as CharacterCard / PlayerCard */
const GAME_OVER_ROLE = {
  win: {
    symbol: "♛",
    name: "Duke",
    border: "border-neon-purple",
    bg: "bg-neon-purple/10",
    text: "text-neon-purple",
    glow: "glow-purple",
  },
  lose: {
    symbol: "✝",
    name: "Assassin",
    border: "border-neon-red",
    bg: "bg-neon-red/10",
    text: "text-neon-red",
    glow: "glow-red",
  },
} as const;

function GameOverRoleIcon({ variant }: { variant: "win" | "lose" }) {
  const role = GAME_OVER_ROLE[variant];
  return (
    <div
      className={`mx-auto mb-4 flex flex-col items-center justify-center w-24 h-28 border-2 ${role.border} ${role.bg}`}
      style={{ boxShadow: "4px 4px 0px #000" }}
      aria-hidden
    >
      <span className={`text-4xl leading-none ${role.text} ${role.glow}`}>{role.symbol}</span>
      <span className={`font-pixel text-[8px] mt-2 tracking-wide ${role.text}`}>
        {role.name.toUpperCase()}
      </span>
    </div>
  );
}

export default function GameOverModal({
  open,
  winnerName,
  isCurrentUserWinner,
  onContinue,
  isDeleting = false,
}: GameOverModalProps) {
  const accent = isCurrentUserWinner ? "var(--neon-cyan)" : "var(--neon-red)";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className="max-w-md w-full bg-cyber-panel border-4 p-8 text-center relative overflow-hidden"
            style={{
              borderColor: accent,
              boxShadow: isCurrentUserWinner
                ? "8px 8px 0px #000, 0 0 40px rgba(0,240,255,0.25)"
                : "8px 8px 0px #000, 0 0 40px rgba(255,0,85,0.25)",
            }}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)",
              }}
            />

            <CornerBracket position="tl" color={accent} />
            <CornerBracket position="tr" color={accent} />
            <CornerBracket position="bl" color={accent} />
            <CornerBracket position="br" color={accent} />

            <GameOverRoleIcon variant={isCurrentUserWinner ? "win" : "lose"} />

            <h2
              id="game-over-title"
              className="font-pixel text-sm mb-2 tracking-widest"
              style={{
                color: accent,
                textShadow: isCurrentUserWinner
                  ? "0 0 8px var(--neon-cyan), 0 0 16px rgba(0,240,255,0.5)"
                  : "0 0 8px var(--neon-red), 0 0 16px rgba(255,0,85,0.5)",
              }}
            >
              GAME OVER
            </h2>

            <p
              className="font-pixel text-[10px] mb-1"
              style={{ color: "var(--neon-yellow)", textShadow: "0 0 8px var(--neon-yellow)" }}
            >
              {winnerName.toUpperCase()} WINS
            </p>

            {isCurrentUserWinner ? (
              <p className="font-mono text-[10px] text-neon-cyan glow-cyan mt-3 mb-6">
                ▶ MISSION COMPLETE — VICTORY ACHIEVED
              </p>
            ) : (
              <p className="font-mono text-[10px] text-white/50 mt-3 mb-6">
                &gt; Better luck next round, operator.
              </p>
            )}

            <div className="pixel-divider mb-6" />

            <button
              type="button"
              onClick={onContinue}
              disabled={isDeleting}
              className={
                isCurrentUserWinner
                  ? "btn-cyan w-full py-3 text-[9px] tracking-widest"
                  : "btn-red w-full py-3 text-[9px] tracking-widest"
              }
            >
              {isDeleting ? "RETURNING TO BASE..." : "RETURN TO LOBBY"}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CornerBracket({
  position,
  color,
}: {
  position: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const base = "absolute w-4 h-4";
  const styles: Record<typeof position, string> = {
    tl: `${base} top-1 left-1 border-t-2 border-l-2`,
    tr: `${base} top-1 right-1 border-t-2 border-r-2`,
    bl: `${base} bottom-1 left-1 border-b-2 border-l-2`,
    br: `${base} bottom-1 right-1 border-b-2 border-r-2`,
  };
  return <div className={styles[position]} style={{ borderColor: color }} />;
}
