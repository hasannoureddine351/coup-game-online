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
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_action_id')->constrained('game_actions')->cascadeOnDelete();
            $table->foreignId('challenger_id')->constrained('game_players')->cascadeOnDelete();
            $table->foreignId('challenged_player_id')->constrained('game_players')->cascadeOnDelete();
            $table->enum('outcome', ['challenger_wins', 'challenged_wins'])->nullable();
            $table->string('revealed_card_type')->nullable();
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
