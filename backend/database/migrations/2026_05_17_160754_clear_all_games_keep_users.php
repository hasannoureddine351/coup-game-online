<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Wipe all games/lobbies and related rows. Users are preserved.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            // DELETE works when tables are owned by another role (e.g. postgres);
            // TRUNCATE ... RESTART IDENTITY requires table/sequence ownership.
            DB::table('games')->delete();

            return;
        }

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            foreach ([
                'game_action_phase_passes',
                'blocks',
                'challenges',
                'game_actions',
                'player_cards',
                'game_deck',
                'game_state_snapshots',
                'game_players',
                'games',
            ] as $table) {
                DB::table($table)->truncate();
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            return;
        }

        foreach ([
            'game_action_phase_passes',
            'blocks',
            'challenges',
            'game_actions',
            'player_cards',
            'game_deck',
            'game_state_snapshots',
            'game_players',
            'games',
        ] as $table) {
            DB::table($table)->truncate();
        }
    }

    public function down(): void
    {
        // Irreversible data wipe.
    }
};
