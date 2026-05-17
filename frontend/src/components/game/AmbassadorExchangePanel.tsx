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
    () => (currentPlayer.cards ?? []).filter((c) => !c.is_revealed && !c.is_discarded),
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
      toast.error(keepCount === 1 ? 'Select exactly 1 card to keep' : 'Select exactly 2 cards to keep');
      return;
    }
    const keep_hand_card_ids: number[] = [];
    const keep_deck_card_ids: number[] = [];
    for (const k of picked) {
      if (k.startsWith('h:')) keep_hand_card_ids.push(Number(k.slice(2)));
      else keep_deck_card_ids.push(Number(k.slice(2)));
    }
    finalizeExchange.mutate(
      { gameId: game.id, keep_hand_card_ids, keep_deck_card_ids },
      {
        onSuccess: () => { toast.success('Exchange complete'); setPicked([]); },
        onError: (err: any) =>
          toast.error(err?.response?.data?.errors?.exchange?.[0] || err?.message || 'Exchange failed'),
      }
    );
  };

  if (drawn.length !== 2) return null;

  if (!canExchange) {
    return (
      <div className="pixel-panel-red p-5">
        <h3 className="font-pixel text-[9px] text-neon-red glow-red tracking-widest mb-2">
          AMBASSADOR EXCHANGE
        </h3>
        <p className="font-mono text-[10px] text-white/60">
          Need 1–2 influence cards and 2 deck draws. This client sees {hand.length} hand card(s). Try refreshing.
        </p>
      </div>
    );
  }

  const title = keepCount === 1
    ? 'AMBASSADOR — KEEP 1 CARD'
    : 'AMBASSADOR — KEEP 2 CARDS';
  const blurb = keepCount === 1
    ? 'Pick one from your hand and the two draws. The other two go back to the deck.'
    : 'Pick two from your hand and the two draws from the deck. The other two return to the deck.';
  const cta = keepCount === 1 ? 'CONFIRM — KEEP 1 CARD' : 'CONFIRM — KEEP 2 CARDS';

  return (
    <div className="pixel-panel-green p-4">
      <h3 className="font-pixel text-[10px] text-neon-green glow-green tracking-widest mb-1">
        ▸ {title}
      </h3>
      <p className="font-mono text-[10px] text-white/50 mb-4">{blurb}</p>

      <div className="pixel-divider mb-4" />

      <div className="mb-2">
        <p className="font-mono text-[9px] text-white/40 uppercase mb-2">Your Hand</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {hand.map((c: PlayerCard) => {
            const key = `h:${c.id}` as PickKey;
            const on = picked.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`bg-cyber-panel border-2 p-3 text-left transition-all duration-75
                  ${on
                    ? 'border-neon-green bg-neon-green/15 shadow-[0_0_8px_rgba(0,255,65,0.4),4px_4px_0px_#000]'
                    : 'border-cyber-border hover:border-neon-green shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-[3px]'
                  }`}
              >
                {on && <p className="font-mono text-[8px] text-neon-green mb-0.5">▶ SELECTED</p>}
                <p className="font-mono text-[9px] text-white/40">Hand</p>
                <p className="font-pixel text-[9px] text-neon-green mt-0.5">{c.card_type}</p>
              </button>
            );
          })}
        </div>

        <p className="font-mono text-[9px] text-white/40 uppercase mb-2">From Deck</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {drawn.map((c: DeckCard) => {
            const key = `d:${c.id}` as PickKey;
            const on = picked.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`bg-cyber-panel border-2 p-3 text-left transition-all duration-75
                  ${on
                    ? 'border-neon-cyan bg-neon-cyan/15 shadow-[0_0_8px_rgba(0,240,255,0.4),4px_4px_0px_#000]'
                    : 'border-cyber-border hover:border-neon-cyan shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-[3px]'
                  }`}
              >
                {on && <p className="font-mono text-[8px] text-neon-cyan mb-0.5">▶ SELECTED</p>}
                <p className="font-mono text-[9px] text-white/40">Deck</p>
                <p className="font-pixel text-[9px] text-neon-cyan mt-0.5">{c.card_type}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pixel-divider my-4" />

      <p className="font-mono text-[9px] text-neon-green/60 mb-3">
        Selected: <span className="text-neon-green">{picked.length}</span> / {keepCount}
      </p>

      <button
        type="button"
        onClick={submit}
        disabled={picked.length !== keepCount || finalizeExchange.isPending}
        className="btn-green w-full py-3 text-[9px] tracking-widest"
      >
        {finalizeExchange.isPending ? 'PROCESSING...' : cta}
      </button>
    </div>
  );
}
