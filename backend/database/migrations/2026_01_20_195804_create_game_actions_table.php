<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('game_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('game_players')->cascadeOnDelete();
            $table->enum('action_type', ['Income', 'Foreign_Aid', 'Coup', 'Tax', 'Assassinate', 'Steal', 'Exchange']);
            $table->foreignId('target_player_id')->nullable()->constrained('game_players')->nullOnDelete();
            $table->string('claimed_character')->nullable(); // Character claimed for this action
            $table->unsignedInteger('coins_cost')->default(0);
            $table->enum('status', ['pending', 'completed', 'blocked', 'challenged'])->default('pending');
            $table->timestamp('created_at');
            
            $table->index(['game_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_actions');
    }
};
