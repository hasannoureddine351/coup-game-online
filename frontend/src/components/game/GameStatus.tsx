import { useGameData } from '../../hooks/useGameData';
import type { Game, GameAction } from '../../api/types';
import { toast } from 'sonner';
import { Play } from 'lucide-react';

interface GameStatusProps {
  game: Game;
  currentAction: GameAction | null;
  isCurrentPlayerTurn: boolean;
}

export default function GameStatus({ game, currentAction, isCurrentPlayerTurn }: GameStatusProps) {
  const { resolveAction } = useGameData();

  const handleResolve = () => {
    if (!currentAction) return;

    resolveAction.mutate({
      gameId: game.id,
      actionId: currentAction.id
    }, {
      onSuccess: () => toast.success('Action resolved!'),
      onError: (error: any) =>
        toast.error(error?.response?.data?.errors?.action?.[0] || error?.message || 'Failed to resolve action')
    });
  };

  // Backend resolveAction handles: pending (apply effect), challenged/blocked (advance turn only).
  const canResolveStatus =
    currentAction &&
    currentAction.status !== 'completed';

  const exchangeTemp =
    game.exchange_temp_deck_cards ??
    (game as Game & { exchangeTempDeckCards?: Game['exchange_temp_deck_cards'] }).exchangeTempDeckCards ??
    [];

  /** After first Resolve, deck draws exist; player must finalize via /exchange/finalize — not Resolve again. */
  const ambassadorAwaitingCardChoice =
    currentAction?.action_type === 'Exchange' &&
    currentAction?.status === 'pending' &&
    exchangeTemp.length === 2;

  const showResolveButton =
    game.turn_phase === 'resolution' &&
    canResolveStatus &&
    isCurrentPlayerTurn &&
    !ambassadorAwaitingCardChoice;

  return (
    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Game Status</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">Phase:</span>
          <span className="font-bold text-emerald-400 capitalize">{game.turn_phase?.replace('_', ' ')}</span>
        </div>

        {currentAction && (
          <div className="bg-neutral-900/50 border border-neutral-600 rounded-lg p-4">
            <p className="text-sm text-neutral-400 mb-1">Current Action</p>
            <p className="font-bold mb-2">
              {currentAction.player?.user?.username} → {currentAction.action_type}
            </p>
            
            {currentAction.claimed_character && (
              <p className="text-sm text-purple-400">Claims: {currentAction.claimed_character}</p>
            )}
            
            {currentAction.targetPlayer && (
              <p className="text-sm text-red-400">Target: {currentAction.targetPlayer.user?.username}</p>
            )}

            <div className="mt-2 pt-2 border-t border-neutral-700">
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                currentAction.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                currentAction.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                currentAction.status === 'blocked' ? 'bg-red-900/30 text-red-400' :
                'bg-neutral-700 text-neutral-300'
              }`}>
                {currentAction.status}
              </span>
            </div>
          </div>
        )}

        {ambassadorAwaitingCardChoice && isCurrentPlayerTurn && (
          <p className="text-sm text-amber-200 bg-amber-950/40 border border-amber-700/50 rounded-lg px-3 py-2">
            Ambassador: pick the card(s) you keep (same number as your influence) in the exchange panel above, then
            confirm.
          </p>
        )}

        {showResolveButton && (
          <button
            onClick={handleResolve}
            disabled={resolveAction.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Resolve Action
          </button>
        )}
      </div>
    </div>
  );
}
