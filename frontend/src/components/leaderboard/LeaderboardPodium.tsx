import React from 'react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../../api/types';

type Props = {
  topThree: LeaderboardEntry[];
};

const PODIUM_ORDER = [1, 0, 2];

export default function LeaderboardPodium({ topThree }: Props) {
  if (topThree.length === 0) return null;

  const slots = PODIUM_ORDER.map((idx) => topThree[idx]).filter(Boolean);

  return (
    <motion.div className="grid grid-cols-3 gap-3 items-end mb-10 max-w-3xl mx-auto">
      {slots.map((entry, visualIdx) => {
        const isFirst = entry.rank === 1;
        const height = isFirst ? 'h-36' : visualIdx === 0 ? 'h-28' : 'h-24';
        const border =
          entry.rank === 1
            ? 'border-neon-yellow text-neon-yellow'
            : entry.rank === 2
              ? 'border-neon-cyan text-neon-cyan'
              : 'border-neon-purple text-neon-purple';

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center ${isFirst ? 'order-2' : visualIdx === 0 ? 'order-1' : 'order-3'}`}
          >
            <motion.div
              className={`w-full pixel-panel ${border} p-4 text-center ${height} flex flex-col justify-end`}
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              <span className="font-pixel text-[10px] mb-1">#{entry.rank}</span>
              <p className="font-pixel text-xs truncate w-full">{entry.username}</p>
              <p className="font-mono text-[10px] mt-2 opacity-80">{entry.win_rate}% WR</p>
              <p className="font-mono text-[9px] opacity-60">{entry.games_won} wins</p>
            </motion.div>
            <span className="font-pixel text-[8px] mt-2 text-white/40 tracking-widest">
              {entry.rank === 1 ? 'CHAMPION' : entry.rank === 2 ? 'RUNNER-UP' : 'THIRD'}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
