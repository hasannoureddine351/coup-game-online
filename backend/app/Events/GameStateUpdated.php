<?php

namespace App\Events;

use App\Models\Game;
use App\Support\GameBroadcastPayload;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game, public ?string $message = null)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.' . $this->game->id);
    }

    public function broadcastWith(): array
    {
        return [
            'game' => $this->game->load(GameBroadcastPayload::relations()),
            'message' => $this->message,
        ];
    }
}
