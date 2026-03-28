import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initEcho, disconnectEcho } from '../lib/echo.ts';
import { gameKeys } from './useGameData.ts';

interface GameWebSocketCallbacks {
  onGameStarted?: (data: any) => void;
  onActionDeclared?: (data: any) => void;
  onChallengeMade?: (data: any) => void;
  onBlockDeclared?: (data: any) => void;
  onGameStateUpdated?: (data: any) => void;
}

export const useGameWebSocket = (gameId: number | null, token: string | null, callbacks?: GameWebSocketCallbacks) => {
  const echoRef = useRef(null as any);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId || !token) {
      return;
    }

    echoRef.current = initEcho(token);

    const channel = echoRef.current.private(`game.${gameId}`);

    channel
      .listen('GameStarted', (event: any) => {
        console.log('GameStarted event:', event);
        queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
        queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
        callbacks?.onGameStarted?.(event);
      })
      .listen('ActionDeclared', (event: any) => {
        console.log('ActionDeclared event:', event);
        queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
        queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
        callbacks?.onActionDeclared?.(event);
      })
      .listen('ChallengeMade', (event: any) => {
        console.log('ChallengeMade event:', event);
        queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
        queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
        callbacks?.onChallengeMade?.(event);
      })
      .listen('BlockDeclared', (event: any) => {
        console.log('BlockDeclared event:', event);
        queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
        queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
        callbacks?.onBlockDeclared?.(event);
      })
      .listen('GameStateUpdated', (event: any) => {
        console.log('GameStateUpdated event:', event);
        queryClient.invalidateQueries({ queryKey: gameKeys.currentGame() });
        queryClient.invalidateQueries({ queryKey: gameKeys.list({ id: gameId }) });
        callbacks?.onGameStateUpdated?.(event);
      });

    return () => {
      channel.stopListening('GameStarted');
      channel.stopListening('ActionDeclared');
      channel.stopListening('ChallengeMade');
      channel.stopListening('BlockDeclared');
      channel.stopListening('GameStateUpdated');
      disconnectEcho(echoRef.current);
      echoRef.current = null;
    };
  }, [gameId, token, queryClient]);

  return echoRef.current;
};
