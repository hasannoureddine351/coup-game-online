import { useGameData } from '../../hooks/useGameData';
import type { Game, GameAction } from '../../api/types';
import { toast } from 'sonner';
import { Play } from 'lucide-react';

interface GameStatusProps {
  game: Game;
  currentAction: GameAction | null;
  isCurrentPlayerTurn: boolean;
}

const PHASE_COLOR: Record<string, string> = {
  action:            'text-neon-cyan glow-cyan',
  challenge:         'text-neon-yellow glow-yellow',
  block:             'text-neon-purple glow-purple',
  challenge_reveal:  'text-neon-red glow-red',
  resolution:        'text-neon-green glow-green',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'text-neon-yellow border-neon-yellow/60',
  completed: 'text-neon-green border-neon-green/60',
  blocked:   'text-neon-red border-neon-red/60',
  challenged:'text-neon-purple border-neon-purple/60',
};

export default function GameStatus({ game, currentAction, isCurrentPlayerTurn }: GameStatusProps) {
  const { resolveAction } = useGameData();

  const handleResolve = () => {
    if (!currentAction) return;
    resolveAction.mutate({ gameId: game.id, actionId: currentAction.id }, {
      onSuccess: () => toast.success('Action resolved!'),
      onError: (error: any) =>
        toast.error(error?.response?.data?.errors?.action?.[0] || error?.message || 'Failed to resolve action')
    });
  };

  const canResolveStatus = currentAction && currentAction.status !== 'completed';

  const exchangeTemp =
    game.exchange_temp_deck_cards ??
    (game as Game & { exchangeTempDeckCards?: Game['exchange_temp_deck_cards'] }).exchangeTempDeckCards ??
    [];

  const ambassadorAwaitingCardChoice =
    currentAction?.action_type === 'Exchange' &&
    currentAction?.status === 'pending' &&
    exchangeTemp.length === 2;

  const showResolveButton =
    game.turn_phase === 'resolution' &&
    canResolveStatus &&
    isCurrentPlayerTurn &&
    !ambassadorAwaitingCardChoice;

  const phaseColorClass = PHASE_COLOR[game.turn_phase ?? ''] ?? 'text-white/70';
  const statusBadgeClass = STATUS_BADGE[currentAction?.status ?? ''] ?? 'text-white/50 border-white/20';

  return (
    <div className="pixel-panel p-4">
      <h2 className="font-pixel text-[9px] text-white/60 tracking-widest mb-4">▸ GAME STATUS</h2>

      <div className="space-y-3">
        {/* Phase display */}
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-white/40 uppercase">Current Phase</span>
          <span className={`font-pixel text-[9px] uppercase ${phaseColorClass}`}>
            {game.turn_phase?.replace('_', ' ') ?? '—'}
          </span>
        </div>

        <div className="pixel-divider" />

        {/* Current action */}
        {currentAction && (
          <div className="bg-cyber-bg border border-cyber-border p-3" style={{ boxShadow: '2px 2px 0px #000' }}>
            <p className="font-mono text-[9px] text-white/40 uppercase mb-2">Active Action</p>
            <p className="font-pixel text-[9px] text-white mb-2">
              <span className="text-neon-yellow">{currentAction.player?.user?.username}</span>
              <span className="text-white/40 mx-1">→</span>
              <span className="text-neon-cyan">{currentAction.action_type.replace('_', ' ')}</span>
            </p>

            {currentAction.claimed_character && (
              <p className="font-mono text-[9px] text-neon-purple mb-1">
                Claims: {currentAction.claimed_character}
              </p>
            )}

            {currentAction.targetPlayer && (
              <p className="font-mono text-[9px] text-neon-red mb-1">
                Target: {currentAction.targetPlayer.user?.username}
              </p>
            )}

            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span
                className={`font-pixel text-[7px] border px-2 py-0.5 ${statusBadgeClass}`}
                style={{ boxShadow: '1px 1px 0px #000' }}
              >
                {currentAction.status?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Ambassador hint */}
        {ambassadorAwaitingCardChoice && isCurrentPlayerTurn && (
          <div className="pixel-panel-yellow p-3">
            <p className="font-mono text-[10px] text-neon-yellow">
              ▸ Ambassador: pick the card(s) you keep in the exchange panel above, then confirm.
            </p>
          </div>
        )}

        {/* Resolve button */}
        {showResolveButton && (
          <button
            onClick={handleResolve}
            disabled={resolveAction.isPending}
            className="btn-green w-full py-3 text-[9px] tracking-widest flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {resolveAction.isPending ? 'PROCESSING...' : 'RESOLVE ACTION'}
          </button>
        )}
      </div>
    </div>
  );
}
