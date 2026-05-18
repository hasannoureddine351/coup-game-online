import React, { useMemo, useState } from 'react';
import type { ActionType, Game } from '../../api/types';
import { activePlayers, POLL_ACTIONS, TARGETED_ACTIONS } from './pollUtils';

type Props = {
  game: Game;
  onCreate: (payload: {
    actor_player_id: number;
    action_type: ActionType;
    target_player_id?: number;
  }) => void;
  creating?: boolean;
};

export default function PollComposer({ game, onCreate, creating }: Props) {
  const players = activePlayers(game);
  const [actorId, setActorId] = useState(players[0]?.id ?? 0);
  const [action, setAction] = useState<ActionType>('Steal');
  const [targetId, setTargetId] = useState<number | ''>('');

  const needsTarget = TARGETED_ACTIONS.includes(action);

  const targetOptions = useMemo(
    () => players.filter((p) => p.id !== actorId),
    [players, actorId],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId) return;
    onCreate({
      actor_player_id: actorId,
      action_type: action,
      target_player_id: needsTarget && targetId ? Number(targetId) : undefined,
    });
  };

  if (game.status !== 'in_progress') {
    return (
      <p className="font-mono text-[9px] text-white/40 py-2">Polls available during active games.</p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-neon-yellow/20 p-2 bg-black/30">
      <p className="font-pixel text-[8px] text-neon-yellow/80">TABLE POLL</p>
      <select
        value={actorId}
        onChange={(e) => setActorId(Number(e.target.value))}
        className="w-full bg-black border border-white/20 font-mono text-[10px] p-1.5"
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.user?.username ?? `Player ${p.seat_number}`}
          </option>
        ))}
      </select>
      <select
        value={action}
        onChange={(e) => setAction(e.target.value as ActionType)}
        className="w-full bg-black border border-white/20 font-mono text-[10px] p-1.5"
      >
        {POLL_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a.replace('_', ' ')}
          </option>
        ))}
      </select>
      {needsTarget && (
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : '')}
          className="w-full bg-black border border-white/20 font-mono text-[10px] p-1.5"
          required
        >
          <option value="">Target...</option>
          {targetOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.user?.username ?? `Player ${p.seat_number}`}
            </option>
          ))}
        </select>
      )}
      <button type="submit" disabled={creating} className="btn-yellow w-full text-[8px]">
        {creating ? 'CREATING...' : 'START POLL (60s)'}
      </button>
    </form>
  );
}
