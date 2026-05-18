import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ActionType, GameMessage, GamePoll } from '../types';

export const gameSocialService = {
  getMessages(gameId: number, beforeId?: number) {
    return api.get<{ data: GameMessage[] }>(ENDPOINTS.games.MESSAGES(gameId), {
      params: beforeId ? { before_id: beforeId } : undefined,
    });
  },

  sendMessage(gameId: number, body: string) {
    return api.post<GameMessage>(ENDPOINTS.games.MESSAGES(gameId), { body });
  },

  getPolls(gameId: number) {
    return api.get<{ data: GamePoll[] }>(ENDPOINTS.games.POLLS(gameId));
  },

  createPoll(
    gameId: number,
    payload: { actor_player_id: number; action_type: ActionType; target_player_id?: number | null },
  ) {
    return api.post<GamePoll>(ENDPOINTS.games.POLLS(gameId), payload);
  },

  votePoll(gameId: number, pollId: number, vote: 'yes' | 'no') {
    return api.post<GamePoll>(ENDPOINTS.games.POLL_VOTE(gameId, pollId), { vote });
  },
};
