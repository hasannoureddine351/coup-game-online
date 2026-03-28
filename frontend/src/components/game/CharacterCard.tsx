import type { PlayerCard, CharacterType } from '../../api/types.ts';

interface CharacterCardProps {
  card: PlayerCard;
  onClick?: () => void;
  selectable?: boolean;
}

const CARD_INFO: Record<CharacterType, { color: string; ability: string; action: string }> = {
  Duke: {
    color: 'bg-purple-600',
    ability: 'Blocks Foreign Aid',
    action: 'Tax: +3 coins'
  },
  Assassin: {
    color: 'bg-red-600',
    ability: 'Assassinate (costs 3)',
    action: 'Kill influence'
  },
  Captain: {
    color: 'bg-blue-600',
    ability: 'Blocks Stealing',
    action: 'Steal: Take 2 coins'
  },
  Ambassador: {
    color: 'bg-green-600',
    ability: 'Blocks Stealing',
    action: 'Exchange cards'
  },
  Contessa: {
    color: 'bg-pink-600',
    ability: 'Blocks Assassination',
    action: 'Defensive only'
  }
};

export default function CharacterCard({ card, onClick, selectable }: CharacterCardProps) {
  const info = CARD_INFO[card.card_type];

  return (
    <button
      onClick={onClick}
      disabled={!selectable}
      className={`relative p-4 rounded-lg border-2 w-36 transition-all ${
        selectable
          ? 'border-neutral-600 hover:border-emerald-500 hover:scale-105 cursor-pointer'
          : 'border-neutral-700'
      } ${info.color} bg-opacity-20`}
    >
      <div className="text-center">
        <h3 className="font-bold text-lg mb-2">{card.card_type}</h3>
        <div className="space-y-1">
          <p className="text-xs text-neutral-300">{info.action}</p>
          <p className="text-xs text-neutral-400">{info.ability}</p>
        </div>
      </div>

      {card.is_revealed && (
        <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
          <span className="text-red-500 font-bold text-sm">REVEALED</span>
        </div>
      )}
    </button>
  );
}
