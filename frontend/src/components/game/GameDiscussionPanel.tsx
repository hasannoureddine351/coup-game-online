import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gameSocialService } from '../../api/services/gameSocialService';
import type { Game, GameMessage, GamePoll } from '../../api/types';
import { useAuth } from '../../contexts/auth-context';
import GameChatPanel from './GameChatPanel';
import PollCard from './PollCard';
import PollComposer from './PollComposer';

type Props = {
  game: Game;
  onPollsChange?: () => void;
  externalPoll?: GamePoll | null;
  externalMessage?: GameMessage | null;
};

export default function GameDiscussionPanel({
  game,
  onPollsChange,
  externalPoll,
  externalMessage,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([] as GameMessage[]);
  const [polls, setPolls] = useState([] as GamePoll[]);
  const [sending, setSending] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [votingId, setVotingId] = useState(null as number | null);

  const load = useCallback(() => {
    if (!game.id) return;
    gameSocialService.getMessages(game.id).then((r) => setMessages(r.data));
    gameSocialService.getPolls(game.id).then((r) => setPolls(r.data));
  }, [game.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (externalMessage) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === externalMessage.id)) return prev;
        return [...prev, externalMessage];
      });
    }
  }, [externalMessage]);

  useEffect(() => {
    if (!externalPoll) return;
    setPolls((prev) => {
      const idx = prev.findIndex((p) => p.id === externalPoll.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = externalPoll;
        return next;
      }
      return [externalPoll, ...prev];
    });
  }, [externalPoll]);

  const handleSend = async (body: string) => {
    setSending(true);
    try {
      const msg = await gameSocialService.sendMessage(game.id, body);
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  };

  const handleCreatePoll = async (payload: Parameters<typeof gameSocialService.createPoll>[1]) => {
    setCreatingPoll(true);
    try {
      const poll = await gameSocialService.createPoll(game.id, payload);
      setPolls((prev) => [poll, ...prev]);
      onPollsChange?.();
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVote = async (pollId: number, vote: 'yes' | 'no') => {
    setVotingId(pollId);
    try {
      const updated = await gameSocialService.votePoll(game.id, pollId, vote);
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } finally {
      setVotingId(null);
    }
  };

  const chatDisabled = game.status === 'finished' || game.status === 'cancelled';

  return (
    <motion.div className="space-y-4">
      <GameChatPanel
        messages={messages}
        onSend={handleSend}
        sending={sending}
        disabled={chatDisabled}
      />

      <motion.div className="border-t border-neon-yellow/20 pt-3 space-y-2">
        <p className="font-pixel text-[8px] text-neon-yellow/80 tracking-widest">TABLE POLLS</p>
        <PollComposer game={game} onCreate={handleCreatePoll} creating={creatingPoll} />
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={user?.id ?? ''}
              onVote={handleVote}
              voting={votingId === poll.id}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
