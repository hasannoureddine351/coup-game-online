import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameWebSocket } from '../hooks/useGameWebSocket.ts';
import { useGameData } from '../hooks/useGameData.ts';
import GameBoard from '../components/game/GameBoard.tsx';
import ActionPanel from '../components/game/ActionPanel.tsx';
import PlayerHand from '../components/game/PlayerHand.tsx';
import ChallengeBlockPanel from '../components/game/ChallengeBlockPanel.tsx';
import AmbassadorExchangePanel from '../components/game/AmbassadorExchangePanel.tsx';
import GameStatus from '../components/game/GameStatus.tsx';
import { toast } from 'sonner';
import type { Game, GamePlayer, GameAction, DeckCard } from '../api/types.ts';
import { useAuth } from '../contexts/auth-context.tsx';

/** Laravel may expose relation as snake_case or camelCase on WebSocket payloads. */
function getExchangeTempDeckCards(game: Game): DeckCard[] {
  const g = game as Game & { exchangeTempDeckCards?: DeckCard[] };
  return game.exchange_temp_deck_cards ?? g.exchangeTempDeckCards ?? [];
}

export default function GamePage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { useCurrentGameQuery } = useGameData();
  const { data: currentGame, isLoading } = useCurrentGameQuery({ refetchInterval: 2000 });
  
  const [localGame, setLocalGame] = useState(null as Game | null);
  const [latestAction, setLatestAction] = useState(null as GameAction | null);

  useEffect(() => {
    if (currentGame && currentGame.id) {
      const game = currentGame as Game;
      setLocalGame(game);
      if (game.actions && game.actions.length > 0) {
        setLatestAction(game.actions[0]);
      }
    }
  }, [currentGame]);

  const syncLatestAction = (game: Game | null) => {
    if (game?.actions && game.actions.length > 0) {
      setLatestAction(game.actions[0]);
    }
  };

  useGameWebSocket(localGame?.id ?? null, token, {
    onGameStarted: (event) => {
      toast.success(event.message);
      setLocalGame(event.game);
      syncLatestAction(event.game);
    },
    onActionDeclared: (event) => {
      toast.info(event.message);
      const gameFromEvent = event.action?.game ?? event.game;
      setLocalGame((prev) => {
        if (!gameFromEvent) return prev;
        const hasPlayers = gameFromEvent.players && gameFromEvent.players.length > 0;
        if (hasPlayers) return gameFromEvent;
        if (prev) {
          return { ...prev, turn_phase: gameFromEvent.turn_phase, current_turn_player_id: gameFromEvent.current_turn_player_id };
        }
        return prev;
      });
      if (event.action) setLatestAction(event.action);
      else if (gameFromEvent?.actions?.length) setLatestAction(gameFromEvent.actions[0]);
    },
    onChallengeMade: (event) => {
      toast.warning(event.message);
      // Do not mutate localGame here — GameStateUpdated follows with full game; shallow copy kept stale turn_phase.
    },
    onBlockDeclared: (event) => {
      toast.info(event.message);
      // Same: wait for GameStateUpdated; avoid stale localGame.
    },
    onGameStateUpdated: (event) => {
      if (event.message) {
        toast.info(event.message);
      }
      setLocalGame(event.game);
      syncLatestAction(event.game);
    },
  });

  useEffect(() => {
    if (!isLoading && !currentGame) {
      navigate('/lobby');
    }
  }, [currentGame, isLoading, navigate]);

  if (isLoading || !localGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = localGame.players?.find(p => p.user_id === user?.id || p.user_id?.toString() === user?.id?.toString());
  const isCurrentTurn = Number(localGame.current_turn_player_id) === Number(currentPlayer?.id);
  const exchangeTempDeck = getExchangeTempDeckCards(localGame);
  const isWaiting = localGame.status === 'waiting';
  const isInProgress = localGame.status === 'in_progress';
  const isFinished = localGame.status === 'finished';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {isWaiting && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Waiting for game to start...</h2>
            <p className="text-neutral-400">All players must be ready before the game can begin.</p>
          </div>
        )}

        {isFinished && (
          <div className="bg-emerald-900/30 border border-emerald-600 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
            <p className="text-neutral-300">
              Winner: {localGame.players?.find(p => !p.is_eliminated)?.user?.username ?? 'Unknown'}
            </p>
          </div>
        )}

        <GameBoard game={localGame} currentUserId={user?.id ?? ''} />

        {isInProgress && currentPlayer && (
          <>
            {latestAction?.action_type === 'Exchange' &&
              latestAction.status === 'pending' &&
              exchangeTempDeck.length === 2 &&
              Number(currentPlayer.id) === Number(latestAction.player_id) && (
                <AmbassadorExchangePanel
                  game={{ ...localGame, exchange_temp_deck_cards: exchangeTempDeck }}
                  currentPlayer={currentPlayer}
                />
              )}

            <PlayerHand player={currentPlayer} />

            {isCurrentTurn && (localGame.turn_phase === 'action' || String(localGame.turn_phase).trim() === 'action') && (
              <ActionPanel
                game={localGame}
                currentPlayer={currentPlayer}
              />
            )}

            {(localGame.turn_phase === 'challenge' || localGame.turn_phase === 'block') && latestAction?.status === 'pending' && (
              <ChallengeBlockPanel
                game={localGame}
                currentPlayer={currentPlayer}
                currentAction={latestAction}
              />
            )}

            <GameStatus 
              game={localGame}
              currentAction={latestAction}
              isCurrentPlayerTurn={isCurrentTurn}
            />
          </>
        )}
      </div>
    </div>
  );
}
