<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerCard extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_player_id',
        'card_type',
        'is_revealed',
        'is_discarded',
        'position',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_revealed' => 'boolean',
            'is_discarded' => 'boolean',
            'position' => 'integer',
        ];
    }

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the game player this card belongs to.
     */
    public function gamePlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class);
    }

    /**
     * Check if the card is active (not revealed and not discarded).
     */
    public function isActive(): bool
    {
        return !$this->is_revealed && !$this->is_discarded;
    }

    /**
     * Get the card type constants.
     */
    public const CARD_TYPES = [
        'Duke',
        'Assassin',
        'Captain',
        'Ambassador',
        'Contessa',
    ];
}
