import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gameService } from "../api/services/gameService.ts";
import type { Game, CurrentGame, ActionType, CharacterType } from "../api/types.ts";

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

  const useCurrentGameQuery = (options?: {
    refetchInterval?: number | false | ((query: { state: { data: unknown } }) => number | false);
  }) => {
    return useQuery({
      queryKey: gameKeys.currentGame(),
      queryFn: async () => {
        const data = await gameService.currentGame();
        return data;
      },
      refetchInterval:
        options?.refetchInterval !== undefined
          ? options.refetchInterval
          : (query) => {
              const d = query.state.data as Game | CurrentGame | null | undefined;
              return d?.status === "finished" ? false : 2000;
            },
    });
  };

  const createGame = useMutation({
    mutationFn: () => gameService.create(),
    onSuccess: (game) => {
      queryClient.setQueryData<CurrentGame | null>(gameKeys.currentGame(), {
        ...game,
        host: true,
      } as CurrentGame);
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const joinGame = useMutation({
    mutationFn: (gameId: number) => gameService.join(gameId),
    onSuccess: (game) => {
      queryClient.setQueryData<CurrentGame | null>(gameKeys.currentGame(), {
        ...(game as CurrentGame),
        host: false,
      } as CurrentGame);
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

  const toggleReady = useMutation({
    mutationFn: (gameId: number) => gameService.toggleReady(gameId),
    onSuccess: (game) => {
      queryClient.setQueryData<CurrentGame | null>(gameKeys.currentGame(), (prev) => {
        if (prev && prev.id === game.id) {
          return { ...game, host: prev.host } as CurrentGame;
        }
        return game as CurrentGame;
      });
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const startGame = useMutation({
    mutationFn: (gameId: number) => gameService.start(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const submitAction = useMutation({
    mutationFn: ({ gameId, actionData }: { gameId: number; actionData: { action_type: ActionType; target_player_id?: number; claimed_character?: CharacterType } }) =>
      gameService.submitAction(gameId, actionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const submitChallenge = useMutation({
    mutationFn: ({ gameId, actionId }: { gameId: number; actionId: number }) =>
      gameService.submitChallenge(gameId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const submitBlock = useMutation({
    mutationFn: ({ gameId, actionId, claimedCharacter }: { gameId: number; actionId: number; claimedCharacter: CharacterType }) =>
      gameService.submitBlock(gameId, actionId, claimedCharacter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const submitBlockChallenge = useMutation({
    mutationFn: ({ gameId, actionId }: { gameId: number; actionId: number }) =>
      gameService.submitBlockChallenge(gameId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const resolveAction = useMutation({
    mutationFn: ({ gameId, actionId }: { gameId: number; actionId: number }) =>
      gameService.resolveAction(gameId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const passPhase = useMutation({
    mutationFn: (gameId: number) => gameService.passPhase(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const chooseCardToLose = useMutation({
    mutationFn: ({ gameId, cardId }: { gameId: number; cardId: number }) =>
      gameService.chooseCardToLose(gameId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });

  const finalizeExchange = useMutation({
    mutationFn: ({
      gameId,
      keep_hand_card_ids,
      keep_deck_card_ids,
    }: {
      gameId: number;
      keep_hand_card_ids: number[];
      keep_deck_card_ids: number[];
    }) => gameService.finalizeExchange(gameId, { keep_hand_card_ids, keep_deck_card_ids }),
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
    toggleReady,
    startGame,
    submitAction,
    submitChallenge,
    submitBlock,
    submitBlockChallenge,
    resolveAction,
    passPhase,
    chooseCardToLose,
    finalizeExchange,
  };
};
