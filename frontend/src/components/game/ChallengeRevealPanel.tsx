import { useGameData } from "../../hooks/useGameData.ts";
import type { Game, GameAction, GamePlayer } from "../../api/types.ts";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { playerDisplayName } from "../../utils/actionLogFormat.ts";

type ChallengeRevealPanelProps = {
  game: Game;
  currentPlayer: GamePlayer;
  latestAction: GameAction;
};

function getChallenge(a: GameAction) {
  return a.challenge ?? (a as Record<string, unknown>).challenge;
}

export default function ChallengeRevealPanel({
  game,
  currentPlayer,
  latestAction,
}: ChallengeRevealPanelProps) {
  const { revealChallengeCard } = useGameData();

  const ch = getChallenge(latestAction) as
    | {
        outcome?: string | null;
        challenged_player_id?: number;
        challengedPlayer?: GamePlayer;
        challenged_player?: GamePlayer;
        challenger?: GamePlayer;
      }
    | undefined;

  const isRevealPhase = game.turn_phase === "challenge_reveal";
  const hasPendingReveal = !!(ch && ch.outcome == null);

  const challengedId =
    hasPendingReveal && ch ? ch.challenged_player_id ?? ch.challengedPlayer?.id : undefined;
  const challengedPlayerResolved =
    hasPendingReveal && ch
      ? ch.challengedPlayer ??
        ch.challenged_player ??
        game.players?.find((p) => Number(p.id) === Number(challengedId))
      : undefined;
  const challengedName = playerDisplayName(challengedPlayerResolved);
  const isChallenged =
    challengedId != null && Number(challengedId) === Number(currentPlayer.id);

  if (!isRevealPhase) {
    return null;
  }

  if (!hasPendingReveal || !ch) {
    return null;
  }

  if (!isChallenged) {
    return (
      <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 p-5 text-center">
        <p className="text-amber-100/90">
          Waiting for <span className="font-semibold text-coup-gold">{challengedName}</span> to choose
          which influence to reveal.
        </p>
      </div>
    );
  }

  const hiddenCards =
    currentPlayer.cards?.filter((c) => !c.is_revealed && !c.is_discarded) ?? [];

  const handleReveal = (playerCardId: number) => {
    revealChallengeCard.mutate(
      { gameId: game.id, actionId: latestAction.id, playerCardId },
      {
        onSuccess: () => toast.success("Card revealed"),
        onError: (error: unknown) => {
          const ax = error as { response?: { data?: { errors?: { reveal?: string[] } } }; message?: string };
          toast.error(
            ax?.response?.data?.errors?.reveal?.[0] ?? ax?.message ?? "Failed to reveal card"
          );
        },
      }
    );
  };

  return (
    <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-neutral-950/80 p-5 shadow-lg">
      <div className="mb-4 flex items-start gap-3">
        <Eye className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" aria-hidden />
        <div>
          <h3 className="text-lg font-bold text-white">You were challenged</h3>
          <p className="mt-1 text-sm text-neutral-300">
            Choose <span className="font-semibold text-white">one</span> of your hidden cards to reveal.
            If it matches the claimed role, your claim stands; if not, you lose this influence. You may
            reveal any card — even bluff by showing a different role than you actually hold.
          </p>
        </div>
      </div>

      {hiddenCards.length === 0 ? (
        <p className="text-sm text-red-300">No hidden cards to reveal.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {hiddenCards.map((card) => (
            <button
              key={card.id}
              type="button"
              disabled={revealChallengeCard.isPending}
              onClick={() => handleReveal(card.id)}
              className="min-h-[48px] min-w-[7rem] rounded-lg border-2 border-coup-gold/60 bg-neutral-900/80 px-4 py-3 text-center font-bold text-white transition hover:border-coup-gold hover:bg-neutral-800 disabled:opacity-50 touch-manipulation"
            >
              {card.card_type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
