import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { LeaderboardResponse } from '../types';

export const leaderboardService = {
  getLeaderboard(page = 1, perPage = 20) {
    return api.get<LeaderboardResponse>(ENDPOINTS.leaderboard.LIST, {
      params: { page, per_page: perPage, min_games: 0 },
    });
  },
};
