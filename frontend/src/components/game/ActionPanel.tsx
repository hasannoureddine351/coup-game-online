import { useState } from 'react';
import { useGameData } from '../../hooks/useGameData.ts';
import type { Game, GamePlayer, ActionType, CharacterType } from '../../api/types.ts';
import { toast } from 'sonner';

interface ActionPanelProps {
  game: Game;
  currentPlayer: GamePlayer;
}

const ACTIONS = [
  { type: 'Income', label: 'Income', description: '+1 coin', cost: 0, needsTarget: false, claimedCharacter: null },
  { type: 'Foreign_Aid', label: 'Foreign Aid', description: '+2 coins (blockable by Duke)', cost: 0, needsTarget: false, claimedCharacter: null },
  { type: 'Tax', label: 'Tax', description: '+3 coins', cost: 0, needsTarget: false, claimedCharacter: 'Duke' },
  { type: 'Steal', label: 'Steal', description: 'Take 2 coins from player', cost: 0, needsTarget: true, claimedCharacter: 'Captain' },
  { type: 'Assassinate', label: 'Assassinate', description: 'Kill opponent influence', cost: 3, needsTarget: true, claimedCharacter: 'Assassin' },
  { type: 'Exchange', label: 'Exchange', description: 'Swap cards with deck', cost: 0, needsTarget: false, claimedCharacter: 'Ambassador' },
  { type: 'Coup', label: 'Coup', description: 'Force opponent to lose influence', cost: 7, needsTarget: true, claimedCharacter: null },
] as const;

export default function ActionPanel({ game, currentPlayer }: ActionPanelProps) {
  const { submitAction } = useGameData();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);

  const availableTargets = game.players?.filter(
    p => p.id !== currentPlayer.id && !p.is_eliminated
  ) || [];

  const handleSubmitAction = () => {
    if (!selectedAction) {
      toast.error('Please select an action');
      return;
    }

    const action = ACTIONS.find(a => a.type === selectedAction);
    if (!action) return;

    if (action.needsTarget && !selectedTarget) {
      toast.error('Please select a target player');
      return;
    }

    if (action.cost > currentPlayer.coins) {
      toast.error(`Not enough coins. Need ${action.cost}, have ${currentPlayer.coins}`);
      return;
    }

    submitAction.mutate({
      gameId: game.id,
      actionData: {
        action_type: selectedAction,
        target_player_id: selectedTarget ?? undefined,
        claimed_character: action.claimedCharacter ?? undefined,
      }
    }, {
      onSuccess: () => {
        toast.success('Action submitted!');
        setSelectedAction(null);
        setSelectedTarget(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.errors?.action?.[0] || 'Failed to submit action');
      }
    });
  };

  if (game.turn_phase !== 'action') {
    return (
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 text-center">
        <p className="text-neutral-400">
          Waiting for {game.turn_phase} phase to complete...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Your Turn - Choose an Action</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ACTIONS.map((action) => {
          const canAfford = action.cost <= currentPlayer.coins;
          const mustCoup = currentPlayer.coins >= 10 && action.type !== 'Coup';
          const disabled = !canAfford || mustCoup;

          return (
            <button
              key={action.type}
              onClick={() => setSelectedAction(action.type as ActionType)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedAction === action.type
                  ? 'bg-emerald-900/30 border-emerald-600'
                  : disabled
                  ? 'bg-neutral-900/30 border-neutral-700 opacity-40 cursor-not-allowed'
                  : 'bg-neutral-900/50 border-neutral-700 hover:border-emerald-600'
              }`}
            >
              <p className="font-bold">{action.label}</p>
              <p className="text-sm text-neutral-400 mb-1">{action.description}</p>
              {action.cost > 0 && (
                <p className="text-xs text-yellow-400">Cost: {action.cost} coins</p>
              )}
              {action.claimedCharacter && (
                <p className="text-xs text-purple-400">Claims: {action.claimedCharacter}</p>
              )}
            </button>
          );
        })}
      </div>

      {selectedAction && ACTIONS.find(a => a.type === selectedAction)?.needsTarget && (
        <div className="mb-6">
          <h3 className="font-bold mb-3">Select Target Player</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableTargets.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedTarget === player.id
                    ? 'bg-red-900/30 border-red-600'
                    : 'bg-neutral-900/50 border-neutral-700 hover:border-red-600'
                }`}
              >
                <p className="font-bold">{player.user?.username}</p>
                <p className="text-sm text-neutral-400">
                  {player.coins} coins · {player.cards?.filter(c => !c.is_revealed).length || 0} influence
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmitAction}
        disabled={!selectedAction || (ACTIONS.find(a => a.type === selectedAction)?.needsTarget && !selectedTarget)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        Submit Action
      </button>

      {currentPlayer.coins >= 10 && (
        <p className="text-yellow-400 text-sm mt-3 text-center">
          You must Coup when you have 10 or more coins!
        </p>
      )}
    </div>
  );
}
