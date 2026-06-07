<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $minGames = max((int) $request->query('min_games', 1), 0);

        $query = PlayerStat::query()
            ->with('user:id,username')
            ->where('games_played', '>=', $minGames)
            ->orderByDesc('games_won')
            ->orderByDesc('games_played');

        $paginator = $query->paginate($perPage);

        $startRank = $paginator->firstItem() ?? 1;

        $data = collect($paginator->items())->values()->map(function (PlayerStat $stat, int $index) use ($startRank) {
            $bluffAttempts = $stat->successful_bluffs + $stat->failed_bluffs;
            $challengeAttempts = $stat->correct_challenges + $stat->incorrect_challenges;
            $pollVotes = $stat->poll_votes_received;

            return [
                'rank' => $startRank + $index,
                'user_id' => $stat->user_id,
                'username' => $stat->user?->username,
                'games_played' => $stat->games_played,
                'games_won' => $stat->games_won,
                'win_rate' => $stat->games_played > 0
                    ? round($stat->games_won / $stat->games_played * 100, 1)
                    : 0,
                'bluff_rate' => $bluffAttempts > 0
                    ? round($stat->successful_bluffs / $bluffAttempts * 100, 1)
                    : 0,
                'challenge_accuracy' => $challengeAttempts > 0
                    ? round($stat->correct_challenges / $challengeAttempts * 100, 1)
                    : 0,
                'poll_agreement_rate' => $pollVotes > 0
                    ? round($stat->poll_yes_votes_received / $pollVotes * 100, 1)
                    : 0,
                'stats' => [
                    'successful_bluffs' => $stat->successful_bluffs,
                    'failed_bluffs' => $stat->failed_bluffs,
                    'misleading_reveals' => $stat->misleading_reveals,
                    'correct_challenges' => $stat->correct_challenges,
                    'incorrect_challenges' => $stat->incorrect_challenges,
                    'allied_challenges_received' => $stat->allied_challenges_received,
                    'allied_challenges_made' => $stat->allied_challenges_made,
                    'polls_created' => $stat->polls_created,
                    'incitement_polls_created' => $stat->incitement_polls_created,
                    'poll_yes_votes_received' => $stat->poll_yes_votes_received,
                    'poll_votes_received' => $stat->poll_votes_received,
                ],
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
