<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Challenge;
use App\Models\Game;
use App\Models\GameAction;
use App\Models\GamePlayer;
use App\Models\PlayerCard;
use App\Models\User;
use App\Services\GameService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class GameBlockChallengeFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Game, 1: list<GamePlayer>}
     */
    protected function createGameWithPlayers(int $count): array
    {
        $users = [];
        for ($i = 0; $i < $count; $i++) {
            $users[] = User::query()->create([
                'username' => 'b'.$i.'_'.uniqid(),
                'email' => 'b'.$i.'_'.uniqid().'@example.com',
                'password' => Hash::make('password'),
                'coins_balance' => 0,
            ]);
        }

        $game = Game::query()->create([
            'created_by_id' => $users[0]->id,
            'status' => 'in_progress',
            'max_players' => 6,
            'current_turn_player_id' => null,
            'turn_phase' => 'action',
        ]);

        $players = [];
        foreach ($users as $i => $user) {
            $players[] = GamePlayer::query()->create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'seat_number' => $i + 1,
                'coins' => 10,
                'is_eliminated' => false,
                'is_ready' => true,
            ]);
        }

        $game->current_turn_player_id = $players[0]->id;
        $game->save();

        return [$game, $players];
    }

    /**
     * @return list<PlayerCard>
     */
    protected function dealInfluence(GamePlayer $player, array $types): array
    {
        $cards = [];
        foreach ($types as $i => $type) {
            $cards[] = PlayerCard::query()->create([
                'game_player_id' => $player->id,
                'card_type' => $type,
                'position' => $i,
                'is_revealed' => false,
                'is_discarded' => false,
                'created_at' => now(),
            ]);
        }

        return $cards;
    }

    public function test_action_claim_challenge_success_on_assassinate_enters_block_phase(): void
    {
        [$game, $players] = $this->createGameWithPlayers(3);
        $p1 = $players[0];
        $p2 = $players[1];
        $p3 = $players[2];

        $this->dealInfluence($p1, ['Assassin', 'Duke']);
        $this->dealInfluence($p2, ['Contessa', 'Captain']);
        $this->dealInfluence($p3, ['Ambassador', 'Duke']);

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $p1->id,
            'action_type' => GameService::ACTION_ASSASSINATE,
            'target_player_id' => $p2->id,
            'claimed_character' => 'Assassin',
            'coins_cost' => 3,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $game->turn_phase = 'challenge';
        $game->save();

        $service = app(GameService::class);
        $service->submitChallenge($action, $p3->id);

        $assassinCard = $p1->cards()->where('card_type', 'Assassin')->firstOrFail();
        $service->revealChallengeCard($action->fresh(), $p1, $assassinCard->id);

        $this->assertSame('block', $game->fresh()->turn_phase);
    }

    public function test_cannot_challenge_action_claim_during_block_phase(): void
    {
        [$game, $players] = $this->createGameWithPlayers(3);

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_STEAL,
            'target_player_id' => $players[1]->id,
            'claimed_character' => 'Captain',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $game->turn_phase = 'block';
        $game->save();

        $service = app(GameService::class);

        $this->expectException(ValidationException::class);
        $service->submitChallenge($action, $players[2]->id);
    }

    public function test_assassinate_block_challenge_fail_then_resolve_kills_target(): void
    {
        [$game, $players] = $this->createGameWithPlayers(2);
        $p1 = $players[0];
        $p2 = $players[1];

        $p1Cards = $this->dealInfluence($p1, ['Assassin', 'Duke']);
        $p2Cards = $this->dealInfluence($p2, ['Duke', 'Captain']);

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $p1->id,
            'action_type' => GameService::ACTION_ASSASSINATE,
            'target_player_id' => $p2->id,
            'claimed_character' => 'Assassin',
            'coins_cost' => 3,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $game->turn_phase = 'block';
        $game->save();

        $service = app(GameService::class);
        $service->submitBlock($action, $p2->id, 'Contessa');

        $block = Block::query()->where('game_action_id', $action->id)->firstOrFail();
        $this->assertFalse($block->was_challenged);

        $service->submitBlockChallenge($block, $p1->id);

        $service->revealChallengeCard($action->fresh(['block']), $p2, $p2Cards[0]->id);

        $game->refresh();
        $this->assertSame('resolution', $game->turn_phase);
        $block->refresh();
        $this->assertSame('failed', $block->outcome);

        $p2->refresh();
        $this->assertTrue($p2->cards()->where('is_revealed', true)->exists());

        $service->resolveAction($action->fresh());

        $p2->refresh();
        $revealedCount = $p2->cards()->where('is_revealed', true)->count();
        $this->assertGreaterThanOrEqual(2, $revealedCount);
    }

    public function test_assassinate_block_passed_by_actor_blocks_assassination(): void
    {
        [$game, $players] = $this->createGameWithPlayers(2);
        $p1 = $players[0];
        $p2 = $players[1];

        $this->dealInfluence($p1, ['Assassin', 'Duke']);
        $this->dealInfluence($p2, ['Contessa', 'Captain']);

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $p1->id,
            'action_type' => GameService::ACTION_ASSASSINATE,
            'target_player_id' => $p2->id,
            'claimed_character' => 'Assassin',
            'coins_cost' => 3,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        Block::query()->create([
            'game_action_id' => $action->id,
            'blocker_id' => $p2->id,
            'claimed_character' => 'Contessa',
            'was_challenged' => false,
            'outcome' => 'successful',
            'created_at' => now(),
        ]);

        $game->turn_phase = 'challenge';
        $game->save();

        $service = app(GameService::class);
        $service->passPhase($game->fresh(), $p1);

        $action->refresh();
        $this->assertSame('blocked', $action->status);
        $this->assertSame('resolution', $game->fresh()->turn_phase);

        $hiddenBefore = $p2->cards()->where('is_revealed', false)->where('is_discarded', false)->count();
        $service->resolveAction($action->fresh());
        $hiddenAfter = $p2->fresh()->cards()->where('is_revealed', false)->where('is_discarded', false)->count();

        $this->assertSame($hiddenBefore, $hiddenAfter);
    }

    public function test_steal_action_claim_pass_advances_to_block_phase(): void
    {
        [$game, $players] = $this->createGameWithPlayers(3);

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_STEAL,
            'target_player_id' => $players[2]->id,
            'claimed_character' => 'Captain',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $game->turn_phase = 'challenge';
        $game->save();

        $service = app(GameService::class);
        $service->passPhase($game->fresh(), $players[1]);
        $this->assertSame('challenge', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[2]);
        $this->assertSame('block', $game->fresh()->turn_phase);
    }
}
