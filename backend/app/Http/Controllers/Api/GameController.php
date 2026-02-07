<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GamePlayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    /**
     * List games (optionally filtered by status), or fetch a single game by id.
     */
    public function index(Request $request): JsonResponse
    {
        if ($id = $request->query('id')) {
            $game = Game::query()->with(['players.user'])->find($id);
            if (! $game) {
                return response()->json(['message' => 'Game not found.'], 404);
            }
            return response()->json($game);
        }

        $query = Game::query()->with(['players.user']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $games = $query->orderByDesc('created_at')->get();

        return response()->json($games);
    }

    /**
     * Create a new game (lobby). Creator joins as player 1, seat 1.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = DB::transaction(function () use ($user) {
            $game = Game::query()->create([
                'created_by_id' => $user->id,
                'status' => 'waiting',
                'max_players' => 6,
            ]);

            GamePlayer::query()->create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'seat_number' => 1,
                'coins' => 2,
            ]);

            return $game->load(['players.user']);
        });

        return response()->json($game);
    }

    /**
     * Join an existing game (lobby). Assigns next free seat.
     */
    public function join(int $id): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->with(['players.user'])->find($id);

        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        if ($game->status !== 'waiting') {
            return response()->json(['message' => 'Game is not accepting players.'], 422);
        }

        $alreadyJoined = $game->players()->where('user_id', $user->id)->exists();
        if ($alreadyJoined) {
            return response()->json(['message' => 'You have already joined this game.'], 422);
        }

        $takenSeats = $game->players()->pluck('seat_number')->toArray();
        $nextSeat = 1;
        while (in_array($nextSeat, $takenSeats)) {
            $nextSeat++;
        }

        if ($nextSeat > $game->max_players) {
            return response()->json(['message' => 'Game is full.'], 422);
        }

        GamePlayer::query()->create([
            'game_id' => $game->id,
            'user_id' => $user->id,
            'seat_number' => $nextSeat,
            'coins' => 2,
        ]);

        $game->load(['players.user']);

        return response()->json($game);
    }

    /**
     * Get the current user's active game (if any).
     */
    public function currentGame(): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()
            ->with(['players.user'])
            ->whereHas('players', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereIn('status', ['waiting', 'in_progress'])
            ->latest()
            ->first();

        if (! $game) {
            return response()->json(null);
        }

        $payload = $game->toArray();
        $payload['host'] = $game->created_by_id !== null
            && (int) $game->created_by_id === (int) $user->id;

        return response()->json($payload);
    }

    /**
     * Leave or cancel a game. If user is the only player, the game is deleted.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->with('players')->find($id);

        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        if ($game->status !== 'waiting') {
            return response()->json(['message' => 'Cannot leave a game in progress.'], 422);
        }

        $gamePlayer = $game->players()->where('user_id', $user->id)->first();

        if (! $gamePlayer) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $gamePlayer->delete();

        if ($game->players()->count() === 0) {
            $game->delete();
        }

        return response()->json(['message' => 'Left game successfully.']);
    }

    public function leave(int $id): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $game = Game::query()->with('players')->find($id);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }
        $gamePlayer = $game->players()->where('user_id', $user->id)->first();
        if (! $gamePlayer) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }
        $gamePlayer->delete();
        if ($game->players()->count() === 0) {
            $game->delete();
        }
        return response()->json(['message' => 'Left game successfully.']);
    }

}
