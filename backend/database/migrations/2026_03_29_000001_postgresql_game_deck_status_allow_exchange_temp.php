<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PostgreSQL: Laravel enum columns use a CHECK constraint; add exchange_temp.
     * (MySQL handled in 2026_03_28_120000; SQLite has no strict enum.)
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE game_deck DROP CONSTRAINT IF EXISTS game_deck_status_check');
        DB::statement(
            "ALTER TABLE game_deck ADD CONSTRAINT game_deck_status_check CHECK (status::text IN ('in_deck', 'in_hand', 'discarded', 'exchange_temp'))"
        );
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE game_deck DROP CONSTRAINT IF EXISTS game_deck_status_check');
        DB::statement(
            "ALTER TABLE game_deck ADD CONSTRAINT game_deck_status_check CHECK (status::text IN ('in_deck', 'in_hand', 'discarded'))"
        );
    }
};
