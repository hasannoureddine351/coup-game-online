<?php

namespace App\Support;

use Closure;

/**
 * Eager-load helpers for game actions.
 */
final class ActionEagerLoad
{
    /**
     * Constrain the `action.challenge` hasOne so it returns the *pending*
     * (unresolved) challenge first.
     *
     * An action can have two challenge rows: the action-claim challenge and a
     * later block-claim challenge (see GameService::submitBlockChallenge). A
     * plain hasOne returns the oldest (already-resolved) one, which hides the
     * challenge currently awaiting a card reveal and soft-locks the game UI.
     * Ordering unresolved challenges first surfaces the one clients must act on.
     *
     * @param  array<int, string>|null  $userColumns  optional column subset for
     *         the nested user relations (keeps broadcast payloads small).
     */
    public static function pendingChallengeFirst(?array $userColumns = null): Closure
    {
        return function ($query) use ($userColumns) {
            $query
                ->orderByRaw('CASE WHEN outcome IS NULL THEN 0 ELSE 1 END')
                ->orderByDesc('id')
                ->with([
                    'challenger.user' => function ($q) use ($userColumns) {
                        if ($userColumns) {
                            $q->select($userColumns);
                        }
                    },
                    'challengedPlayer.user' => function ($q) use ($userColumns) {
                        if ($userColumns) {
                            $q->select($userColumns);
                        }
                    },
                ]);
        };
    }
}
