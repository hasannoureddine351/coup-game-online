import type { GamePlayer } from '../../api/types.ts';
import CharacterCard from './CharacterCard.tsx';

interface PlayerHandProps {
  player: GamePlayer;
}

export default function PlayerHand({ player }: PlayerHandProps) {
  const activeCards = player.cards?.filter(c => !c.is_revealed && !c.is_discarded) || [];

  if (activeCards.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Your Influence Cards</h2>
      
      <div className="flex gap-4 justify-center">
        {activeCards.map((card) => (
          <CharacterCard key={card.id} card={card} />
        ))}
      </div>

      <p className="text-neutral-400 text-sm text-center mt-4">
        Keep your cards secret. They represent your influence in the game.
      </p>
    </div>
  );
}
