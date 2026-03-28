<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Truncates all game-related tables. Users are left intact unless you uncomment.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('TRUNCATE TABLE games RESTART IDENTITY CASCADE');
            DB::statement('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
        } elseif ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('blocks')->truncate();
            DB::table('challenges')->truncate();
            DB::table('game_actions')->truncate();
            DB::table('player_cards')->truncate();
            DB::table('game_deck')->truncate();
            DB::table('game_state_snapshots')->truncate();
            DB::table('game_players')->truncate();
            DB::table('games')->truncate();
            DB::table('users')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } else {
            // SQLite / other: truncate in reverse dependency order
            foreach (['blocks', 'challenges', 'game_actions', 'player_cards', 'game_deck', 'game_state_snapshots', 'game_players', 'games', 'users'] as $table) {
                DB::table($table)->truncate();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: data is not restored
    }
};
