import React from 'react';
import { X } from 'lucide-react';
import type { LeaderboardEntry } from '../../api/types';

type Props = {
  entry: LeaderboardEntry;
  onClose: () => void;
};

function statVal(stats: LeaderboardEntry['stats'], key: keyof LeaderboardEntry['stats']): number {
  return stats[key] ?? 0;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="border border-neon-cyan/20 bg-black/40 px-3 py-2.5"
      style={{ boxShadow: '2px 2px 0px #000' }}
    >
      <p className="font-pixel text-[7px] text-neon-cyan/60 tracking-wider uppercase mb-1">{label}</p>
      <p className="font-mono text-sm text-white">{value}</p>
      {sub && <p className="font-mono text-[9px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-pixel text-[8px] text-neon-purple/80 tracking-widest mb-2 uppercase">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

export default function LeaderboardPlayerDetail({ entry, onClose }: Props) {
  const s = entry.stats;
  const bluffAttempts = statVal(s, 'successful_bluffs') + statVal(s, 'failed_bluffs');
  const challengeAttempts = statVal(s, 'correct_challenges') + statVal(s, 'incorrect_challenges');
  const pollsPerGame =
    entry.games_played > 0 ? (statVal(s, 'polls_created') / entry.games_played).toFixed(1) : '—';

  return (
    <div
      className="mt-6 pixel-panel-cyan border-2 border-neon-cyan/40 overflow-hidden"
      style={{ boxShadow: '4px 4px 0px #000' }}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-neon-cyan/30 bg-neon-cyan/5">
        <div>
          <p className="font-pixel text-[9px] text-neon-cyan/60 tracking-widest">OPERATOR DOSSIER</p>
          <h2 className="font-pixel text-sm text-neon-cyan glow-cyan mt-1">
            #{entry.rank} {entry.username}
          </h2>
          <p className="font-mono text-[10px] text-white/50 mt-1">
            {entry.games_won} wins · {entry.games_played} games · {entry.win_rate}% win rate
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 border border-neon-cyan/30 text-neon-cyan/70 hover:text-neon-cyan hover:border-neon-cyan transition-colors"
          aria-label="Close dossier"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        <Section title="Bluff & reveal">
          <StatCard label="Successful bluffs" value={statVal(s, 'successful_bluffs')} />
          <StatCard label="Failed bluffs" value={statVal(s, 'failed_bluffs')} />
          <StatCard
            label="Strategic sacrifices"
            value={statVal(s, 'misleading_reveals')}
            sub="Had the role, revealed another card"
          />
          <StatCard label="Bluff rate" value={`${entry.bluff_rate}%`} sub={`${bluffAttempts} attempts`} />
        </Section>

        <Section title="Challenges">
          <StatCard label="Correct" value={statVal(s, 'correct_challenges')} />
          <StatCard label="Incorrect" value={statVal(s, 'incorrect_challenges')} />
          <StatCard
            label="Accuracy"
            value={`${entry.challenge_accuracy}%`}
            sub={`${challengeAttempts} total`}
          />
          <StatCard label="Allied challenges made" value={statVal(s, 'allied_challenges_made')} sub="Challenged for others" />
          <StatCard label="Allied help received" value={statVal(s, 'allied_challenges_received')} />
        </Section>

        <Section title="Table politics">
          <StatCard label="Polls started" value={statVal(s, 'polls_created')} sub={`${pollsPerGame} per game`} />
          <StatCard label="Incitement polls" value={statVal(s, 'incitement_polls_created')} sub="Urged others to act" />
          <StatCard
            label="Poll agreement"
            value={`${entry.poll_agreement_rate}%`}
            sub={
              statVal(s, 'poll_votes_received') > 0
                ? `${statVal(s, 'poll_yes_votes_received')} yes / ${statVal(s, 'poll_votes_received')} votes`
                : 'No votes yet'
            }
          />
        </Section>
      </div>
    </div>
  );
}
