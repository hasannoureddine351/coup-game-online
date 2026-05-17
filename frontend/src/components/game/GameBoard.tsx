import type { Game } from '../../api/types';
import PlayerCard from './PlayerCard';

interface GameBoardProps {
  game: Game;
  currentUserId: string;
}

export default function GameBoard({ game, currentUserId }: GameBoardProps) {
  const currentTurnPlayer = game.players?.find(p => p.id === game.current_turn_player_id);

  return (
    <div className="space-y-4">
      <div className="pixel-panel p-4 md:p-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          <div>
            <h1 className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest mb-1">
              ▸ COUP TERMINAL
            </h1>
            <p className="font-mono text-xs text-white/50">
              STATUS:{' '}
              <span className="text-neon-green glow-green">
                {game.status.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          </div>

          {currentTurnPlayer && game.status === 'in_progress' && (
            <div className="pixel-panel-cyan px-4 py-2 min-w-[160px]">
              <p className="font-mono text-[10px] text-neon-cyan/60 uppercase tracking-widest mb-0.5">
                Active Player
              </p>
              <p className="font-pixel text-neon-cyan text-[10px] glow-cyan truncate">
                {currentTurnPlayer.user?.username}
              </p>
              <p className="font-mono text-[10px] text-white/40 capitalize mt-0.5">
                [{game.turn_phase?.replace('_', ' ')} phase]
              </p>
            </div>
          )}
        </div>

        <div className="pixel-divider mb-5" />

        {/* Player Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {game.players?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentUser={player.user_id.toString() === currentUserId}
              isCurrentTurn={player.id === game.current_turn_player_id}
              game={game}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
