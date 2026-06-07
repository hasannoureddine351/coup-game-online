<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamePoll extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'game_id',
        'created_by_user_id',
        'actor_player_id',
        'action_type',
        'target_player_id',
        'status',
        'closes_at',
        'closed_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'closes_at' => 'datetime',
            'closed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function actorPlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'actor_player_id');
    }

    public function targetPlayer(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'target_player_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(GamePollVote::class, 'poll_id');
    }
}
