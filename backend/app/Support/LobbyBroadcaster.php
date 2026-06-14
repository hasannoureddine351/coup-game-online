<?php

namespace App\Support;

use App\Events\LobbyUpdated;
use Illuminate\Support\Facades\Log;

/**
 * Safely broadcasts lobby-list changes. Mirrors GameStateBroadcaster: a
 * broadcast failure (e.g. Reverb unreachable) must never break the HTTP request.
 */
final class LobbyBroadcaster
{
    public static function dispatch(?string $reason = null, ?int $gameId = null): void
    {
        try {
            event(new LobbyUpdated($reason, $gameId));
        } catch (\Throwable $e) {
            Log::warning('LobbyUpdated broadcast failed', [
                'reason' => $reason,
                'game_id' => $gameId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
