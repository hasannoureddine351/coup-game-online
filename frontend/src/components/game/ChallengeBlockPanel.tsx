import { useState } from 'react';
import { useGameData } from '../../hooks/useGameData.ts';
import type { Game, GamePlayer, GameAction, CharacterType } from '../../api/types.ts';
import { toast } from 'sonner';
import { AlertTriangle, Shield, X } from 'lucide-react';

interface ChallengeBlockPanelProps {
  game: Game;
  currentPlayer: GamePlayer;
  currentAction: GameAction | null;
}

const BLOCKABLE_CHARACTERS: Record<string, CharacterType[]> = {
  Foreign_Aid: ['Duke'],
  Assassinate: ['Contessa'],
  Steal: ['Captain', 'Ambassador'],
};

export default function ChallengeBlockPanel({ game, currentPlayer, currentAction }: ChallengeBlockPanelProps) {
  const { submitChallenge, submitBlock, submitBlockChallenge, passPhase } = useGameData();
  const [selectedBlockCharacter, setSelectedBlockCharacter] = useState<CharacterType | null>(null);

  if (!currentAction || currentAction.status !== 'pending') {
    return null;
  }

  const existingBlock = currentAction.block;
  const isActionTaker = Number(currentPlayer.id) === Number(currentAction.player_id);
  const isBlocker = Boolean(
    existingBlock && Number(currentPlayer.id) === Number(existingBlock.blocker_id)
  );

  /** Challenge phase while a block is on the table and nobody has challenged the block yet. */
  const isBlockBeingChallengedPhase =
    game.turn_phase === 'challenge' && !!existingBlock && !existingBlock.was_challenged;

  const isChallengeable =
    Boolean(currentAction.claimed_character) && game.turn_phase === 'challenge' && !existingBlock;
  const isBlockable = Boolean(BLOCKABLE_CHARACTERS[currentAction.action_type]) && game.turn_phase === 'block';
  const showChallengeBlockButton = isBlockBeingChallengedPhase && !isBlocker;

  const blockerName = existingBlock?.blocker?.user?.username ?? 'Blocker';

  const handleChallenge = () => {
    submitChallenge.mutate(
      {
        gameId: game.id,
        actionId: currentAction.id,
      },
      {
        onSuccess: () => toast.success('Challenge submitted!'),
        onError: (error: any) => toast.error(error.response?.data?.errors?.challenge?.[0] || 'Failed to challenge'),
      }
    );
  };

  const handleBlock = () => {
    if (!selectedBlockCharacter) {
      toast.error('Please select a character to block with');
      return;
    }

    submitBlock.mutate(
      {
        gameId: game.id,
        actionId: currentAction.id,
        claimedCharacter: selectedBlockCharacter,
      },
      {
        onSuccess: () => {
          toast.success('Block submitted!');
          setSelectedBlockCharacter(null);
        },
        onError: (error: any) => toast.error(error.response?.data?.errors?.block?.[0] || 'Failed to block'),
      }
    );
  };

  const handleChallengeBlock = () => {
    submitBlockChallenge.mutate(
      {
        gameId: game.id,
        actionId: currentAction.id,
      },
      {
        onSuccess: () => toast.success('Block challenge submitted!'),
        onError: (error: any) =>
          toast.error(error.response?.data?.errors?.challenge?.[0] || 'Failed to challenge block'),
      }
    );
  };

  const handlePass = () => {
    passPhase.mutate(game.id, {
      onSuccess: () => toast.info('Passed'),
      onError: (error: any) => toast.error('Failed to pass'),
    });
  };

  // Block phase, no block yet: only non–action-takers can block; taker waits.
  if (isActionTaker && game.turn_phase === 'block' && !existingBlock) {
    return (
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">Your Action Pending</h3>
        </div>
        <p className="text-neutral-300">Waiting for other players to challenge or block…</p>
        <p className="text-sm text-neutral-400 mt-2">
          Phase: <span className="capitalize text-blue-400">{game.turn_phase}</span>
        </p>
      </div>
    );
  }

  // Challenge the original character claim (Tax, Steal, …): taker waits; others may challenge.
  if (
    isActionTaker &&
    game.turn_phase === 'challenge' &&
    Boolean(currentAction.claimed_character) &&
    !existingBlock
  ) {
    return (
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">Your Action Pending</h3>
        </div>
        <p className="text-neutral-300">Waiting for other players to challenge your claim or pass…</p>
        <p className="text-sm text-neutral-400 mt-2">
          Phase: <span className="capitalize text-blue-400">{game.turn_phase}</span>
        </p>
      </div>
    );
  }

  // Blocker cannot challenge their own block; they wait (or pass) while others decide.
  if (isBlocker && isBlockBeingChallengedPhase) {
    return (
      <div className="bg-violet-900/20 border border-violet-600 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-violet-400" />
          <h3 className="font-bold text-lg">You blocked this action</h3>
        </div>
        <p className="text-neutral-300 text-sm mb-4">
          You claimed <span className="font-semibold text-violet-200">{existingBlock?.claimed_character}</span>.
          Other players may challenge whether you have that card, or pass to accept the block.
        </p>
        <button
          onClick={handlePass}
          disabled={passPhase.isPending}
          className="w-full bg-emerald-700/80 hover:bg-emerald-600 disabled:bg-neutral-800 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Pass
        </button>
      </div>
    );
  }

  const passHintBlock = isBlockBeingChallengedPhase
    ? "Pass if you don't want to challenge the blocker's claim (the block will stand)."
    : game.turn_phase === 'block'
      ? "Don't have Duke or don't want to block? Pass to let the action succeed."
      : "Don't want to challenge? Pass to continue.";

  return (
    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">
          {currentAction.player?.user?.username} declared {currentAction.action_type}
        </h3>
        {currentAction.claimed_character && (
          <p className="text-sm text-purple-400">Claims to have: {currentAction.claimed_character}</p>
        )}
        {currentAction.targetPlayer && (
          <p className="text-sm text-red-400">Target: {currentAction.targetPlayer.user?.username}</p>
        )}
      </div>

      {existingBlock && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <p className="font-bold text-sm">Block declared</p>
          </div>
          <p className="text-sm">
            <span className="font-semibold">{existingBlock.blocker?.user?.username}</span> is blocking with{' '}
            {existingBlock.claimed_character}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {isChallengeable && (
          <div className="space-y-2">
            <button
              onClick={handleChallenge}
              disabled={submitChallenge.isPending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Challenge {currentAction.claimed_character}
            </button>
            <p className="text-xs text-neutral-400 text-center">
              Challenge if you think they don&apos;t have the {currentAction.claimed_character}
            </p>
          </div>
        )}

        {showChallengeBlockButton && (
          <div className="space-y-2">
            <button
              onClick={handleChallengeBlock}
              disabled={submitBlockChallenge.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Challenge {blockerName}&apos;s {existingBlock?.claimed_character}
            </button>
            <p className="text-xs text-neutral-400 text-center">
              Call the bluff: you think {blockerName} does not have {existingBlock?.claimed_character}.
            </p>
          </div>
        )}

        {isBlockable && !existingBlock && (
          <div className="space-y-3">
            <p className="font-bold">Block this action:</p>
            <div className="grid grid-cols-1 gap-2">
              {BLOCKABLE_CHARACTERS[currentAction.action_type]?.map((character) => (
                <button
                  key={character}
                  type="button"
                  onClick={() => setSelectedBlockCharacter(character)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedBlockCharacter === character
                      ? 'bg-emerald-900/30 border-emerald-600'
                      : 'bg-neutral-900/50 border-neutral-700 hover:border-emerald-600'
                  }`}
                >
                  <p className="font-bold">Block with {character}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleBlock}
              disabled={!selectedBlockCharacter || submitBlock.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Submit Block
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-600">
          <p className="text-sm text-neutral-400 mb-2">{passHintBlock}</p>
          <button
            type="button"
            onClick={handlePass}
            disabled={passPhase.isPending}
            className="w-full bg-emerald-700/80 hover:bg-emerald-600 disabled:bg-neutral-800 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Pass (Don&apos;t {game.turn_phase === 'challenge' ? 'Challenge' : 'Block'})
          </button>
        </div>
      </div>
    </div>
  );
}
