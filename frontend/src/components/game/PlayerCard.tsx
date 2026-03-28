import { Coins, Shield, Skull } from 'lucide-react';
import type { GamePlayer, Game } from '../../api/types.ts';

interface PlayerCardProps {
  player: GamePlayer;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  game: Game;
}

export default function PlayerCard({ player, isCurrentUser, isCurrentTurn }: PlayerCardProps) {
  const activeCards = player.cards?.filter(c => !c.is_revealed && !c.is_discarded) || [];
  const revealedCards = player.cards?.filter(c => c.is_revealed) || [];

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isCurrentTurn
          ? 'bg-emerald-900/20 border-emerald-600 shadow-lg shadow-emerald-900/50'
          : 'bg-neutral-900/50 border-neutral-700'
      } ${isCurrentUser ? 'ring-2 ring-blue-500' : ''} ${
        player.is_eliminated ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${player.is_eliminated ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <h3 className="font-bold text-lg">
            {player.user?.username}
            {isCurrentUser && <span className="text-blue-400 text-sm ml-2">(You)</span>}
          </h3>
        </div>
        
        {player.is_eliminated && (
          <Skull className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{player.coins}</span>
          <span className="text-neutral-500 text-sm">coins</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-bold">{activeCards.length}</span>
          <span className="text-neutral-500 text-sm">influence</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {isCurrentUser ? (
            activeCards.map((card) => (
              <div
                key={card.id}
                className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-3 text-center"
              >
                <p className="text-xs text-neutral-400">Your Card</p>
                <p className="font-bold text-sm">{card.card_type}</p>
              </div>
            ))
          ) : (
            <div className="flex gap-2 flex-1">
              {activeCards.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-3 text-center"
                >
                  <div className="w-8 h-10 mx-auto bg-neutral-700 rounded" />
                </div>
              ))}
            </div>
          )}
        </div>

        {revealedCards.length > 0 && (
          <div className="pt-2 border-t border-neutral-700">
            <p className="text-xs text-neutral-500 mb-1">Revealed:</p>
            <div className="flex gap-2 flex-wrap">
              {revealedCards.map((card) => (
                <span
                  key={card.id}
                  className="text-xs bg-red-900/30 border border-red-700 px-2 py-1 rounded"
                >
                  {card.card_type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
