import type { PlayerCard, CharacterType } from '../../api/types';

interface CharacterCardProps {
  card: PlayerCard;
  onClick?: () => void;
  selectable?: boolean;
}

const CARD_INFO: Record<CharacterType, {
  borderColor: string;
  bgColor: string;
  glowClass: string;
  symbol: string;
  ability: string;
  action: string;
}> = {
  Duke: {
    borderColor: 'border-neon-purple',
    bgColor:     'bg-neon-purple/10',
    glowClass:   'glow-purple',
    symbol:      '♛',
    ability:     'Blocks Foreign Aid',
    action:      'Tax: +3 coins',
  },
  Assassin: {
    borderColor: 'border-neon-red',
    bgColor:     'bg-neon-red/10',
    glowClass:   'glow-red',
    symbol:      '✝',
    ability:     'Assassinate (costs 3)',
    action:      'Kill influence',
  },
  Captain: {
    borderColor: 'border-neon-cyan',
    bgColor:     'bg-neon-cyan/10',
    glowClass:   'glow-cyan',
    symbol:      '⚓',
    ability:     'Blocks Stealing',
    action:      'Steal: Take 2 coins',
  },
  Ambassador: {
    borderColor: 'border-neon-green',
    bgColor:     'bg-neon-green/10',
    glowClass:   'glow-green',
    symbol:      '◈',
    ability:     'Blocks Stealing',
    action:      'Exchange cards',
  },
  Contessa: {
    borderColor: 'border-neon-pink',
    bgColor:     'bg-neon-pink/10',
    glowClass:   'glow-red',
    symbol:      '♦',
    ability:     'Blocks Assassination',
    action:      'Defensive only',
  },
};

const COLOR_MAP: Record<CharacterType, string> = {
  Duke:       'text-neon-purple',
  Assassin:   'text-neon-red',
  Captain:    'text-neon-cyan',
  Ambassador: 'text-neon-green',
  Contessa:   'text-neon-pink',
};

export default function CharacterCard({ card, onClick, selectable }: CharacterCardProps) {
  const info = CARD_INFO[card.card_type];
  const colorClass = COLOR_MAP[card.card_type];

  return (
    <button
      onClick={onClick}
      disabled={!selectable}
      className={`relative w-36 bg-cyber-panel border-2 transition-all duration-100 text-left
        ${info.borderColor} ${info.bgColor}
        ${selectable
          ? 'cursor-pointer hover:scale-105 hover:brightness-125'
          : 'cursor-default'
        }
        ${card.is_revealed ? 'grayscale opacity-50' : ''}
      `}
      style={{ boxShadow: selectable ? '4px 4px 0px #000' : '2px 2px 0px #000' }}
    >
      <div className="p-3 text-center">
        {/* Symbol */}
        <div className={`text-3xl mb-2 ${colorClass} ${info.glowClass}`}>
          {info.symbol}
        </div>

        {/* Name */}
        <h3 className={`font-pixel text-[9px] mb-2 ${colorClass} ${info.glowClass}`}>
          {card.card_type}
        </h3>

        {/* Divider */}
        <div className={`h-px mb-2 opacity-40`}
          style={{
            background: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 3px, transparent 3px, transparent 6px)`,
          }}
        />

        {/* Stats */}
        <p className="font-mono text-[9px] text-white/80 mb-1">{info.action}</p>
        <p className="font-mono text-[9px] text-white/50">{info.ability}</p>
      </div>

      {/* Revealed overlay */}
      {card.is_revealed && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
          <span
            className="font-pixel text-[8px] text-neon-red border border-neon-red px-1.5 py-0.5 rotate-[-12deg]"
            style={{ textShadow: '0 0 6px #ff0055', background: 'rgba(0,0,0,0.9)' }}
          >
            REVEALED
          </span>
        </div>
      )}

      {/* Selectable glow ring */}
      {selectable && (
        <div className={`absolute inset-0 pointer-events-none border-2 ${info.borderColor} opacity-0 hover:opacity-60 transition-opacity`} />
      )}
    </button>
  );
}
