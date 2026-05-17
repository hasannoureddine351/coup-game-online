import { useState } from 'react';
import { useGameData } from '../../hooks/useGameData';
import type {
  Game,
  GamePlayer,
  GameAction,
  CharacterType,
  GameActionPhasePassRow,
} from '../../api/types';
import {
  currentPassRound,
  distinctPassCountForRound,
  eligiblePassPlayerIds,
  passesForRound,
} from '../../utils/passRound';
import { isPlayerActiveInGame } from '../../utils/playerActive';
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

const BLOCK_CHAR_COLOR: Record<string, string> = {
  Duke:       'btn-purple',
  Contessa:   'btn-red',
  Captain:    'btn-cyan',
  Ambassador: 'btn-green',
};

const BLOCK_CHAR_SELECTED: Record<string, string> = {
  Duke:       'border-neon-purple bg-neon-purple/20 shadow-[0_0_10px_rgba(182,0,255,0.4),4px_4px_0px_#000]',
  Contessa:   'border-neon-pink bg-neon-pink/15 shadow-[0_0_10px_rgba(255,0,110,0.4),4px_4px_0px_#000]',
  Captain:    'border-neon-cyan bg-neon-cyan/15 shadow-[0_0_10px_rgba(0,240,255,0.4),4px_4px_0px_#000]',
  Ambassador: 'border-neon-green bg-neon-green/15 shadow-[0_0_10px_rgba(0,255,65,0.4),4px_4px_0px_#000]',
};

