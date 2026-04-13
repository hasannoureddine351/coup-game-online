<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GameAction;
use App\Models\Block;
use App\Services\GameService;
use App\Events\GameStarted;
use App\Events\ActionDeclared;
use App\Events\ChallengeMade;
use App\Events\BlockDeclared;
use App\Events\GameStateUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    /**
     * Eager loads for broadcasting / JSON when full game state is needed.
     *
     * @return array<string, mixed>
     */
    protected function relationsForGameStateBroadcast(): array
    {
        return [
            'players.user',
            'players.cards' => function ($q) {
                $q->select('id', 'game_player_id', 'card_type', 'is_revealed', 'is_discarded', 'position');
            },
            'actions' => function ($q) {
                $q->orderBy('id', 'desc')->limit(150)->with([
                    'player.user',
                    'targetPlayer.user',
                    'challenge.challenger.user',
                    'challenge.challengedPlayer.user',
                    'block.blocker.user',
                ]);
            },
            'exchangeTempDeckCards',
        ];
    }

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
    public function currentGame(GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()
            ->with([
                'players.user',
                'players.cards' => function($q) {
                    $q->select('id', 'game_player_id', 'card_type', 'is_revealed', 'is_discarded', 'position');
                },
            'actions' => function ($q) {
                $q->orderBy('id', 'desc')->limit(150)->with([
                    'player.user',
                    'targetPlayer.user',
                    'challenge.challenger.user',
                    'challenge.challengedPlayer.user',
                    'block.blocker.user',
                ]);
            },
            'exchangeTempDeckCards',
            ])
            ->whereHas('players', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereIn('status', ['waiting', 'in_progress', 'finished'])
            ->latest()
            ->first();

        if (! $game) {
            return response()->json(null);
        }

        $gameService->syncChallengeRevealPhase($game);
        // Do not call $game->refresh() here — refresh() drops eager-loaded relations and strips players.user / cards / nested actions from the JSON payload.

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

        if ($game->status === 'finished') {
            if (! $game->players()->where('user_id', $user->id)->exists()) {
                return response()->json(['message' => 'You are not in this game.'], 422);
            }
            $game->delete();

            return response()->json(['message' => 'Game removed.']);
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

    public function toggleReady(int $id): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($id);
        if (! $game || $game->status !== 'waiting') {
            return response()->json(['message' => 'Game not found or not in waiting state.'], 404);
        }

        $gamePlayer = $game->players()->where('user_id', $user->id)->first();
        if (! $gamePlayer) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $gamePlayer->is_ready = !$gamePlayer->is_ready;
        $gamePlayer->save();

        event(new GameStateUpdated($game->fresh(['players.user']), "{$user->username} is " . ($gamePlayer->is_ready ? 'ready' : 'not ready')));

        return response()->json($game->fresh(['players.user']));
    }

    public function start(int $id, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($id);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        try {
            $game = $gameService->startGame($game, $user->id);
            event(new GameStarted($game));
            return response()->json($game);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function submitAction(int $id, Request $request, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($id);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        $player = $game->players()->where('user_id', $user->id)->first();
        if (! $player) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $validated = $request->validate([
            'action_type' => 'required|string|in:Income,Foreign_Aid,Tax,Assassinate,Steal,Exchange,Coup',
            'target_player_id' => 'nullable|integer|exists:game_players,id',
            'claimed_character' => 'nullable|string|in:Duke,Assassin,Captain,Ambassador,Contessa'
        ]);

        try {
            $action = $gameService->submitAction($game, $player->id, $validated);
            event(new ActionDeclared($action));
            event(new GameStateUpdated($game->fresh(['players.user', 'players.cards'])));
            return response()->json($action);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function submitChallenge(int $gameId, int $actionId, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $action = GameAction::query()->find($actionId);
        if (! $action || $action->game_id !== $gameId) {
            return response()->json(['message' => 'Action not found.'], 404);
        }

        $game = $action->game;
        $challenger = $game->players()->where('user_id', $user->id)->first();
        if (! $challenger) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        try {
            $challenge = $gameService->submitChallenge($action, $challenger->id);
            event(new ChallengeMade($challenge));
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast())));
            return response()->json($challenge);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function submitBlock(int $gameId, int $actionId, Request $request, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $action = GameAction::query()->find($actionId);
        if (! $action || $action->game_id !== $gameId) {
            return response()->json(['message' => 'Action not found.'], 404);
        }

        $game = $action->game;
        $blocker = $game->players()->where('user_id', $user->id)->first();
        if (! $blocker) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $validated = $request->validate([
            'claimed_character' => 'required|string|in:Duke,Contessa,Captain,Ambassador'
        ]);

        try {
            $block = $gameService->submitBlock($action, $blocker->id, $validated['claimed_character']);
            event(new BlockDeclared($block));
            event(new GameStateUpdated($game->fresh(['players.user', 'players.cards'])));
            return response()->json($block);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function submitBlockChallenge(int $gameId, int $actionId, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $action = GameAction::query()->find($actionId);
        if (! $action || $action->game_id !== $gameId) {
            return response()->json(['message' => 'Action not found.'], 404);
        }

        $block = $action->block;
        if (! $block) {
            return response()->json(['message' => 'No block to challenge.'], 404);
        }

        $game = $action->game;
        $challenger = $game->players()->where('user_id', $user->id)->first();
        if (! $challenger) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        try {
            $challenge = $gameService->submitBlockChallenge($block, $challenger->id);
            event(new ChallengeMade($challenge));
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast())));
            return response()->json($challenge);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function revealChallengeCard(int $gameId, int $actionId, Request $request, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'player_card_id' => 'required|integer|exists:player_cards,id',
        ]);

        $action = GameAction::query()->find($actionId);
        if (! $action || $action->game_id !== $gameId) {
            return response()->json(['message' => 'Action not found.'], 404);
        }

        $game = $action->game;
        $player = $game->players()->where('user_id', $user->id)->first();
        if (! $player) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        try {
            $challenge = $gameService->revealChallengeCard($action, $player, $validated['player_card_id']);
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast())));

            return response()->json($challenge);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function resolveAction(int $gameId, int $actionId, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $action = GameAction::query()->find($actionId);
        if (! $action || $action->game_id !== $gameId) {
            return response()->json(['message' => 'Action not found.'], 404);
        }

        $game = $action->game;

        try {
            $gameService->resolveAction($action);
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast())));
            return response()->json(['message' => 'Action resolved successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function passPhase(int $id, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($id);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        $player = $game->players()->where('user_id', $user->id)->first();
        if (! $player) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        try {
            $gameService->passPhase($game, $player);
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast()), 'Phase passed'));
            return response()->json(['message' => 'Phase passed successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function chooseCardToLose(int $gameId, Request $request, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($gameId);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        $player = $game->players()->where('user_id', $user->id)->first();
        if (! $player) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $validated = $request->validate([
            'card_id' => 'required|integer|exists:player_cards,id'
        ]);

        try {
            $gameService->chooseCardToLose($player, $validated['card_id']);
            event(new GameStateUpdated($game->fresh($this->relationsForGameStateBroadcast()), "{$user->username} lost influence"));
            return response()->json(['message' => 'Card revealed successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function finalizeAmbassadorExchange(int $id, Request $request, GameService $gameService): JsonResponse
    {
        $user = Auth::guard('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $game = Game::query()->find($id);
        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        $player = $game->players()->where('user_id', $user->id)->first();
        if (! $player) {
            return response()->json(['message' => 'You are not in this game.'], 422);
        }

        $validated = $request->validate([
            'keep_hand_card_ids' => 'present|array|max:2',
            'keep_hand_card_ids.*' => 'integer|exists:player_cards,id',
            'keep_deck_card_ids' => 'present|array|max:2',
            'keep_deck_card_ids.*' => 'integer|exists:game_deck,id',
        ]);

        try {
            $gameService->finalizeAmbassadorExchange(
                $game,
                $player,
                $validated['keep_hand_card_ids'],
                $validated['keep_deck_card_ids']
            );

            $fresh = $game->fresh([
                'players.user',
                'players.cards',
                'exchangeTempDeckCards',
                'actions' => function ($q) {
                    $q->orderBy('id', 'desc')->limit(150)->with([
                        'player.user',
                        'targetPlayer.user',
                        'challenge.challenger.user',
                        'challenge.challengedPlayer.user',
                        'block.blocker.user',
                    ]);
                },
            ]);
            event(new GameStateUpdated($fresh, "{$user->username} finished exchange"));

            return response()->json(['message' => 'Exchange completed']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

}
