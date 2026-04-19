import { useState, useMemo } from 'react';
import { useGameData } from '../../hooks/useGameData';
import type { Game, GamePlayer, PlayerCard, DeckCard } from '../../api/types';
import { toast } from 'sonner';

type PickKey = `h:${number}` | `d:${number}`;

interface AmbassadorExchangePanelProps {
  game: Game;
  currentPlayer: GamePlayer;
}

export default function AmbassadorExchangePanel({ game, currentPlayer }: AmbassadorExchangePanelProps) {
  const { finalizeExchange } = useGameData();
  const [picked, setPicked] = useState<PickKey[]>([]);

  const hand = useMemo(
    () =>
      (currentPlayer.cards ?? []).filter((c) => !c.is_revealed && !c.is_discarded),
    [currentPlayer.cards]
  );
  const drawn = game.exchange_temp_deck_cards ?? [];

  const keepCount = hand.length;
  const canExchange = keepCount >= 1 && keepCount <= 2 && drawn.length === 2;

  const toggle = (key: PickKey) => {
    setPicked((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= keepCount) return prev;
      return [...prev, key];
    });
  };

  const submit = () => {
    if (picked.length !== keepCount) {
      toast.error(
        keepCount === 1 ? 'Select exactly 1 card to keep' : 'Select exactly 2 cards to keep'
      );
      return;
    }
    const keep_hand_card_ids: number[] = [];
    const keep_deck_card_ids: number[] = [];
    for (const k of picked) {
      if (k.startsWith('h:')) keep_hand_card_ids.push(Number(k.slice(2)));
      else keep_deck_card_ids.push(Number(k.slice(2)));
    }

    finalizeExchange.mutate(
      {
        gameId: game.id,
        keep_hand_card_ids,
        keep_deck_card_ids,
      },
      {
        onSuccess: () => {
          toast.success('Exchange complete');
          setPicked([]);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.errors?.exchange?.[0] || err?.message || 'Exchange failed'),
      }
    );
  };

  if (drawn.length !== 2) {
    return null;
  }

  if (!canExchange) {
    return (
      <div className="bg-rose-900/20 border border-rose-600 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-2 text-rose-200">Ambassador exchange</h3>
        <p className="text-sm text-neutral-300">
          Need 1–2 influence cards and 2 deck draws. This client sees {hand.length} hand card(s). Try refreshing the
          page.
        </p>
      </div>
    );
  }

  const title =
    keepCount === 1
      ? 'Ambassador — choose 1 card to keep'
      : 'Ambassador — choose 2 cards to keep';
  const blurb =
    keepCount === 1
      ? 'Pick one from your hand and the two draws. The other two go back to the deck.'
      : 'Pick two from your hand and the two draws from the deck. The other two return to the deck.';
  const cta = keepCount === 1 ? 'Confirm keep (1 card)' : 'Confirm keep (2 cards)';

  return (
    <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-6">
      <h3 className="font-bold text-lg mb-2 text-amber-200">{title}</h3>
      <p className="text-sm text-neutral-300 mb-4">{blurb}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {hand.map((c: PlayerCard) => {
          const key = `h:${c.id}` as PickKey;
          const on = picked.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`p-3 rounded-lg border-2 text-left ${
                on ? 'border-amber-400 bg-amber-900/40' : 'border-neutral-600 bg-neutral-900/60'
              }`}
            >
              <p className="text-xs text-neutral-400">Your hand</p>
              <p className="font-bold">{c.card_type}</p>
            </button>
          );
        })}
        {drawn.map((c: DeckCard) => {
          const key = `d:${c.id}` as PickKey;
          const on = picked.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`p-3 rounded-lg border-2 text-left ${
                on ? 'border-amber-400 bg-amber-900/40' : 'border-neutral-600 bg-neutral-900/60'
              }`}
            >
              <p className="text-xs text-neutral-400">From deck</p>
              <p className="font-bold">{c.card_type}</p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={picked.length !== keepCount || finalizeExchange.isPending}
        className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-bold py-3 rounded-lg"
      >
        {finalizeExchange.isPending ? 'Submitting…' : cta}
      </button>
    </div>
  );
}
