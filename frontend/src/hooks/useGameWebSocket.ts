import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { initEcho, disconnectEcho } from '../lib/echo';
import { gameKeys } from './useGameData';
import type { CurrentGame, Game, GameMessage, GamePoll } from '../api/types';

interface GameWebSocketCallbacks {
  onGameStarted?: (data: any) => void;
  onActionDeclared?: (data: any) => void;
  onChallengeMade?: (data: any) => void;
  onBlockDeclared?: (data: any) => void;
  onGameStateUpdated?: (data: any) => void;
  onGameMessageSent?: (data: { message: GameMessage }) => void;
  onGamePollCreated?: (data: { poll: GamePoll }) => void;
  onGamePollUpdated?: (data: { poll: GamePoll }) => void;
  onGamePollClosed?: (data: { poll: GamePoll }) => void;
}

function mergeGameIntoCurrentGameCache(queryClient: QueryClient, incoming: Game): void {
  queryClient.setQueryData<CurrentGame | null>(gameKeys.currentGame(), (prev) => ({
    ...(incoming as CurrentGame),
    host: prev && prev.id === incoming.id ? prev.host : ((incoming as CurrentGame).host ?? false),
  }));
}

export const useGameWebSocket = (gameId: number | null, token: string | null, callbacks?: GameWebSocketCallbacks) => {
  const echoRef = useRef(null as any);
  const queryClient = useQueryClient();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!gameId || !token) {
      return;
    }

    echoRef.current = initEcho(token);

    const channel = echoRef.current.private(`game.${gameId}`);

    const invalidateGameQueries = () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
      queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
    };

    const invalidateLobbyListOnly = () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
    };

    channel
      .listen('GameStarted', (event: any) => {
        invalidateGameQueries();
        callbacksRef.current?.onGameStarted?.(event);
      })
      .listen('ActionDeclared', (event: any) => {
        invalidateGameQueries();
        callbacksRef.current?.onActionDeclared?.(event);
      })
      .listen('ChallengeMade', (event: any) => {
        invalidateGameQueries();
        callbacksRef.current?.onChallengeMade?.(event);
      })
      .listen('BlockDeclared', (event: any) => {
        invalidateGameQueries();
        callbacksRef.current?.onBlockDeclared?.(event);
      })
      .listen('GameStateUpdated', (event: any) => {
        if (event?.game) {
          mergeGameIntoCurrentGameCache(queryClient, event.game as Game);
          invalidateLobbyListOnly();
        } else {
          invalidateGameQueries();
        }
        callbacksRef.current?.onGameStateUpdated?.(event);
      })
      .listen('GameMessageSent', (event: any) => {
        callbacksRef.current?.onGameMessageSent?.(event);
      })
      .listen('GamePollCreated', (event: any) => {
        callbacksRef.current?.onGamePollCreated?.(event);
      })
      .listen('GamePollUpdated', (event: any) => {
        callbacksRef.current?.onGamePollUpdated?.(event);
      })
      .listen('GamePollClosed', (event: any) => {
        callbacksRef.current?.onGamePollClosed?.(event);
      });

    return () => {
      channel.stopListening('GameStarted');
      channel.stopListening('ActionDeclared');
      channel.stopListening('ChallengeMade');
      channel.stopListening('BlockDeclared');
      channel.stopListening('GameStateUpdated');
      channel.stopListening('GameMessageSent');
      channel.stopListening('GamePollCreated');
      channel.stopListening('GamePollUpdated');
      channel.stopListening('GamePollClosed');
      disconnectEcho(echoRef.current);
      echoRef.current = null;
    };
  }, [gameId, token, queryClient]);

  return echoRef.current;
};
