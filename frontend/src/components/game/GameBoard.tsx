import type { Game } from '../../api/types';
import PlayerCard from './PlayerCard';

interface GameBoardProps {
  game: Game;
  currentUserId: string;
}

export default function GameBoard({ game, currentUserId }: GameBoardProps) {
  const currentTurnPlayer = game.players?.find(p => p.id === game.current_turn_player_id);
  
  return (
    <div className="space-y-6">
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Coup Game</h1>
            <p className="text-neutral-400 text-sm">
              Status: <span className="text-emerald-400 capitalize">{game.status.replace('_', ' ')}</span>
            </p>
          </div>
          
          {currentTurnPlayer && game.status === 'in_progress' && (
            <div className="bg-neutral-900/80 px-4 py-2 rounded-lg border border-neutral-600">
              <p className="text-sm text-neutral-400">Current Turn</p>
              <p className="font-bold text-emerald-400">{currentTurnPlayer.user?.username}</p>
              <p className="text-xs text-neutral-500 capitalize">{game.turn_phase} phase</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
