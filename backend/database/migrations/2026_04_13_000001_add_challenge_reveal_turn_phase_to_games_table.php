<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE games MODIFY COLUMN turn_phase ENUM('action', 'challenge', 'block', 'resolution', 'challenge_reveal') NULL");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE games DROP CONSTRAINT IF EXISTS games_turn_phase_check');
            DB::statement("ALTER TABLE games ADD CONSTRAINT games_turn_phase_check CHECK (turn_phase IS NULL OR turn_phase::text IN ('action','challenge','block','resolution','challenge_reveal'))");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE games MODIFY COLUMN turn_phase ENUM('action', 'challenge', 'block', 'resolution') NULL");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE games DROP CONSTRAINT IF EXISTS games_turn_phase_check');
            DB::statement("ALTER TABLE games ADD CONSTRAINT games_turn_phase_check CHECK (turn_phase IS NULL OR turn_phase::text IN ('action','challenge','block','resolution'))");
        }
    }
};
