<?php

namespace App\Events;

use App\Models\GamePoll;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GamePollCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GamePoll $poll) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.'.$this->poll->game_id);
    }

    public function broadcastWith(): array
    {
        return ['poll' => $this->poll];
    }
}
