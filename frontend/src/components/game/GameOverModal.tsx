import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

type GameOverModalProps = {
  open: boolean;
  winnerName: string;
  isCurrentUserWinner: boolean;
  onContinue: () => void;
  isDeleting?: boolean;
};

export default function GameOverModal({
  open,
  winnerName,
  isCurrentUserWinner,
  onContinue,
  isDeleting = false,
}: GameOverModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className="max-w-md w-full rounded-2xl border-2 border-coup-gold/50 bg-gradient-to-b from-coup-dark to-coup-darker shadow-2xl p-8 text-center"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
          >
            <Trophy
              className="w-16 h-16 mx-auto text-coup-gold mb-4"
              aria-hidden
            />
            <h2
              id="game-over-title"
              className="text-2xl font-bold text-light mb-2 font-gothic tracking-wide"
            >
              Game over
            </h2>
            <p className="text-xl text-coup-gold font-semibold mb-2">
              {winnerName} wins
            </p>
            {isCurrentUserWinner ? (
              <p className="text-emerald-400 text-sm mb-6">You won this round.</p>
            ) : (
              <p className="text-light/60 text-sm mb-6">Better luck next time.</p>
            )}
            <button
              type="button"
              onClick={onContinue}
              disabled={isDeleting}
              className="w-full rounded-lg bg-coup-gold text-coup-darker font-bold py-3 px-4 hover:bg-coup-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Returning to lobby…" : "Back to lobby"}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
