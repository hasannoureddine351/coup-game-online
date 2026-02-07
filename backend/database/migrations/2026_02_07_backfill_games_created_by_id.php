<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Backfill created_by_id from the player in seat 1 (creator) for games where it is null.
     */
    public function up(): void
    {
        $gameIds = DB::table('games')->whereNull('created_by_id')->pluck('id');
        foreach ($gameIds as $gameId) {
            $creatorUserId = DB::table('game_players')
                ->where('game_id', $gameId)
                ->where('seat_number', 1)
                ->value('user_id');
            if ($creatorUserId !== null) {
                DB::table('games')->where('id', $gameId)->update(['created_by_id' => $creatorUserId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional: set back to null. Leave as no-op so rollback doesn't wipe data.
    }
};
