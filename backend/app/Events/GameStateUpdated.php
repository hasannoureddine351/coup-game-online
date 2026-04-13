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
            'game' => $this->game->load([
                'players.user',
                'players.cards' => function ($q) {
                    $q->select('id', 'game_player_id', 'card_type', 'is_revealed', 'is_discarded', 'position');
                },
                'actions' => function ($q) {
                    $q->orderBy('id', 'desc')->limit(150)->with([
                        'player.user',
                        'targetPlayer.user',
                        'challenge.challenger.user',
                        'challenge.challengedPlayer.user',
                        'block.blocker.user',
                    ]);
                },
                'exchangeTempDeckCards',
            ]),
            'message' => $this->message
        ];
    }
}
