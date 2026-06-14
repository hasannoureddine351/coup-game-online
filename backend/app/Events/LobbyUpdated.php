<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on the public `lobby` channel whenever the set of waiting games
 * changes (created / joined / left / deleted). Lobby-list viewers are not
 * subscribed to any per-game channel, so this is how they learn to refresh.
 *
 * The payload is intentionally minimal — clients just refetch the games list.
 */
class LobbyUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ?string $reason = null, public ?int $gameId = null)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('lobby');
    }

    public function broadcastWith(): array
    {
        return [
            'reason' => $this->reason,
            'game_id' => $this->gameId,
        ];
    }
}
