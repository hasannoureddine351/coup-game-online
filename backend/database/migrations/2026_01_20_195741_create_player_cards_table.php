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
        Schema::create('player_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_player_id')->constrained('game_players')->cascadeOnDelete();
            $table->enum('card_type', ['Duke', 'Assassin', 'Captain', 'Ambassador', 'Contessa']);
            $table->boolean('is_revealed')->default(false);
            $table->boolean('is_discarded')->default(false);
            $table->unsignedTinyInteger('position'); // 1 or 2
            $table->timestamp('created_at');
            
            $table->index(['game_player_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_cards');
    }
};
