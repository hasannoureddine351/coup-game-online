import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGameWebSocket } from '../hooks/useGameWebSocket';
import { useGameData, gameKeys } from '../hooks/useGameData';
import GameBoard from '../components/game/GameBoard';
import GameOverModal from '../components/game/GameOverModal';
import ActionPanel from '../components/game/ActionPanel';
import PlayerHand from '../components/game/PlayerHand';
import ChallengeBlockPanel from '../components/game/ChallengeBlockPanel';
import AmbassadorExchangePanel from '../components/game/AmbassadorExchangePanel';
import GameStatus from '../components/game/GameStatus';
import GameSidebarPanel from '../components/game/GameSidebarPanel';
import ChallengeRevealPanel from '../components/game/ChallengeRevealPanel';
import { toast } from 'sonner';
import type { Game, GameAction, DeckCard, GameMessage, GamePoll } from '../api/types';
import { useAuth } from '../contexts/auth-context';

/** Laravel may expose relation as snake_case or camelCase on WebSocket payloads. */
function getExchangeTempDeckCards(game: Game): DeckCard[] {
  const g = game as Game & { exchangeTempDeckCards?: DeckCard[] };
  return game.exchange_temp_deck_cards ?? g.exchangeTempDeckCards ?? [];
}

export default function GamePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { useCurrentGameQuery, deleteGame } = useGameData();
  const { data: currentGame, isLoading } = useCurrentGameQuery();
  
  const [localGame, setLocalGame] = useState(null as Game | null);
  const [latestAction, setLatestAction] = useState(null as GameAction | null);
  const [liveMessage, setLiveMessage] = useState(null as GameMessage | null);
  const [livePoll, setLivePoll] = useState(null as GamePoll | null);

  useEffect(() => {
    if (currentGame && currentGame.id) {
      const game = currentGame as Game;
      setLocalGame(game);
      if (game.actions && game.actions.length > 0) {
        setLatestAction(game.actions[0]);
      }
    }
  }, [currentGame]);

  /** If the query cache updates to finished before local state (e.g. WebSocket + refetch ordering), keep them aligned. */
  useEffect(() => {
    if (currentGame?.status === 'finished' && currentGame.id && localGame?.id === currentGame.id && localGame.status !== 'finished') {
      setLocalGame(currentGame as Game);
    }
  }, [currentGame, localGame?.id, localGame?.status]);

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
      if (event.message && event.game?.status !== 'finished') {
        toast.info(event.message);
      }
      setLocalGame(event.game);
      syncLatestAction(event.game);
    },
    onGameMessageSent: (event) => {
      if (event?.message) setLiveMessage(event.message);
    },
    onGamePollCreated: (event) => {
      if (event?.poll) setLivePoll(event.poll);
    },
    onGamePollUpdated: (event) => {
      if (event?.poll) setLivePoll(event.poll);
    },
    onGamePollClosed: (event) => {
      if (event?.poll) setLivePoll(event.poll);
    },
  });

  useEffect(() => {
    if (isLoading) return;
    // Stay on this screen while we still have a finished game in local state (e.g. opponent already deleted it).
    if (!currentGame && !localGame) {
      navigate('/lobby', { replace: true });
      return;
    }
    /** Server has no current game (e.g. deleted) but client still shows finished — return everyone to lobby. */
    if (!currentGame && localGame?.status === 'finished') {
      navigate('/lobby', { replace: true });
      return;
    }
    if (!currentGame && localGame?.status !== 'finished') {
      navigate('/lobby', { replace: true });
    }
  }, [currentGame, isLoading, localGame, navigate]);

  if (isLoading || !localGame) {
    return (
      <div className="crt-wrapper min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="pixel-spinner mx-auto" />
          <p className="font-pixel text-neon-cyan text-xs glow-cyan animate-blink">LOADING GAME...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = localGame.players?.find(
    (p) => String(p.user_id) === String(user?.id),
  );
  const isCurrentTurn = Number(localGame.current_turn_player_id) === Number(currentPlayer?.id);
  const exchangeTempDeck = getExchangeTempDeckCards(localGame);
  const isWaiting = localGame.status === 'waiting';
  const isInProgress = localGame.status === 'in_progress';
  const isFinished = localGame.status === 'finished';
  const winnerPlayer = localGame.players?.find((p) => !p.is_eliminated);
  const winnerName = winnerPlayer?.user?.username ?? 'Unknown';
  const isCurrentUserWinner =
    !!winnerPlayer &&
    !!user &&
    String(winnerPlayer.user_id) === String(user.id);

  const handleDismissGameOver = () => {
    if (!localGame?.id) {
      navigate('/lobby', { replace: true });
      return;
    }
    deleteGame.mutate(localGame.id, {
      onSuccess: () => navigate('/lobby', { replace: true }),
      onError: () => {
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
        navigate('/lobby', { replace: true });
      },
    });
  };

  return (
    <div className="crt-wrapper min-h-screen bg-cyber-bg text-white p-3 md:p-6">
      <GameOverModal
        open={isFinished}
        winnerName={winnerName}
        isCurrentUserWinner={isCurrentUserWinner}
        onContinue={handleDismissGameOver}
        isDeleting={deleteGame.isPending}
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            {isWaiting && (
              <div className="pixel-panel-cyan p-6 text-center">
                <h2 className="font-pixel text-neon-cyan text-sm glow-cyan mb-3">WAITING FOR PLAYERS</h2>
                <p className="font-mono text-white/60 text-sm">All players must be ready before the game can begin.</p>
              </div>
            )}

            <GameBoard game={localGame} currentUserId={user?.id ?? ''} />

            {isInProgress && currentPlayer && latestAction && (
              <ChallengeRevealPanel
                game={localGame}
                currentPlayer={currentPlayer}
                latestAction={latestAction}
              />
            )}

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

          <aside className="w-full shrink-0 xl:w-[min(100%,24rem)] xl:sticky xl:top-4 xl:self-start xl:max-h-none">
            <GameSidebarPanel
              game={localGame}
              externalMessage={liveMessage}
              externalPoll={livePoll}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
