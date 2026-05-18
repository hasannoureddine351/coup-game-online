<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerStat extends Model
{
    protected $fillable = [
        'user_id',
        'games_played',
        'games_won',
        'successful_bluffs',
        'failed_bluffs',
        'misleading_reveals',
        'correct_challenges',
        'incorrect_challenges',
        'allied_challenges_received',
        'allied_challenges_made',
        'polls_created',
        'incitement_polls_created',
        'poll_yes_votes_received',
        'poll_votes_received',
    ];

    protected function casts(): array
    {
        return [
            'games_played' => 'integer',
            'games_won' => 'integer',
            'successful_bluffs' => 'integer',
            'failed_bluffs' => 'integer',
            'misleading_reveals' => 'integer',
            'correct_challenges' => 'integer',
            'incorrect_challenges' => 'integer',
            'allied_challenges_received' => 'integer',
            'allied_challenges_made' => 'integer',
            'polls_created' => 'integer',
            'incitement_polls_created' => 'integer',
            'poll_yes_votes_received' => 'integer',
            'poll_votes_received' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
