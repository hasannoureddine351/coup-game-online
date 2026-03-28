<?php

namespace App\Events;

use App\Models\Block;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BlockDeclared implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Block $block)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.' . $this->block->action->game_id);
    }

    public function broadcastWith(): array
    {
        return [
            'block' => $this->block->load(['blocker.user', 'action']),
            'message' => "{$this->block->blocker->user->username} blocked with {$this->block->claimed_character}"
        ];
    }
}
