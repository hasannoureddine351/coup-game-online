<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameActionPhasePass extends Model
{
    public const ROUND_ACTION_CLAIM = 'action_claim';

    public const ROUND_BLOCK_DECLARATION = 'block_declaration';

    public const ROUND_BLOCK_CLAIM = 'block_claim';

    protected $fillable = [
        'game_action_id',
        'pass_round',
        'game_player_id',
        'created_at',
    ];

    public $timestamps = false;

    public function gameAction(): BelongsTo
    {
        return $this->belongsTo(GameAction::class, 'game_action_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(GamePlayer::class, 'game_player_id');
    }
}
