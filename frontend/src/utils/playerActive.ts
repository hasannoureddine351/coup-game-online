import type { GamePlayer } from '../api/types';

/** Unrevealed, in-play influence cards (matches backend elimination check). */
export function hiddenInfluenceCount(player: GamePlayer): number {
  if (player.cards?.length) {
    return player.cards.filter((c) => !c.is_revealed && !c.is_discarded).length;
  }
  if (player.influence_count != null) {
    return player.influence_count;
  }
  return player.is_eliminated ? 0 : -1;
}

/** Whether this player may challenge, block, or pass in the current phase. */
export function isPlayerActiveInGame(player: GamePlayer): boolean {
  if (player.is_eliminated) {
    return false;
  }
  const hidden = hiddenInfluenceCount(player);
  if (hidden === -1) {
    return true;
  }
  return hidden > 0;
}
