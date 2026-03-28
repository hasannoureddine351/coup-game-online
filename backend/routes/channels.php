<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    $game = Game::find($gameId);
    if (!$game) {
        return false;
    }
    return $game->players()->where('user_id', $user->id)->exists();
});
