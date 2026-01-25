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
        Schema::create('game_deck', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->enum('card_type', ['Duke', 'Assassin', 'Captain', 'Ambassador', 'Contessa']);
            $table->enum('status', ['in_deck', 'in_hand', 'discarded'])->default('in_deck');
            $table->timestamp('created_at');
            
            $table->index(['game_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_deck');
    }
};
