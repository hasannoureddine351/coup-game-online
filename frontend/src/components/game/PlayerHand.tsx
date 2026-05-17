import type { GamePlayer } from '../../api/types';
import CharacterCard from './CharacterCard';

interface PlayerHandProps {
  player: GamePlayer;
}

export default function PlayerHand({ player }: PlayerHandProps) {
  const activeCards = player.cards?.filter(c => !c.is_revealed && !c.is_discarded) || [];

  if (activeCards.length === 0) {
    return null;
  }

  return (
    <div className="pixel-panel-yellow p-4">
      <h2 className="font-pixel text-neon-yellow text-[10px] glow-yellow tracking-widest mb-4">
        ▸ YOUR INFLUENCE CARDS
      </h2>

      <div className="pixel-divider mb-4" />

      <div className="flex gap-4 justify-center flex-wrap">
        {activeCards.map((card) => (
          <CharacterCard key={card.id} card={card} />
        ))}
      </div>

      <p className="font-mono text-white/40 text-[10px] text-center mt-4 uppercase tracking-wider">
        Keep your cards secret — they are your influence in the game.
      </p>
    </div>
  );
}
