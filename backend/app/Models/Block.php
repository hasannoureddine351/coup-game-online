<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Block extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_action_id',
        'blocker_id',
        'claimed_character',
        'was_challenged',
        'outcome',
        'created_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'was_challenged' => 'boolean',
        ];
    }

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the game action this block is for.
     */
    public function gameAction(): BelongsTo
    {
        return $this->belongsTo(GameAction::class, 'game_action_id');
    }

    /** Alias for {@see gameAction()} — events and API payloads use `action`. */
    public function action(): BelongsTo
    {
        return $this->belongsTo(GameAction::class, 'game_action_id');
    }

    /**
     * Get the player who issued the block.
     */
    public function blocker(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'blocker_id');
    }

    /**
     * Check if block was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->outcome === 'successful';
    }

    /**
     * Check if block failed.
     */
    public function isFailed(): bool
    {
        return $this->outcome === 'failed';
    }

    /**
     * Check if block was challenged.
     */
    public function isChallenged(): bool
    {
        return $this->was_challenged || $this->outcome === 'challenged';
    }

    /**
     * Check if block is resolved.
     */
    public function isResolved(): bool
    {
        return $this->outcome !== null;
    }
}
