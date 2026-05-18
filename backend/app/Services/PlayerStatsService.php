<?php

namespace App\Services;

use App\Models\Block;
use App\Models\Challenge;
use App\Models\Game;
use App\Models\GameAction;
use App\Models\GamePlayer;
use App\Models\GamePoll;
use App\Models\PlayerStat;
use App\Models\User;

class PlayerStatsService
{
    public const HOSTILE_ACTIONS = [
        GameService::ACTION_ASSASSINATE,
        GameService::ACTION_STEAL,
        GameService::ACTION_COUP,
    ];

    public function ensureStats(User $user): PlayerStat
    {
        return PlayerStat::query()->firstOrCreate(['user_id' => $user->id]);
    }

    public function recordGameEnd(Game $game): void
    {
        $game->refresh();

        if ($game->stats_recorded || $game->status !== 'finished') {
            return;
        }

        $players = $game->players()->with('user')->get();
        $winner = $players->firstWhere('is_eliminated', false);

        foreach ($players as $player) {
            if (! $player->user) {
                continue;
            }
            $stats = $this->ensureStats($player->user);
            $stats->increment('games_played');
            if ($winner && (int) $winner->id === (int) $player->id) {
                $stats->increment('games_won');
            }
        }

        $game->stats_recorded = true;
        $game->save();
    }

    public function recordAlliedChallenge(GameAction $action, GamePlayer $challenger, bool $isBlockChallenge): void
    {
        $action->loadMissing(['player', 'block.blocker']);
        $actor = $action->player;

        if ($isBlockChallenge) {
            $block = $action->block;
            if (! $block || ! $actor) {
                return;
            }
            $blocker = $block->blocker;
            if ((int) $challenger->id === (int) $actor->id || (int) $challenger->id === (int) $blocker->id) {
                return;
            }
            $this->incrementForPlayer($challenger, 'allied_challenges_made');
            $this->incrementForPlayerUserId($actor->user_id, 'allied_challenges_received');

            return;
        }

        if (! $action->target_player_id) {
            return;
        }

        $target = $action->targetPlayer;
        if (! $target || ! $actor) {
            return;
        }

        if ((int) $challenger->id === (int) $actor->id || (int) $challenger->id === (int) $target->id) {
            return;
        }

        $this->incrementForPlayer($challenger, 'allied_challenges_made');
        $this->incrementForPlayer($target, 'allied_challenges_received');
    }

    public function recordChallengeReveal(
        Challenge $challenge,
        GamePlayer $challenged,
        string $claimedCharacter,
        bool $hadClaimedRoleBeforeReveal,
        bool $revealedMatchesClaim,
    ): void {
        $challenge->loadMissing('challenger.user');
        $challenger = $challenge->challenger;

        if ($revealedMatchesClaim) {
            if ($challenger) {
                $this->incrementForPlayer($challenger, 'incorrect_challenges');
            }

            return;
        }

        if ($challenger) {
            $this->incrementForPlayer($challenger, 'correct_challenges');
        }

        if ($hadClaimedRoleBeforeReveal) {
            $this->incrementForPlayer($challenged, 'misleading_reveals');
        } else {
            $this->incrementForPlayer($challenged, 'failed_bluffs');
        }
    }

    public function recordUnchallengedBluff(GamePlayer $player, string $claimedCharacter): void
    {
        if ($this->playerHadCharacter($player, $claimedCharacter)) {
            return;
        }

        $this->incrementForPlayer($player, 'successful_bluffs');
    }

    public function recordAmbassadorBluffDefense(GamePlayer $player): void
    {
        $this->incrementForPlayer($player, 'successful_bluffs');
    }

    public function recordPollCreated(GamePoll $poll): void
    {
        $poll->loadMissing(['creator', 'actorPlayer', 'game.players']);
        $creator = $poll->creator;
        if (! $creator) {
            return;
        }

        $stats = $this->ensureStats($creator);
        $stats->increment('polls_created');

        if ($this->isIncitementPoll($poll)) {
            $stats->increment('incitement_polls_created');
        }
    }

    public function recordPollClosed(GamePoll $poll): void
    {
        if ($poll->status !== 'closed') {
            return;
        }

        $poll->loadMissing(['creator', 'votes']);
        $creator = $poll->creator;
        if (! $creator) {
            return;
        }

        $votes = $poll->votes->where('user_id', '!=', $creator->id);
        $yesCount = $votes->where('vote', 'yes')->count();
        $total = $votes->count();

        if ($total === 0) {
            return;
        }

        $stats = $this->ensureStats($creator);
        $stats->increment('poll_yes_votes_received', $yesCount);
        $stats->increment('poll_votes_received', $total);
    }

    public function playerHadCharacter(GamePlayer $player, string $character): bool
    {
        return $player->cards()
            ->where('is_revealed', false)
            ->where('is_discarded', false)
            ->where('card_type', $character)
            ->exists();
    }

    public function isIncitementPoll(GamePoll $poll): bool
    {
        $poll->loadMissing(['actorPlayer', 'creator']);

        if (! in_array($poll->action_type, self::HOSTILE_ACTIONS, true)) {
            return false;
        }

        if (! $poll->target_player_id || ! $poll->actorPlayer) {
            return false;
        }

        $creatorPlayer = $poll->game
            ?->players()
            ->where('user_id', $poll->created_by_user_id)
            ->first();

        if (! $creatorPlayer) {
            return false;
        }

        return (int) $creatorPlayer->id !== (int) $poll->actor_player_id
            && (int) $poll->target_player_id !== (int) $creatorPlayer->id;
    }

    protected function incrementForPlayer(?GamePlayer $player, string $column): void
    {
        if (! $player?->user_id) {
            return;
        }

        $this->incrementForPlayerUserId($player->user_id, $column);
    }

    protected function incrementForPlayerUserId(int $userId, string $column): void
    {
        $user = User::query()->find($userId);
        if (! $user) {
            return;
        }

        $this->ensureStats($user)->increment($column);
    }
}
