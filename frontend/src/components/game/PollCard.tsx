import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GamePoll } from '../../api/types';
import { pollLabel, pollTallies } from './pollUtils';

type Props = {
  poll: GamePoll;
  currentUserId: string;
  onVote: (pollId: number, vote: 'yes' | 'no') => void;
  voting?: boolean;
};

export default function PollCard({ poll, currentUserId, onVote, voting }: Props) {
  const { yes, no, total, pct } = pollTallies(poll);
  const isCreator = String(poll.created_by_user_id) === currentUserId;
  const myVote = poll.votes?.find((v) => String(v.user_id) === currentUserId)?.vote;
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (poll.status !== 'open') return;
    const tick = () => {
      const ms = new Date(poll.closes_at).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [poll.closes_at, poll.status]);

  return (
    <motion.div
      className={`border p-3 space-y-2 ${
        poll.status === 'open' ? 'border-neon-yellow/40 bg-black/40' : 'border-white/10 bg-black/20'
      }`}
    >
      <p className="font-mono text-[10px] text-neon-yellow leading-relaxed">{pollLabel(poll)}</p>
      <p className="font-mono text-[9px] text-white/40">
        by {poll.creator?.username}
        {poll.status === 'open' ? ` · ${secondsLeft}s left` : ' · closed'}
      </p>

      {poll.status === 'open' && !isCreator && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={voting || !!myVote}
            onClick={() => onVote(poll.id, 'yes')}
            className={`flex-1 font-pixel text-[8px] py-1.5 border ${
              myVote === 'yes' ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' : 'border-white/20 hover:border-neon-cyan'
            }`}
          >
            YES
          </button>
          <button
            type="button"
            disabled={voting || !!myVote}
            onClick={() => onVote(poll.id, 'no')}
            className={`flex-1 font-pixel text-[8px] py-1.5 border ${
              myVote === 'no' ? 'border-neon-red bg-neon-red/20 text-neon-red' : 'border-white/20 hover:border-neon-red'
            }`}
          >
            NO
          </button>
        </div>
      )}

      {poll.status === 'closed' && (
        <p className="font-mono text-[10px] text-neon-purple">
          {pct}% yes ({yes}/{total})
          {no > 0 && ` · ${no} no`}
        </p>
      )}

      {poll.status === 'open' && total > 0 && (
        <p className="font-mono text-[9px] text-white/30">
          {yes} yes · {no} no
        </p>
      )}
    </motion.div>
  );
}
