<?php

namespace App\Events;

use App\Models\GameMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GameMessage $message)
    {
        $this->message->load('user:id,username');
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('game.'.$this->message->game_id);
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
        ];
    }
}
