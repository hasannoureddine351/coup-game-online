import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initEcho, disconnectEcho } from '../lib/echo';
import { gameKeys } from './useGameData';

/**
 * Subscribes to the public `lobby` channel and refreshes the games list when a
 * game is created / joined / left / deleted by anyone. Lobby-list viewers are
 * not in any per-game channel, so this is how they stay live.
 */
export const useLobbyWebSocket = (token: string | null) => {
  const echoRef = useRef(null as any);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    echoRef.current = initEcho(token);
    const channel = echoRef.current.channel('lobby');

    channel.listen('LobbyUpdated', () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    });

    return () => {
      try {
        channel.stopListening('LobbyUpdated');
      } catch {
        /* noop */
      }
      try {
        echoRef.current?.leave?.('lobby');
      } catch {
        /* noop */
      }
      disconnectEcho(echoRef.current);
      echoRef.current = null;
    };
  }, [token, queryClient]);

  return echoRef.current;
};
