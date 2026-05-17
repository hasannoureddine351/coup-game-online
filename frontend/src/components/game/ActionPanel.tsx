import { useState } from 'react';
import { useGameData } from '../../hooks/useGameData';
import type { Game, GamePlayer, ActionType } from '../../api/types';
import { toast } from 'sonner';

interface ActionPanelProps {
  game: Game;
  currentPlayer: GamePlayer;
}

const ACTIONS = [
  { type: 'Income',      label: 'INCOME',       description: '+1 coin',                     cost: 0, needsTarget: false, claimedCharacter: null,        color: 'cyan' },
  { type: 'Foreign_Aid', label: 'FOREIGN AID',  description: '+2 coins — blockable by Duke', cost: 0, needsTarget: false, claimedCharacter: null,        color: 'cyan' },
  { type: 'Tax',         label: 'TAX',          description: '+3 coins',                    cost: 0, needsTarget: false, claimedCharacter: 'Duke',       color: 'purple' },
  { type: 'Steal',       label: 'STEAL',        description: 'Take 2 coins from player',    cost: 0, needsTarget: true,  claimedCharacter: 'Captain',    color: 'cyan' },
  { type: 'Assassinate', label: 'ASSASSINATE',  description: 'Kill opponent influence',     cost: 3, needsTarget: true,  claimedCharacter: 'Assassin',   color: 'red' },
  { type: 'Exchange',    label: 'EXCHANGE',     description: 'Swap cards with deck',        cost: 0, needsTarget: false, claimedCharacter: 'Ambassador', color: 'green' },
  { type: 'Coup',        label: 'COUP',         description: 'Force opponent to lose influence', cost: 7, needsTarget: true, claimedCharacter: null,    color: 'red' },
] as const;

const BTN_COLORS: Record<string, string> = {
  cyan:   'btn-cyan',
  red:    'btn-red',
  purple: 'btn-purple',
  green:  'btn-green',
};

const HOVER_BORDER: Record<string, string> = {
  cyan:   'hover:border-neon-cyan',
  red:    'hover:border-neon-red',
  purple: 'hover:border-neon-purple',
  green:  'hover:border-neon-green',
};

const SELECTED_COLORS: Record<string, string> = {
  cyan:   'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_12px_rgba(0,240,255,0.4),4px_4px_0px_#000]',
  red:    'border-neon-red bg-neon-red/20 shadow-[0_0_12px_rgba(255,0,85,0.4),4px_4px_0px_#000]',
  purple: 'border-neon-purple bg-neon-purple/20 shadow-[0_0_12px_rgba(182,0,255,0.4),4px_4px_0px_#000]',
  green:  'border-neon-green bg-neon-green/20 shadow-[0_0_12px_rgba(0,255,65,0.4),4px_4px_0px_#000]',
};

const CLAIM_COLORS: Record<string, string> = {
  Duke:       'text-neon-purple',
  Assassin:   'text-neon-red',
  Captain:    'text-neon-cyan',
  Ambassador: 'text-neon-green',
  Contessa:   'text-neon-pink',
};

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
      <div className="pixel-panel p-5 text-center">
        <p className="font-mono text-white/50 text-sm uppercase tracking-wider">
          Waiting for <span className="text-neon-cyan">{game.turn_phase?.replace('_', ' ')}</span> phase to complete...
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-panel-cyan p-4 md:p-5">
      <h2 className="font-pixel text-neon-cyan text-[10px] glow-cyan tracking-widest mb-1">
        ▸ YOUR TURN — SELECT ACTION
      </h2>
      <p className="font-mono text-white/40 text-[9px] mb-4 uppercase">
        Treasury: <span className="text-neon-yellow glow-yellow">{currentPlayer.coins} coins</span>
        {currentPlayer.coins >= 10 && (
          <span className="text-neon-red glow-red ml-2 animate-blink"> ⚠ MUST COUP</span>
        )}
      </p>

      <div className="pixel-divider mb-4" />

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {ACTIONS.map((action) => {
          const canAfford = action.cost <= currentPlayer.coins;
          const mustCoup = currentPlayer.coins >= 10 && action.type !== 'Coup';
          const disabled = !canAfford || mustCoup;
          const isSelected = selectedAction === action.type;
          const colorKey = action.color;

          return (
            <button
              key={action.type}
              onClick={() => !disabled && setSelectedAction(action.type as ActionType)}
              disabled={disabled}
              className={`relative bg-cyber-panel border-2 p-3 text-left transition-all duration-75 group
                ${isSelected
                  ? SELECTED_COLORS[colorKey]
                  : disabled
                  ? 'border-cyber-border opacity-30 cursor-not-allowed shadow-[2px_2px_0px_#000]'
                  : `border-cyber-border ${HOVER_BORDER[colorKey]} cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-[3px]`
                }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: colorKey === 'red' ? 'var(--neon-red)' :
                                colorKey === 'purple' ? 'var(--neon-purple)' :
                                colorKey === 'green' ? 'var(--neon-green)' :
                                'var(--neon-cyan)',
                  }}
                />
              )}

              <p className={`font-pixel text-[9px] mb-1.5
                ${isSelected
                  ? colorKey === 'red'    ? 'text-neon-red glow-red'
                  : colorKey === 'purple' ? 'text-neon-purple glow-purple'
                  : colorKey === 'green'  ? 'text-neon-green glow-green'
                  : 'text-neon-cyan glow-cyan'
                  : 'text-white/80'
                }`}
              >
                {isSelected ? '▶ ' : ''}{action.label}
              </p>

              <p className="font-mono text-[9px] text-white/50 mb-1">{action.description}</p>

              <div className="flex gap-2 flex-wrap">
                {action.cost > 0 && (
                  <span className="font-mono text-[8px] text-neon-yellow">
                    ◈ {action.cost} coins
                  </span>
                )}
                {action.claimedCharacter && (
                  <span className={`font-mono text-[8px] ${CLAIM_COLORS[action.claimedCharacter] ?? 'text-white/50'}`}>
                    Claims: {action.claimedCharacter}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Target selection */}
      {selectedAction && ACTIONS.find(a => a.type === selectedAction)?.needsTarget && (
        <div className="mb-5">
          <h3 className="font-pixel text-neon-red text-[9px] glow-red tracking-widest mb-3">
            ▸ SELECT TARGET
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableTargets.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`bg-cyber-panel border-2 p-3 text-left transition-all duration-75
                  ${selectedTarget === player.id
                    ? 'border-neon-red bg-neon-red/15 shadow-[0_0_10px_rgba(255,0,85,0.4),4px_4px_0px_#000]'
                    : 'border-cyber-border hover:border-neon-red cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-[3px]'
                  }`}
              >
                <p className="font-pixel text-[9px] text-white mb-1">
                  {selectedTarget === player.id ? '▶ ' : ''}{player.user?.username}
                </p>
                <p className="font-mono text-[9px] text-white/40">
                  {player.coins} coins · {player.cards?.filter(c => !c.is_revealed).length || 0} influence
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmitAction}
        disabled={
          submitAction.isPending ||
          !selectedAction ||
          (ACTIONS.find(a => a.type === selectedAction)?.needsTarget && !selectedTarget)
        }
        className="btn-green w-full py-3 text-[10px] tracking-widest disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
      >
        {submitAction.isPending ? '◈ PROCESSING...' : '▶ EXECUTE ACTION'}
      </button>
    </div>
  );
}
