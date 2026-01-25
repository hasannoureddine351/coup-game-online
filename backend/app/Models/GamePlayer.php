<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamePlayer extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_id',
        'user_id',
        'seat_number',
        'coins',
        'is_eliminated',
        'is_ready',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'coins' => 'integer',
            'seat_number' => 'integer',
            'is_eliminated' => 'boolean',
            'is_ready' => 'boolean',
        ];
    }

    /**
     * Get the game this player belongs to.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Get the user this player represents.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all cards for this player.
     */
    public function cards(): HasMany
    {
        return $this->hasMany(PlayerCard::class);
    }

    /**
     * Get active (non-discarded, non-revealed) cards.
     */
    public function activeCards(): HasMany
    {
        return $this->hasMany(PlayerCard::class)
            ->where('is_revealed', false)
            ->where('is_discarded', false);
    }

    /**
     * Get actions performed by this player.
     */
    public function actions(): HasMany
    {
        return $this->hasMany(GameAction::class, 'player_id');
    }

    /**
     * Get actions targeted at this player.
     */
    public function targetedActions(): HasMany
    {
        return $this->hasMany(GameAction::class, 'target_player_id');
    }

    /**
     * Get challenges issued by this player.
     */
    public function challengesIssued(): HasMany
    {
        return $this->hasMany(Challenge::class, 'challenger_id');
    }

    /**
     * Get challenges received by this player.
     */
    public function challengesReceived(): HasMany
    {
        return $this->hasMany(Challenge::class, 'challenged_player_id');
    }

    /**
     * Get blocks issued by this player.
     */
    public function blocks(): HasMany
    {
        return $this->hasMany(Block::class, 'blocker_id');
    }

    /**
     * Check if player is active (not eliminated).
     */
    public function isActive(): bool
    {
        return !$this->is_eliminated;
    }

    /**
     * Get the number of active cards (influence).
     */
    public function getInfluenceCountAttribute(): int
    {
        return $this->activeCards()->count();
    }
}
