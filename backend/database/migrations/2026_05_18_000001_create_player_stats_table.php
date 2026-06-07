<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('games_played')->default(0);
            $table->unsignedInteger('games_won')->default(0);
            $table->unsignedInteger('successful_bluffs')->default(0);
            $table->unsignedInteger('failed_bluffs')->default(0);
            $table->unsignedInteger('misleading_reveals')->default(0);
            $table->unsignedInteger('correct_challenges')->default(0);
            $table->unsignedInteger('incorrect_challenges')->default(0);
            $table->unsignedInteger('allied_challenges_received')->default(0);
            $table->unsignedInteger('allied_challenges_made')->default(0);
            $table->unsignedInteger('polls_created')->default(0);
            $table->unsignedInteger('incitement_polls_created')->default(0);
            $table->unsignedInteger('poll_yes_votes_received')->default(0);
            $table->unsignedInteger('poll_votes_received')->default(0);
            $table->timestamps();
        });

        $now = now();
        $userIds = DB::table('users')->pluck('id');
        foreach ($userIds as $userId) {
            DB::table('player_stats')->insert([
                'user_id' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('player_stats');
    }
};
