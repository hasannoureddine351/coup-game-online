<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('actor_player_id')->constrained('game_players')->cascadeOnDelete();
            $table->string('action_type');
            $table->foreignId('target_player_id')->nullable()->constrained('game_players')->nullOnDelete();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('closes_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('created_at');

            $table->index(['game_id', 'status']);
        });

        Schema::create('game_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('game_polls')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('vote', ['yes', 'no']);
            $table->timestamp('created_at');

            $table->unique(['poll_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_poll_votes');
        Schema::dropIfExists('game_polls');
    }
};
