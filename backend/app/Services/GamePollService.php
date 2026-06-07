<?php

namespace App\Services;

use App\Events\GamePollClosed;
use App\Events\GamePollCreated;
use App\Events\GamePollUpdated;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GamePoll;
use App\Models\GamePollVote;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GamePollService
{
    public const POLL_DURATION_SECONDS = 60;

    public const MAX_OPEN_POLLS_PER_GAME = 3;

    public function __construct(
        protected PlayerStatsService $playerStats,
    ) {}

    public function create(Game $game, User $user, int $actorPlayerId, string $actionType, ?int $targetPlayerId): GamePoll
    {
        $this->assertCanParticipate($game, $user);

        if ($game->status !== 'in_progress') {
            throw ValidationException::withMessages(['poll' => 'Polls are only available during an active game.']);
        }

        $openByUser = GamePoll::query()
            ->where('game_id', $game->id)
            ->where('created_by_user_id', $user->id)
            ->where('status', 'open')
            ->count();

        if ($openByUser >= 1) {
            throw ValidationException::withMessages(['poll' => 'You already have an open poll in this game.']);
        }

        $openInGame = GamePoll::query()
            ->where('game_id', $game->id)
            ->where('status', 'open')
            ->count();

        if ($openInGame >= self::MAX_OPEN_POLLS_PER_GAME) {
            throw ValidationException::withMessages(['poll' => 'This game has too many open polls.']);
        }

        $this->validatePollPayload($game, $actorPlayerId, $actionType, $targetPlayerId);

        $poll = GamePoll::query()->create([
            'game_id' => $game->id,
            'created_by_user_id' => $user->id,
            'actor_player_id' => $actorPlayerId,
            'action_type' => $actionType,
            'target_player_id' => $targetPlayerId,
            'status' => 'open',
            'closes_at' => now()->addSeconds(self::POLL_DURATION_SECONDS),
            'created_at' => now(),
        ]);

        $this->playerStats->recordPollCreated($poll->load(['creator', 'actorPlayer.user', 'targetPlayer.user', 'game.players.user']));

        event(new GamePollCreated($poll));

        return $poll;
    }

    public function vote(GamePoll $poll, User $user, string $vote): GamePoll
    {
        if ($poll->status !== 'open') {
            throw ValidationException::withMessages(['poll' => 'This poll is closed.']);
        }

        $poll->loadMissing('game');
        $this->assertCanParticipate($poll->game, $user);

        if ((int) $poll->created_by_user_id === (int) $user->id) {
            throw ValidationException::withMessages(['poll' => 'You cannot vote on your own poll.']);
        }

        if (! in_array($vote, ['yes', 'no'], true)) {
            throw ValidationException::withMessages(['vote' => 'Vote must be yes or no.']);
        }

        GamePollVote::query()->updateOrCreate(
            [
                'poll_id' => $poll->id,
                'user_id' => $user->id,
            ],
            [
                'vote' => $vote,
                'created_at' => now(),
            ]
        );

        $poll = $this->loadPollForBroadcast($poll->id);
        event(new GamePollUpdated($poll));

        $this->tryClosePoll($poll);

        return $this->loadPollForBroadcast($poll->id);
    }

    public function tryClosePoll(GamePoll $poll): bool
    {
        if ($poll->status !== 'open') {
            return false;
        }

        $poll->loadMissing(['game.players', 'votes']);

        if (now()->gte($poll->closes_at) || $this->allEligibleVotersHaveVoted($poll)) {
            return $this->closePoll($poll);
        }

        return false;
    }

    public function closeExpiredPollsForGame(int $gameId): void
    {
        $polls = GamePoll::query()
            ->where('game_id', $gameId)
            ->where('status', 'open')
            ->where('closes_at', '<=', now())
            ->get();

        foreach ($polls as $poll) {
            $this->closePoll($poll);
        }
    }

    protected function closePoll(GamePoll $poll): bool
    {
        return DB::transaction(function () use ($poll) {
            $locked = GamePoll::query()->where('id', $poll->id)->lockForUpdate()->first();
            if (! $locked || $locked->status !== 'open') {
                return false;
            }

            $locked->status = 'closed';
            $locked->closed_at = now();
            $locked->save();

            $this->playerStats->recordPollClosed($locked);

            $loaded = $this->loadPollForBroadcast($locked->id);
            event(new GamePollClosed($loaded));

            return true;
        });
    }

    protected function allEligibleVotersHaveVoted(GamePoll $poll): bool
    {
        $eligibleUserIds = $poll->game->players
            ->where('is_eliminated', false)
            ->pluck('user_id')
            ->filter(fn ($id) => (int) $id !== (int) $poll->created_by_user_id)
            ->values();

        if ($eligibleUserIds->isEmpty()) {
            return true;
        }

        $votedUserIds = $poll->votes->pluck('user_id');

        return $eligibleUserIds->every(fn ($id) => $votedUserIds->contains($id));
    }

    protected function validatePollPayload(Game $game, int $actorPlayerId, string $actionType, ?int $targetPlayerId): void
    {
        $validActions = [
            GameService::ACTION_INCOME,
            GameService::ACTION_FOREIGN_AID,
            GameService::ACTION_TAX,
            GameService::ACTION_ASSASSINATE,
            GameService::ACTION_STEAL,
            GameService::ACTION_EXCHANGE,
            GameService::ACTION_COUP,
        ];

        if (! in_array($actionType, $validActions, true)) {
            throw ValidationException::withMessages(['action_type' => 'Invalid action type.']);
        }

        $actor = $game->players()->where('id', $actorPlayerId)->where('is_eliminated', false)->first();
        if (! $actor) {
            throw ValidationException::withMessages(['actor_player_id' => 'Invalid actor player.']);
        }

        $needsTarget = in_array($actionType, PlayerStatsService::HOSTILE_ACTIONS, true);

        if ($needsTarget) {
            if (! $targetPlayerId) {
                throw ValidationException::withMessages(['target_player_id' => 'Target is required for this action.']);
            }
            $target = $game->players()->where('id', $targetPlayerId)->where('is_eliminated', false)->first();
            if (! $target) {
                throw ValidationException::withMessages(['target_player_id' => 'Invalid target player.']);
            }
            if ((int) $actor->id === (int) $target->id) {
                throw ValidationException::withMessages(['target_player_id' => 'Actor and target must differ.']);
            }
        } elseif ($targetPlayerId !== null) {
            throw ValidationException::withMessages(['target_player_id' => 'This action does not take a target.']);
        }
    }

    protected function assertCanParticipate(Game $game, User $user): GamePlayer
    {
        $player = $game->players()
            ->where('user_id', $user->id)
            ->where('is_eliminated', false)
            ->first();

        if (! $player) {
            throw ValidationException::withMessages(['game' => 'You are not an active player in this game.']);
        }

        return $player;
    }

    public function loadPollForBroadcast(int $pollId): GamePoll
    {
        return GamePoll::query()
            ->with([
                'creator:id,username',
                'actorPlayer.user:id,username',
                'targetPlayer.user:id,username',
                'votes.user:id,username',
            ])
            ->findOrFail($pollId);
    }
}
