<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameDeck extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'game_deck';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_id',
        'card_type',
        'status',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the game this deck card belongs to.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Check if card is in deck.
     */
    public function isInDeck(): bool
    {
        return $this->status === 'in_deck';
    }

    /**
     * Check if card is in hand.
     */
    public function isInHand(): bool
    {
        return $this->status === 'in_hand';
    }

    /**
     * Check if card is discarded.
     */
    public function isDiscarded(): bool
    {
        return $this->status === 'discarded';
    }

    /**
     * Get card type constants.
     */
    public const CARD_TYPES = [
        'Duke',
        'Assassin',
        'Captain',
        'Ambassador',
        'Contessa',
    ];
}
