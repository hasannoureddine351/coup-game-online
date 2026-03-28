import { api } from "../client.ts";
import { ENDPOINTS } from "../endpoints.ts";
import type { Game, CurrentGame, GameAction, Challenge, Block } from "../types.ts";

export const gameService = {
  list(params?: { status?: string; id?: number }) {
    const queryParams = params?.id != null
      ? { id: params.id }
      : (params ?? { status: "waiting" });
    return api.get<Game | Game[]>(ENDPOINTS.games.LIST, {
      params: queryParams,
    });
  },

  create() {
    return api.post<Game>(ENDPOINTS.games.CREATE, {});
  },

  join(gameId: number) {
    return api.post<Game>(ENDPOINTS.games.JOIN(gameId), {});
  },

  delete(gameId: number) {
    return api.delete<Game>(ENDPOINTS.games.DELETE(gameId));
  },

  currentGame() {
    return api.get<CurrentGame>(ENDPOINTS.games.CURRENT_GAME, {});
  },

  leave(gameId: number) {
    return api.delete<Game>(ENDPOINTS.games.LEAVE(gameId));
  },

  toggleReady(gameId: number) {
    return api.post<Game>(ENDPOINTS.games.READY(gameId), {});
  },

  start(gameId: number) {
    return api.post<Game>(ENDPOINTS.games.START(gameId), {});
  },

  submitAction(gameId: number, actionData: {
    action_type: string;
    target_player_id?: number;
    claimed_character?: string;
  }) {
    return api.post<GameAction>(ENDPOINTS.games.SUBMIT_ACTION(gameId), actionData);
  },

  submitChallenge(gameId: number, actionId: number) {
    return api.post<Challenge>(ENDPOINTS.games.CHALLENGE(gameId, actionId), {});
  },

  submitBlock(gameId: number, actionId: number, claimedCharacter: string) {
    return api.post<Block>(ENDPOINTS.games.BLOCK(gameId, actionId), {
      claimed_character: claimedCharacter
    });
  },

  submitBlockChallenge(gameId: number, actionId: number) {
    return api.post<Challenge>(ENDPOINTS.games.BLOCK_CHALLENGE(gameId, actionId), {});
  },

  resolveAction(gameId: number, actionId: number) {
    return api.post(ENDPOINTS.games.RESOLVE(gameId, actionId), {});
  },

  passPhase(gameId: number) {
    return api.post(ENDPOINTS.games.PASS(gameId), {});
  },

  chooseCardToLose(gameId: number, cardId: number) {
    return api.post(ENDPOINTS.games.CHOOSE_CARD(gameId), { card_id: cardId });
  },

  finalizeExchange(
    gameId: number,
    body: { keep_hand_card_ids: number[]; keep_deck_card_ids: number[] }
  ) {
    return api.post(ENDPOINTS.games.EXCHANGE_FINALIZE(gameId), body);
  },
};
