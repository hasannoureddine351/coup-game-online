<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow game_deck.status = exchange_temp for Ambassador exchange.
     * SQLite stores enums as loose text — no ALTER needed.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE game_deck MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'in_deck'");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE game_deck DROP CONSTRAINT IF EXISTS game_deck_status_check');
            DB::statement(
                "ALTER TABLE game_deck ADD CONSTRAINT game_deck_status_check CHECK (status::text IN ('in_deck', 'in_hand', 'discarded', 'exchange_temp'))"
            );
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE game_deck MODIFY COLUMN status ENUM('in_deck','in_hand','discarded') NOT NULL DEFAULT 'in_deck'");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE game_deck DROP CONSTRAINT IF EXISTS game_deck_status_check');
            DB::statement(
                "ALTER TABLE game_deck ADD CONSTRAINT game_deck_status_check CHECK (status::text IN ('in_deck', 'in_hand', 'discarded'))"
            );
        }
    }
};
