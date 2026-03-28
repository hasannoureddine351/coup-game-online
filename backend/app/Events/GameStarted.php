<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.' . $this->game->id);
    }

    public function broadcastWith(): array
    {
        return [
            'game' => $this->game->load(['players.user', 'players.cards' => function($q) {
                $q->where('is_revealed', false)->where('is_discarded', false);
            }]),
            'message' => 'Game has started!'
        ];
    }
}
