import { useGameData } from "../../hooks/useGameData";
import type { Game, GameAction, GamePlayer } from "../../api/types";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { playerDisplayName } from "../../utils/actionLogFormat";

type ChallengeRevealPanelProps = {
  game: Game;
  currentPlayer: GamePlayer;
  latestAction: GameAction;
};

function getChallenge(a: GameAction) {
  return (
    a.challenge ??
    (a as unknown as Record<string, unknown>).challenge
  );
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

  if (!isRevealPhase || !hasPendingReveal || !ch) return null;

  if (!isChallenged) {
    return (
      <div className="pixel-panel-yellow p-5 text-center">
        <p className="font-mono text-[10px] text-white/70">
          Waiting for{' '}
          <span className="font-pixel text-neon-yellow glow-yellow text-[9px]">{challengedName}</span>
          {' '}to choose which influence to reveal.
        </p>
        <div className="mt-2 flex justify-center">
          <span className="font-pixel text-[8px] text-neon-yellow animate-blink">■ ■ ■</span>
        </div>
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
    <div className="pixel-panel-red p-5">
      <div className="mb-4 flex items-start gap-3">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-neon-red" aria-hidden />
        <div>
          <h3 className="font-pixel text-[10px] text-neon-red glow-red tracking-widest mb-2">
            ⚠ YOU WERE CHALLENGED
          </h3>
          <p className="font-mono text-[10px] text-white/70 leading-relaxed">
            Choose <span className="font-bold text-white">one</span> of your hidden cards to reveal.
            If it matches the claimed role, your claim stands; otherwise you lose this influence.
          </p>
        </div>
      </div>

      <div className="pixel-divider mb-4" />

      {hiddenCards.length === 0 ? (
        <p className="font-mono text-[10px] text-neon-red">No hidden cards to reveal.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {hiddenCards.map((card) => (
            <button
              key={card.id}
              type="button"
              disabled={revealChallengeCard.isPending}
              onClick={() => handleReveal(card.id)}
              className="bg-cyber-panel border-2 border-neon-red px-5 py-3 text-center font-pixel text-[9px] text-neon-red glow-red
                hover:bg-neon-red/15 transition-all duration-75 touch-manipulation
                disabled:opacity-50
                active:translate-y-[3px]"
              style={{ boxShadow: '4px 4px 0px #000, 0 0 8px rgba(255,0,85,0.3)', minWidth: '7rem' }}
            >
              {card.card_type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
