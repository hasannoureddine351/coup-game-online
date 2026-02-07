import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gameService } from "../api/services/gameService.ts";
import type { Game, CurrentGame } from "../api/types.ts";

export const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "list"] as const,
  list: (params: { status?: string; id?: number }) =>
    [...gameKeys.lists(), params] as const,
  currentGame: () => [...gameKeys.all, "currentGame"] as const,
};

export const useGameData = () => {
  const queryClient = useQueryClient();

  const useGameListQuery = (
    params: { status?: string; id?: number; enabled?: boolean } = { status: "waiting" }
  ) => {
    const { enabled = true, ...queryParams } = params;
    return useQuery({
      queryKey: gameKeys.list(queryParams),
      queryFn: () => gameService.list(queryParams),
      refetchInterval: queryParams?.id != null ? 2000 : false,
      enabled,
    });
  };

  const useCurrentGameQuery = (options?: { refetchInterval?: number }) => {
    return useQuery({
      queryKey: gameKeys.currentGame(),
      queryFn: async () => {
          const data = await gameService.currentGame();
        return data as CurrentGame | null;
      },
      refetchInterval: options?.refetchInterval,
    });
  };

  const createGame = useMutation({
    mutationFn: () => gameService.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const joinGame = useMutation({
    mutationFn: (gameId: number) => gameService.join(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const leaveGame = useMutation({
    mutationFn: (gameId: number) => gameService.leave(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const deleteGame = useMutation({
    mutationFn: (gameId: number) => gameService.delete(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  return {
    useGameListQuery,
    useCurrentGameQuery,
    createGame,
    joinGame,
    leaveGame,
    deleteGame,
  };
};
