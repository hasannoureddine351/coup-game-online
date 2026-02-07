  import { api } from "../client.ts";
  import { ENDPOINTS } from "../endpoints.ts";
  import type { Game, CurrentGame } from "../types.ts";

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
  };
