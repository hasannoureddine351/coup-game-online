import { Coins, Shield, Skull } from 'lucide-react';
import type { GamePlayer, Game } from '../../api/types';

interface PlayerCardProps {
  player: GamePlayer;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  game: Game;
}

const ROLE_PIXEL: Record<string, string> = {
  Duke:       '♛',
  Assassin:   '✝',
  Captain:    '⚓',
  Ambassador: '◈',
  Contessa:   '♦',
};

export default function PlayerCard({ player, isCurrentUser, isCurrentTurn }: PlayerCardProps) {
  const activeCards = player.cards?.filter(c => !c.is_revealed && !c.is_discarded) || [];
  const revealedCards = player.cards?.filter(c => c.is_revealed) || [];

  const borderClass = isCurrentTurn
    ? 'border-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.5),4px_4px_0px_#000]'
    : isCurrentUser
    ? 'border-neon-yellow shadow-[0_0_8px_rgba(255,221,0,0.3),4px_4px_0px_#000]'
    : 'border-cyber-border shadow-[4px_4px_0px_#000]';

  return (
    <div
      className={`relative bg-cyber-panel border-2 transition-all duration-150 ${borderClass} ${
        player.is_eliminated ? 'opacity-50' : ''
      }`}
    >
      {/* Turn indicator strip */}
      {isCurrentTurn && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-neon-cyan shadow-neon-cyan" />
      )}

      <div className="p-3">
        {/* Player header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2.5 h-2.5 shrink-0 ${
                player.is_eliminated
                  ? 'bg-neon-red shadow-neon-red'
                  : isCurrentTurn
                  ? 'bg-neon-cyan shadow-neon-cyan animate-glow-pulse'
                  : 'bg-neon-green'
              }`}
            />
            <h3 className="font-pixel text-[9px] text-white truncate">
              {player.user?.username}
            </h3>
            {isCurrentUser && (
              <span className="font-mono text-[9px] text-neon-cyan shrink-0">[YOU]</span>
            )}
          </div>

          {player.is_eliminated ? (
            <Skull className="w-4 h-4 text-neon-red shrink-0" />
          ) : isCurrentTurn ? (
            <span className="font-pixel text-[8px] text-neon-cyan glow-cyan animate-blink shrink-0">
              ▶ TURN
            </span>
          ) : null}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-neon-yellow text-xs">◈</span>
            <span className="font-pixel text-neon-yellow text-[9px] glow-yellow">{player.coins}</span>
            <span className="font-mono text-white/40 text-[9px]">coins</span>
          </div>
          <div className="w-px h-3 bg-cyber-border" />
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-neon-cyan" />
            <span className="font-pixel text-neon-cyan text-[9px] glow-cyan">{activeCards.length}</span>
            <span className="font-mono text-white/40 text-[9px]">inf</span>
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-2">
          {isCurrentUser ? (
            activeCards.map((card) => (
              <div
                key={card.id}
                className={`flex-1 border px-2 py-2.5 text-center relative overflow-hidden
                  ${card.card_type === 'Duke'       ? 'border-neon-purple bg-neon-purple/10' :
                    card.card_type === 'Assassin'   ? 'border-neon-red bg-neon-red/10' :
                    card.card_type === 'Captain'    ? 'border-neon-cyan bg-neon-cyan/10' :
                    card.card_type === 'Ambassador' ? 'border-neon-green bg-neon-green/10' :
                    card.card_type === 'Contessa'   ? 'border-neon-pink bg-neon-pink/10' :
                    'border-cyber-border bg-cyber-bg'
                  }`}
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <p className={`text-lg mb-0.5
                  ${card.card_type === 'Duke'       ? 'text-neon-purple' :
                    card.card_type === 'Assassin'   ? 'text-neon-red' :
                    card.card_type === 'Captain'    ? 'text-neon-cyan' :
                    card.card_type === 'Ambassador' ? 'text-neon-green' :
                    card.card_type === 'Contessa'   ? 'text-neon-pink' :
                    'text-white'
                  }`}
                >
                  {ROLE_PIXEL[card.card_type] ?? '?'}
                </p>
                <p className="font-pixel text-[7px] text-white/90">{card.card_type}</p>
              </div>
            ))
          ) : (
            <div className="flex gap-2 flex-1">
              {activeCards.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 border border-cyber-border bg-cyber-bg px-2 py-2.5 text-center"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <div className="w-6 h-8 mx-auto bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                    <span className="text-neon-cyan/40 text-xs">?</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revealed cards */}
        {revealedCards.length > 0 && (
          <div className="mt-2 pt-2 border-t border-cyber-border">
            <p className="font-mono text-[9px] text-white/40 mb-1 uppercase">Revealed:</p>
            <div className="flex gap-1.5 flex-wrap">
              {revealedCards.map((card) => (
                <span
                  key={card.id}
                  className="font-pixel text-[7px] text-neon-red border border-neon-red/50 px-1.5 py-0.5 grayscale opacity-70"
                  style={{ boxShadow: '1px 1px 0px #000' }}
                >
                  {card.card_type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Eliminated overlay */}
      {player.is_eliminated && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
          <span
            className="font-pixel text-[9px] text-neon-red border-2 border-neon-red px-2 py-1 rotate-[-12deg]"
            style={{
              textShadow: '0 0 8px #ff0055',
              boxShadow: '0 0 10px rgba(255,0,85,0.5)',
              background: 'rgba(0,0,0,0.85)',
            }}
          >
            ELIMINATED
          </span>
        </div>
      )}
    </div>
  );
}
