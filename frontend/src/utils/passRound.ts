import type { Block, Game, GameAction, GameActionPhasePassRow, PassRound } from '../api/types';

/**
 * Which pass round applies for the current game state (matches GameService::currentPassRound).
 */
export function currentPassRound(
  game: Game,
  action: GameAction,
  block: Block | null | undefined = action.block
): PassRound | null {
  if (game.turn_phase === 'block') {
    return 'block_declaration';
  }

  if (game.turn_phase === 'challenge') {
    if (block && !block.was_challenged) {
      return 'block_claim';
    }
    return 'action_claim';
  }

  return null;
}

/** Non-eliminated player ids who may pass in this round (matches GameService::eligiblePlayerIdsForRound). */
export function eligiblePassPlayerIds(
  game: Game,
  action: GameAction,
  block: Block | null | undefined,
  round: PassRound
): number[] {
  const activePlayerIds =
    game.players?.filter((p) => !p.is_eliminated).map((p) => Number(p.id)) ?? [];

  if (round === 'action_claim') {
    return activePlayerIds.filter((id) => id !== Number(action.player_id));
  }

  if (round === 'block_declaration') {
    if (action.action_type === 'Foreign_Aid') {
      return activePlayerIds.filter((id) => id !== Number(action.player_id));
    }

    if (action.action_type === 'Assassinate' || action.action_type === 'Steal') {
      const tid = action.target_player_id != null ? Number(action.target_player_id) : null;
      if (tid == null) {
        return [];
      }
      return activePlayerIds.includes(tid) ? [tid] : [];
    }

    return [];
  }

  if (round === 'block_claim') {
    const b = block ?? action.block;
    if (!b) {
      return [];
    }
    const bid = Number(b.blocker_id);
    return activePlayerIds.filter((id) => id !== bid);
  }

  return [];
}

export function passesForRound(action: GameAction, round: PassRound | null): GameActionPhasePassRow[] {
  if (round == null) {
    return [];
  }
  const passes = action.phase_passes ?? [];
  return passes.filter((row) => row.pass_round === round);
}

/** Count of recorded passes for this round (one row per eligible player max). */
export function distinctPassCountForRound(action: GameAction, round: PassRound | null): number {
  return passesForRound(action, round).length;
}
