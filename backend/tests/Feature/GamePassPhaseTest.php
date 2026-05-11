<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Game;
use App\Models\GameAction;
use App\Models\GameActionPhasePass;
use App\Models\GamePlayer;
use App\Models\User;
use App\Services\GameService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class GamePassPhaseTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    protected function migrateFreshUsing()
    {
        return array_merge(
            [
                '--drop-views' => $this->shouldDropViews(),
                '--drop-types' => $this->shouldDropTypes(),
                '--force' => true,
            ],
            $this->seeder() ? ['--seeder' => $this->seeder()] : ['--seed' => $this->shouldSeed()]
        );
    }

    protected function createGameWithPlayers(int $count): array
    {
        $users = [];
        for ($i = 0; $i < $count; $i++) {
            $users[] = User::query()->create([
                'username' => 't'.$i.'_'.uniqid(),
                'email' => 't'.$i.'_'.uniqid().'@example.com',
                'password' => Hash::make('password'),
                'coins_balance' => 0,
            ]);
        }

        $game = Game::query()->create([
            'created_by_id' => $users[0]->id,
            'status' => 'in_progress',
            'max_players' => 6,
            'current_turn_player_id' => null,
            'turn_phase' => 'challenge',
        ]);

        $players = [];
        foreach ($users as $i => $user) {
            $players[] = GamePlayer::query()->create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'seat_number' => $i + 1,
                'coins' => 5,
                'is_eliminated' => false,
                'is_ready' => true,
            ]);
        }

        $game->current_turn_player_id = $players[0]->id;
        $game->save();

        return [$game, $players];
    }

    public function test_action_claim_requires_all_eligible_passes_before_resolution(): void
    {
        [$game, $players] = $this->createGameWithPlayers(4);
        $game->turn_phase = 'challenge';
        $game->save();

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_TAX,
            'target_player_id' => null,
            'claimed_character' => 'Duke',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->passPhase($game->fresh(), $players[1]);
        $this->assertSame('challenge', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[2]);
        $this->assertSame('challenge', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[3]);
        $this->assertSame('resolution', $game->fresh()->turn_phase);

        $this->assertSame(0, GameActionPhasePass::query()->where('game_action_id', $action->id)->count());
    }

    public function test_block_claim_requires_all_eligible_passes_before_blocked_resolution(): void
    {
        [$game, $players] = $this->createGameWithPlayers(4);
        $game->turn_phase = 'challenge';
        $game->save();

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_STEAL,
            'target_player_id' => $players[3]->id,
            'claimed_character' => 'Captain',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        Block::query()->create([
            'game_action_id' => $action->id,
            'blocker_id' => $players[3]->id,
            'claimed_character' => 'Captain',
            'was_challenged' => false,
            'outcome' => 'successful',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->passPhase($game->fresh(), $players[0]);
        $this->assertSame('challenge', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[1]);
        $this->assertSame('challenge', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[2]);
        $this->assertSame('resolution', $game->fresh()->turn_phase);
        $this->assertSame('blocked', $action->fresh()->status);

        $this->assertSame(0, GameActionPhasePass::query()->where('game_action_id', $action->id)->count());
    }

    public function test_foreign_aid_block_declaration_requires_all_non_actor_passes(): void
    {
        [$game, $players] = $this->createGameWithPlayers(4);
        $game->turn_phase = 'block';
        $game->save();

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_FOREIGN_AID,
            'target_player_id' => null,
            'claimed_character' => null,
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->passPhase($game->fresh(), $players[1]);
        $this->assertSame('block', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[2]);
        $this->assertSame('block', $game->fresh()->turn_phase);

        $service->passPhase($game->fresh(), $players[3]);
        $this->assertSame('resolution', $game->fresh()->turn_phase);

        $this->assertSame(0, GameActionPhasePass::query()->where('game_action_id', $action->id)->count());
    }

    public function test_steal_block_declaration_only_target_pass_advances(): void
    {
        [$game, $players] = $this->createGameWithPlayers(4);
        $game->turn_phase = 'block';
        $game->save();

        GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_STEAL,
            'target_player_id' => $players[3]->id,
            'claimed_character' => 'Captain',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->passPhase($game->fresh(), $players[3]);
        $this->assertSame('resolution', $game->fresh()->turn_phase);
    }

    public function test_second_challenge_while_reveal_pending_is_rejected(): void
    {
        [$game, $players] = $this->createGameWithPlayers(3);
        $game->turn_phase = 'challenge';
        $game->save();

        $action = GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_TAX,
            'target_player_id' => null,
            'claimed_character' => 'Duke',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->submitChallenge($action, $players[1]->id);

        $this->expectException(ValidationException::class);
        $service->submitChallenge($action, $players[2]->id);
    }

    public function test_pass_is_idempotent_for_same_player(): void
    {
        [$game, $players] = $this->createGameWithPlayers(4);
        $game->turn_phase = 'challenge';
        $game->save();

        GameAction::query()->create([
            'game_id' => $game->id,
            'player_id' => $players[0]->id,
            'action_type' => GameService::ACTION_TAX,
            'target_player_id' => null,
            'claimed_character' => 'Duke',
            'coins_cost' => 0,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $service = app(GameService::class);

        $service->passPhase($game->fresh(), $players[1]);
        $service->passPhase($game->fresh(), $players[1]);

        $this->assertSame('challenge', $game->fresh()->turn_phase);
    }
}
