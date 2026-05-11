<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_action_phase_passes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_action_id')->constrained('game_actions')->cascadeOnDelete();
            $table->string('pass_round', 32);
            $table->foreignId('game_player_id')->constrained('game_players')->cascadeOnDelete();
            $table->timestamp('created_at');

            $table->unique(['game_action_id', 'pass_round', 'game_player_id'], 'game_action_phase_pass_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_action_phase_passes');
    }
};