export default function ChallengeBlockPanel({ game, currentPlayer, currentAction }: ChallengeBlockPanelProps) {
  const { submitChallenge, submitBlock, submitBlockChallenge, passPhase } = useGameData();
  const [selectedBlockCharacter, setSelectedBlockCharacter] = useState<CharacterType | null>(null);

  if (!currentAction || currentAction.status !== 'pending') return null;
  if (game.turn_phase === 'challenge_reveal') return null;

  if (!isPlayerActiveInGame(currentPlayer)) {
    return (
      <div className="pixel-panel p-5">
        <h3 className="font-pixel text-[9px] text-white/50 tracking-widest mb-2">OUT OF GAME</h3>
        <p className="font-mono text-white/40 text-sm">
          You have no influence left and cannot challenge, block, or pass.
        </p>
      </div>
    );
  }

  const existingBlock = currentAction.block;
  const passRound = currentPassRound(game, currentAction, existingBlock);
  const eligiblePassIds = passRound ? eligiblePassPlayerIds(game, currentAction, existingBlock, passRound) : [];
  const passCountForRound = distinctPassCountForRound(currentAction, passRound);
  const hasPassedThisRound =
    passRound != null &&
    passesForRound(currentAction, passRound).some(
      (p: GameActionPhasePassRow) => Number(p.game_player_id) === Number(currentPlayer.id)
    );

  const isActionTaker = Number(currentPlayer.id) === Number(currentAction.player_id);
  const isBlocker = Boolean(existingBlock && Number(currentPlayer.id) === Number(existingBlock.blocker_id));
  const isTargetPlayer =
    currentAction.target_player_id != null &&
    Number(currentPlayer.id) === Number(currentAction.target_player_id);

  const mayActInOpenBlockPhase =
    game.turn_phase === 'block' &&
    !existingBlock &&
    (currentAction.action_type === 'Foreign_Aid'
      ? !isActionTaker
      : currentAction.action_type === 'Assassinate' || currentAction.action_type === 'Steal'
        ? isTargetPlayer
        : false);

  const isBlockBeingChallengedPhase =
    game.turn_phase === 'challenge' && !!existingBlock && !existingBlock.was_challenged;

  const challengeRow = currentAction.challenge;
  const awaitingChallengeReveal =
    Boolean(challengeRow) && (challengeRow?.outcome === null || challengeRow?.outcome === undefined);

  const isChallengeable =
    Boolean(currentAction.claimed_character) &&
    game.turn_phase === 'challenge' &&
    !existingBlock &&
    !awaitingChallengeReveal;
  const canDeclareBlock =
    Boolean(BLOCKABLE_CHARACTERS[currentAction.action_type]) && game.turn_phase === 'block' && mayActInOpenBlockPhase;
  const showChallengeBlockButton = isBlockBeingChallengedPhase && !isBlocker;

  const blockerName = existingBlock?.blocker?.user?.username ?? 'Blocker';

  const handleChallenge = () => {
    submitChallenge.mutate({ gameId: game.id, actionId: currentAction.id }, {
      onSuccess: () => toast.success('Challenge submitted!'),
      onError: (error: any) => toast.error(error.response?.data?.errors?.challenge?.[0] || 'Failed to challenge'),
    });
  };

  const handleBlock = () => {
    if (!selectedBlockCharacter) { toast.error('Please select a character to block with'); return; }
    submitBlock.mutate({ gameId: game.id, actionId: currentAction.id, claimedCharacter: selectedBlockCharacter }, {
      onSuccess: () => { toast.success('Block submitted!'); setSelectedBlockCharacter(null); },
      onError: (error: any) => toast.error(error.response?.data?.errors?.block?.[0] || 'Failed to block'),
    });
  };

  const handleChallengeBlock = () => {
    submitBlockChallenge.mutate({ gameId: game.id, actionId: currentAction.id }, {
      onSuccess: () => toast.success('Block challenge submitted!'),
      onError: (error: any) => toast.error(error.response?.data?.errors?.challenge?.[0] || 'Failed to challenge block'),
    });
  };

  const handlePass = () => {
    passPhase.mutate(game.id, {
      onSuccess: () => toast.info('Passed'),
      onError: (error: any) =>
        toast.error(error.response?.data?.errors?.phase?.[0] || error.response?.data?.message || 'Failed to pass'),
    });
  };

  const passHintBlock = isBlockBeingChallengedPhase
    ? isActionTaker
      ? `Pass to let ${blockerName}'s block stand — your ${currentAction.action_type.replace('_', ' ').toLowerCase()} will not happen.`
      : "Pass if you don't want to challenge the blocker's claim (the block will stand)."
    : game.turn_phase === 'block' && currentAction.action_type === 'Foreign_Aid'
      ? 'Block with Duke if you have it, or pass to allow Foreign Aid (+2 coins).'
      : game.turn_phase === 'block' && currentAction.action_type === 'Assassinate'
        ? 'As the target: block with Contessa, or pass to allow the assassination.'
        : game.turn_phase === 'block' && currentAction.action_type === 'Steal'
          ? 'As the target: block with Captain or Ambassador, or pass to allow the steal.'
          : "Don't want to challenge? Pass to continue.";

  const showPass =
    (game.turn_phase === 'challenge' && !isBlocker) ||
    (game.turn_phase === 'block' && mayActInOpenBlockPhase);

  /* ── Action taker waiting on block phase ── */
  if (isActionTaker && game.turn_phase === 'block' && !existingBlock) {
    return (
      <div className="pixel-panel-cyan p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-neon-cyan" />
          <h3 className="font-pixel text-[9px] text-neon-cyan glow-cyan tracking-widest">ACTION PENDING</h3>
        </div>
        <p className="font-mono text-white/70 text-sm">
          {currentAction.action_type === 'Foreign_Aid'
            ? 'Waiting for other players to block (Duke) or pass…'
            : 'Waiting for the target to block or pass…'}
        </p>
        <p className="font-mono text-[10px] text-white/40 mt-2 uppercase">
          Phase: <span className="text-neon-cyan">{game.turn_phase}</span>
        </p>
      </div>
    );
  }

  /* ── Non-target waiting on Assassinate / Steal block phase ── */
  if (
    game.turn_phase === 'block' &&
    !existingBlock &&
    (currentAction.action_type === 'Assassinate' || currentAction.action_type === 'Steal') &&
    !isTargetPlayer
  ) {
    return (
      <div className="pixel-panel p-5">
        <h3 className="font-pixel text-[9px] text-white/60 tracking-widest mb-2">BLOCK PHASE</h3>
        <p className="font-mono text-white/50 text-sm">
          Only <span className="text-neon-cyan font-bold">{currentAction.targetPlayer?.user?.username}</span> may block
          or pass for this action.
        </p>
      </div>
    );
  }

  /* ── Action taker waiting on challenge phase ── */
  if (isActionTaker && game.turn_phase === 'challenge' && Boolean(currentAction.claimed_character) && !existingBlock) {
    return (
      <div className="pixel-panel-cyan p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-neon-cyan" />
          <h3 className="font-pixel text-[9px] text-neon-cyan glow-cyan tracking-widest">ACTION PENDING</h3>
        </div>
        <p className="font-mono text-white/70 text-sm">
          Waiting for other players to challenge your claim or pass…
        </p>
        <p className="font-mono text-[10px] text-white/40 mt-2 uppercase">
          Phase: <span className="text-neon-cyan">{game.turn_phase}</span>
        </p>
      </div>
    );
  }

  /* ── Blocker waiting for others to challenge ── */
  if (isBlocker && isBlockBeingChallengedPhase) {
    return (
      <div className="pixel-panel-purple p-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-neon-purple" />
          <h3 className="font-pixel text-[9px] text-neon-purple glow-purple tracking-widest">
            BLOCK ACTIVE
          </h3>
        </div>
        <p className="font-mono text-white/70 text-sm">
          You claimed <span className="font-bold text-neon-purple">{existingBlock?.claimed_character}</span>.
          Other players may challenge your claim, or pass to let your block stand.
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-panel p-4">
      {/* Action info */}
      <div className="mb-4">
        <h3 className="font-pixel text-[9px] text-neon-yellow glow-yellow tracking-widest mb-2">
          ▸ ACTION DECLARED
        </h3>
        <p className="font-mono text-white/80 text-sm">
          <span className="text-neon-yellow">{currentAction.player?.user?.username}</span>
          {' '}<span className="text-white/50">declared</span>{' '}
          <span className="text-neon-cyan">{currentAction.action_type.replace('_', ' ')}</span>
        </p>
        {currentAction.claimed_character && (
          <p className="font-mono text-[10px] text-neon-purple mt-1">
            Claims to have: {currentAction.claimed_character}
          </p>
        )}
        {currentAction.targetPlayer && (
          <p className="font-mono text-[10px] text-neon-red mt-0.5">
            Target: {currentAction.targetPlayer.user?.username}
          </p>
        )}
      </div>

      {/* Existing block notice */}
      {existingBlock && (
        <div className="pixel-panel-yellow p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-neon-yellow" />
            <p className="font-pixel text-[8px] text-neon-yellow glow-yellow">BLOCK DECLARED</p>
          </div>
          <p className="font-mono text-[10px] text-white/80">
            <span className="text-neon-yellow font-bold">{existingBlock.blocker?.user?.username}</span>
            {' '}is blocking with <span className="text-neon-yellow">{existingBlock.claimed_character}</span>
          </p>
        </div>
      )}

      <div className="pixel-divider mb-4" />

      <div className="space-y-3">
        {/* Challenge original claim */}
        {isChallengeable && !isActionTaker && (
          <div className="space-y-1.5">
            <button
              onClick={handleChallenge}
              disabled={submitChallenge.isPending}
              className="btn-red w-full py-3 text-[9px] tracking-widest flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              CHALLENGE {currentAction.claimed_character?.toUpperCase()}
            </button>
            <p className="font-mono text-[9px] text-white/40 text-center">
              Challenge if you think they don't have the {currentAction.claimed_character}
            </p>
          </div>
        )}

        {/* Challenge the block */}
        {showChallengeBlockButton && (
          <div className="space-y-1.5">
            <button
              onClick={handleChallengeBlock}
              disabled={submitBlockChallenge.isPending}
              className="btn-red w-full py-3 text-[9px] tracking-widest flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--neon-yellow)', color: 'var(--neon-yellow)', boxShadow: '0px 4px 0px rgba(255,221,0,0.4), 0px 5px 0px #000' }}
            >
              <AlertTriangle className="w-4 h-4" />
              CHALLENGE {blockerName.toUpperCase()}'S {existingBlock?.claimed_character?.toUpperCase()}
            </button>
            <p className="font-mono text-[9px] text-white/40 text-center">
              Call the bluff: you think {blockerName} does not have {existingBlock?.claimed_character}.
            </p>
          </div>
        )}

        {/* Declare block */}
        {canDeclareBlock && (
          <div className="space-y-3">
            <p className="font-pixel text-[9px] text-neon-cyan glow-cyan tracking-widest">
              ▸ BLOCK WITH CHARACTER:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {BLOCKABLE_CHARACTERS[currentAction.action_type]?.map((character) => (
                <button
                  key={character}
                  type="button"
                  onClick={() => setSelectedBlockCharacter(character)}
                  className={`bg-cyber-panel border-2 p-3 text-left transition-all duration-75
                    ${selectedBlockCharacter === character
                      ? BLOCK_CHAR_SELECTED[character] ?? 'border-neon-cyan bg-neon-cyan/15'
                      : 'border-cyber-border hover:border-neon-cyan shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-[3px]'
                    }`}
                >
                  <p className={`font-pixel text-[9px] ${selectedBlockCharacter === character ? 'text-neon-cyan glow-cyan' : 'text-white/70'}`}>
                    {selectedBlockCharacter === character ? '▶ ' : ''}Block with {character}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleBlock}
              disabled={!selectedBlockCharacter || submitBlock.isPending}
              className="btn-cyan w-full py-3 text-[9px] tracking-widest flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              SUBMIT BLOCK
            </button>
          </div>
        )}

        {/* Pass */}
        {showPass && (
          <div className="pt-2 border-t border-cyber-border">
            {passRound && eligiblePassIds.length > 0 && (
              <p className="font-mono text-[9px] text-white/50 mb-2">
                Passed: <span className="text-neon-cyan">{passCountForRound}</span> / {eligiblePassIds.length}
              </p>
            )}
            <p className="font-mono text-[9px] text-white/40 mb-2">{passHintBlock}</p>
            <button
              type="button"
              onClick={handlePass}
              disabled={passPhase.isPending || hasPassedThisRound}
              className="btn-yellow w-full py-3 text-[9px] tracking-widest flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              PASS
              {game.turn_phase === 'challenge' && !isBlockBeingChallengedPhase
                ? ' — NO CHALLENGE'
                : game.turn_phase === 'challenge' && isBlockBeingChallengedPhase
                  ? ' — LET BLOCK STAND'
                  : game.turn_phase === 'block'
                    ? ' — DECLINE BLOCK'
                    : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
