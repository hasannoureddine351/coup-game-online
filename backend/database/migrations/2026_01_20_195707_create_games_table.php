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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->enum('status', ['waiting', 'in_progress', 'finished', 'cancelled'])->default('waiting');
            $table->unsignedTinyInteger('max_players')->default(6);
            $table->unsignedBigInteger('current_turn_player_id')->nullable();
            $table->enum('turn_phase', ['action', 'challenge', 'block', 'resolution'])->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
