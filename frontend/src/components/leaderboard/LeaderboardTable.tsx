import React from 'react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../../api/types';

type Props = {
  entries: LeaderboardEntry[];
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  selectedUserId?: number | null;
  onRowClick?: (entry: LeaderboardEntry) => void;
};

export default function LeaderboardTable({
  entries,
  page,
  lastPage,
  onPageChange,
  loading,
  selectedUserId,
  onRowClick,
}: Props) {
  return (
    <motion.div className="pixel-panel-cyan overflow-hidden" style={{ boxShadow: '4px 4px 0px #000' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-neon-cyan/30 bg-black/40">
              {['Rank', 'Player', 'Win Rate', 'Bluff Rate', 'Wins', 'Games'].map((h) => (
                <th key={h} className="px-4 py-3 font-pixel text-[8px] text-neon-cyan/80 tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-mono text-sm text-white/50">
                  Loading rankings...
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-mono text-sm text-white/50">
                  No ranked players yet. Finish a game to appear here.
                </td>
              </tr>
            )}
            {!loading &&
              entries.map((row) => {
                const selected = selectedUserId === row.user_id;
                return (
                <tr
                  key={row.user_id}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={`border-b border-white/5 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-neon-cyan/10' : ''
                  } ${selected ? 'bg-neon-cyan/15 ring-1 ring-inset ring-neon-cyan/40' : 'hover:bg-neon-cyan/5'}`}
                >
                  <td className="px-4 py-3 font-pixel text-xs text-neon-yellow">#{row.rank}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{row.username}</td>
                  <td className="px-4 py-3 font-mono text-sm text-neon-cyan">{row.win_rate}%</td>
                  <td className="px-4 py-3 font-mono text-sm text-neon-purple">{row.bluff_rate}%</td>
                  <td className="px-4 py-3 font-mono text-sm">{row.games_won}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white/50">{row.games_played}</td>
                </tr>
              );
              })}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <motion.div className="flex items-center justify-between px-4 py-3 border-t border-neon-cyan/20">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="btn-cyan text-[10px] disabled:opacity-40"
          >
            PREV
          </button>
          <span className="font-mono text-[10px] text-white/50">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            className="btn-cyan text-[10px] disabled:opacity-40"
          >
            NEXT
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
