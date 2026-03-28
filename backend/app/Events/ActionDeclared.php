<?php

namespace App\Events;

use App\Models\GameAction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActionDeclared implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GameAction $action)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.' . $this->action->game_id);
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action->load([
                'player.user',
                'targetPlayer.user',
                'game.players.user',
            ]),
            'message' => "{$this->action->player->user->username} declared {$this->action->action_type}"
        ];
    }
}
