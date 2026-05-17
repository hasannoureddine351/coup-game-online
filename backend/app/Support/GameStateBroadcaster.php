<?php

namespace App\Support;

use App\Events\GameStateUpdated;
use App\Models\Game;
use Illuminate\Support\Facades\Log;

final class GameStateBroadcaster
{
    public static function dispatch(Game $game, ?string $message = null): void
    {
        try {
            event(new GameStateUpdated($game, $message));
        } catch (\Throwable $e) {
            Log::warning('GameStateUpdated broadcast failed', [
                'game_id' => $game->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
