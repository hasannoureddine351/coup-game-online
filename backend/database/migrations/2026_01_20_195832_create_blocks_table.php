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
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_action_id')->constrained('game_actions')->cascadeOnDelete();
            $table->foreignId('blocker_id')->constrained('game_players')->cascadeOnDelete();
            $table->string('claimed_character'); // Character used to block
            $table->boolean('was_challenged')->default(false);
            $table->enum('outcome', ['successful', 'failed', 'challenged'])->nullable();
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blocks');
    }
};
