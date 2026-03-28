<?php

namespace App\Events;

use App\Models\Challenge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChallengeMade implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Challenge $challenge)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.' . $this->challenge->action->game_id);
    }

    public function broadcastWith(): array
    {
        return [
            'challenge' => $this->challenge->load(['challenger.user', 'challengedPlayer.user', 'action']),
            'message' => "{$this->challenge->challenger->user->username} challenged {$this->challenge->challengedPlayer->user->username}"
        ];
    }
}
