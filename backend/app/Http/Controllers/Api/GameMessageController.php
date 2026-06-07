<?php

namespace App\Http\Controllers\Api;

use App\Events\GameMessageSent;
use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GameMessageController extends Controller
{
    public function index(int $gameId, Request $request): JsonResponse
    {
        $game = $this->findGameForPlayer($gameId);
        $limit = min(max((int) $request->query('limit', 50), 1), 100);
        $beforeId = $request->query('before_id');

        $query = GameMessage::query()
            ->where('game_id', $game->id)
            ->with('user:id,username')
            ->orderByDesc('id')
            ->limit($limit);

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->get()->sortBy('id')->values();

        return response()->json(['data' => $messages]);
    }

    public function store(int $gameId, Request $request): JsonResponse
    {
        $game = $this->findGameForPlayer($gameId);

        $validator = Validator::make($request->all(), [
            'body' => ['required', 'string', 'min:1', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        if (! in_array($game->status, ['waiting', 'in_progress'], true)) {
            return response()->json(['message' => 'Cannot send messages in this game state.'], 422);
        }

        $user = Auth::guard('api')->user();

        $message = GameMessage::query()->create([
            'game_id' => $game->id,
            'user_id' => $user->id,
            'body' => $request->input('body'),
            'created_at' => now(),
        ]);

        event(new GameMessageSent($message));

        return response()->json($message->load('user:id,username'), 201);
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
