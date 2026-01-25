<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GameAction extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_id',
        'player_id',
        'action_type',
        'target_player_id',
        'claimed_character',
        'coins_cost',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'coins_cost' => 'integer',
        ];
    }

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the game this action belongs to.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Get the player who performed this action.
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'player_id');
    }

    /**
     * Get the target player (if applicable).
     */
    public function targetPlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'target_player_id');
    }

    /**
     * Get the challenge for this action (if any).
     */
    public function challenge(): HasOne
    {
        return $this->hasOne(Challenge::class);
    }

    /**
     * Get the block for this action (if any).
     */
    public function block(): HasOne
    {
        return $this->hasOne(Block::class);
    }

    /**
     * Check if action is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if action is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if action is blocked.
     */
    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    /**
     * Check if action is challenged.
     */
    public function isChallenged(): bool
    {
        return $this->status === 'challenged';
    }

    /**
     * Get action type constants.
     */
    public const ACTION_TYPES = [
        'Income',
        'Foreign_Aid',
        'Coup',
        'Tax',
        'Assassinate',
        'Steal',
        'Exchange',
    ];
}
