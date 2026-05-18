import type { ActionType, Game, GamePoll, GamePlayer } from '../../api/types';

export const POLL_ACTIONS: ActionType[] = [
  'Income',
  'Foreign_Aid',
  'Tax',
  'Assassinate',
  'Steal',
  'Exchange',
  'Coup',
];

export const TARGETED_ACTIONS: ActionType[] = ['Assassinate', 'Steal', 'Coup'];

export function playerLabel(p?: GamePlayer): string {
  return p?.user?.username ?? `Seat ${p?.seat_number ?? '?'}`;
}

export function pollLabel(poll: GamePoll): string {
  const actor = poll.actorPlayer ?? poll.actor_player;
  const target = poll.targetPlayer ?? poll.target_player;
  const actorName = playerLabel(actor);
  const action = poll.action_type.replace('_', ' ');
  if (target) {
    return `${actorName} should ${action} ${playerLabel(target)}`;
  }
  return `${actorName} should ${action}`;
}

export function pollTallies(poll: GamePoll) {
  const votes = poll.votes ?? [];
  const yes = votes.filter((v) => v.vote === 'yes').length;
  const no = votes.filter((v) => v.vote === 'no').length;
  const total = yes + no;
  const pct = total > 0 ? Math.round((yes / total) * 100) : 0;
  return { yes, no, total, pct };
}

export function activePlayers(game: Game): GamePlayer[] {
  return (game.players ?? []).filter((p) => !p.is_eliminated);
}
