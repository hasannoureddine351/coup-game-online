<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('games:clear', function () {
    $driver = DB::connection()->getDriverName();

    if ($driver === 'pgsql') {
        DB::statement('TRUNCATE TABLE games RESTART IDENTITY CASCADE');
    } elseif ($driver === 'mysql') {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach (['blocks', 'challenges', 'game_actions', 'player_cards', 'game_deck', 'game_state_snapshots', 'game_players', 'games'] as $table) {
            DB::table($table)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    } else {
        foreach (['blocks', 'challenges', 'game_actions', 'player_cards', 'game_deck', 'game_state_snapshots', 'game_players', 'games'] as $table) {
            DB::table($table)->truncate();
        }
    }

    $this->info('All game data cleared (users preserved).');
})->purpose('Truncate all game-related tables; keeps users');
