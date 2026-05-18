<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GamePoll;
use App\Services\GamePollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GamePollController extends Controller
{
    public function __construct(
        protected GamePollService $pollService,
    ) {}

    public function index(int $gameId, Request $request): JsonResponse
    {
        $game = $this->findGameForPlayer($gameId);

        $this->pollService->closeExpiredPollsForGame($game->id);

        $status = $request->query('status');

        $query = GamePoll::query()
            ->where('game_id', $game->id)
            ->with([
                'creator:id,username',
                'actorPlayer.user:id,username',
                'targetPlayer.user:id,username',
                'votes.user:id,username',
            ])
            ->orderByDesc('id');

        if ($status === 'open') {
            $query->where('status', 'open');
        } elseif ($status === 'closed') {
            $query->where('status', 'closed')->limit(20);
        } else {
            $query->where(function ($q) {
                $q->where('status', 'open')
                    ->orWhere(function ($q2) {
                        $q2->where('status', 'closed')->where('closed_at', '>=', now()->subHour());
                    });
            });
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(int $gameId, Request $request): JsonResponse
    {
        $game = $this->findGameForPlayer($gameId);
        $user = Auth::guard('api')->user();

        $validator = Validator::make($request->all(), [
            'actor_player_id' => ['required', 'integer'],
            'action_type' => ['required', 'string'],
            'target_player_id' => ['nullable', 'integer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        $poll = $this->pollService->create(
            $game,
            $user,
            (int) $request->input('actor_player_id'),
            $request->input('action_type'),
            $request->input('target_player_id') ? (int) $request->input('target_player_id') : null,
        );

        return response()->json($poll, 201);
    }

    public function vote(int $gameId, int $pollId, Request $request): JsonResponse
    {
        $game = $this->findGameForPlayer($gameId);
        $user = Auth::guard('api')->user();

        $poll = GamePoll::query()
            ->where('game_id', $game->id)
            ->findOrFail($pollId);

        $validator = Validator::make($request->all(), [
            'vote' => ['required', 'in:yes,no'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        $poll = $this->pollService->vote($poll, $user, $request->input('vote'));

        return response()->json($poll);
    }

    protected function findGameForPlayer(int $gameId): Game
    {
        $user = Auth::guard('api')->user();
        $game = Game::query()->findOrFail($gameId);

        $isPlayer = $game->players()->where('user_id', $user->id)->exists();
        if (! $isPlayer) {
            abort(403, 'You are not a player in this game.');
        }

        return $game;
    }
}
