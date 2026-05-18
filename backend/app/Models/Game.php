<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\User;

class Game extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'created_by_id',
        'status',
        'max_players',
        'current_turn_player_id',
        'turn_phase',
        'finished_at',
        'stats_recorded',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'finished_at' => 'datetime',
            'max_players' => 'integer',
            'stats_recorded' => 'boolean',
        ];
    }

    /**
     * Get the user who created the game.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * Get the current turn player.
     */
    public function currentTurnPlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'current_turn_player_id');
    }

    /**
     * Get all players in this game.
     */
    public function players(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }

    /**
     * Get all actions in this game.
     */
    public function actions(): HasMany
    {
        return $this->hasMany(GameAction::class);
    }

    /**
     * Deck rows drawn for an in-progress Ambassador exchange (status exchange_temp).
     */
    public function exchangeTempDeckCards(): HasMany
    {
        return $this->hasMany(GameDeck::class)->where('status', 'exchange_temp');
    }

    /**
     * Get the deck for this game.
     */
    public function deck(): HasMany
    {
        return $this->hasMany(GameDeck::class);
    }

    /**
     * Get all state snapshots for this game.
     */
    public function stateSnapshots(): HasMany
    {
        return $this->hasMany(GameStateSnapshot::class);
    }

    /**
     * Check if the game is waiting for players.
     */
    public function isWaiting(): bool
    {
        return $this->status === 'waiting';
    }

    /**
     * Check if the game is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the game is finished.
     */
    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    /**
     * Get active (non-eliminated) players.
     */
    public function activePlayers(): HasMany
    {
        return $this->hasMany(GamePlayer::class)->where('is_eliminated', false);
    }
}
