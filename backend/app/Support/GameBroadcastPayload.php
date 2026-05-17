<?php

namespace App\Support;

/**
 * Eager-load shapes for GameStateUpdated broadcasts (keep under Reverb message size limits).
 */
final class GameBroadcastPayload
{
    /**
     * @return array<string, mixed>
     */
    public static function relations(): array
    {
        return [
            'players.user' => function ($q) {
                $q->select('id', 'username');
            },
            'players.cards' => function ($q) {
                $q->select('id', 'game_player_id', 'card_type', 'is_revealed', 'is_discarded', 'position');
            },
            'actions' => function ($q) {
                $q->orderByDesc('id')
                    ->limit(30)
                    ->with([
                        'player.user' => function ($q) {
                            $q->select('id', 'username');
                        },
                        'targetPlayer.user' => function ($q) {
                            $q->select('id', 'username');
                        },
                        'challenge.challenger.user' => function ($q) {
                            $q->select('id', 'username');
                        },
                        'challenge.challengedPlayer.user' => function ($q) {
                            $q->select('id', 'username');
                        },
                        'block.blocker.user' => function ($q) {
                            $q->select('id', 'username');
                        },
                        'phasePasses',
                    ]);
            },
            'exchangeTempDeckCards' => function ($q) {
                $q->select('id', 'game_id', 'card_type', 'status');
            },
        ];
    }
}
