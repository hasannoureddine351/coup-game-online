<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Challenge extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_action_id',
        'challenger_id',
        'challenged_player_id',
        'outcome',
        'revealed_card_type',
        'created_at',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the game action this challenge is for.
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
     * Get the player who issued the challenge.
     */
    public function challenger(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'challenger_id');
    }

    /**
     * Get the player who was challenged.
     */
    public function challengedPlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'challenged_player_id');
    }

    /**
     * Check if challenger won.
     */
    public function challengerWon(): bool
    {
        return $this->outcome === 'challenger_wins';
    }

    /**
     * Check if challenged player won.
     */
    public function challengedWon(): bool
    {
        return $this->outcome === 'challenged_wins';
    }

    /**
     * Check if challenge is resolved.
     */
    public function isResolved(): bool
    {
        return $this->outcome !== null;
    }
}
