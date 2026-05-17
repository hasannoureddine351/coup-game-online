<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GameDeck;
use App\Models\PlayerCard;
use App\Models\GameAction;
use App\Models\GameActionPhasePass;
use App\Models\Challenge;
use App\Models\Block;
use App\Support\GameStateBroadcaster;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GameService
{
    const CARD_TYPES = ['Duke', 'Assassin', 'Captain', 'Ambassador', 'Contessa'];
    const CARDS_PER_TYPE = 3;
    const STARTING_COINS = 2;
    const CARDS_PER_PLAYER = 2;

    const ACTION_INCOME = 'Income';
    const ACTION_FOREIGN_AID = 'Foreign_Aid';
    const ACTION_TAX = 'Tax';
    const ACTION_ASSASSINATE = 'Assassinate';
    const ACTION_STEAL = 'Steal';
    const ACTION_EXCHANGE = 'Exchange';
    const ACTION_COUP = 'Coup';

    public function startGame(Game $game, int $userId): Game
    {
        if ($game->status !== 'waiting') {
            throw ValidationException::withMessages(['game' => 'Game has already started or finished']);
        }

        $players = $game->players;
        if ($players->count() < 2) {
            throw ValidationException::withMessages(['game' => 'Need at least 2 players to start']);
        }

        $creator = $players->firstWhere('user_id', $userId);
        if (!$creator) {
            throw ValidationException::withMessages(['game' => 'Only players in the game can start it']);
        }

        if (!$players->every(fn($p) => $p->is_ready)) {
            throw ValidationException::withMessages(['game' => 'All players must be ready']);
        }

        DB::transaction(function () use ($game, $players) {
            $this->initializeDeck($game);
            $this->dealCards($game, $players);
            
            foreach ($players as $player) {
                $player->coins = self::STARTING_COINS;
                $player->save();
            }

            $game->status = 'in_progress';
            $game->current_turn_player_id = $players->first()->id;
            $game->turn_phase = 'action';
            $game->save();
        });

        return $game->fresh(['players.user', 'players.cards', 'deck']);
    }

    protected function initializeDeck(Game $game): void
    {
        $deck = [];
        foreach (self::CARD_TYPES as $cardType) {
            for ($i = 0; $i < self::CARDS_PER_TYPE; $i++) {
                $deck[] = ['card_type' => $cardType, 'status' => 'in_deck'];
            }
        }

        shuffle($deck);

        foreach ($deck as $card) {
            GameDeck::create([
                'game_id' => $game->id,
                'card_type' => $card['card_type'],
                'status' => $card['status'],
                'created_at' => now(),
            ]);
        }
    }

    protected function dealCards(Game $game, $players): void
    {
        $availableCards = GameDeck::where('game_id', $game->id)
            ->where('status', 'in_deck')
            ->get();

        $position = 0;
        foreach ($players as $player) {
            for ($i = 0; $i < self::CARDS_PER_PLAYER; $i++) {
                $deckCard = $availableCards->shift();
                
                PlayerCard::create([
                    'game_player_id' => $player->id,
                    'card_type' => $deckCard->card_type,
                    'position' => $position++,
                    'is_revealed' => false,
                    'is_discarded' => false,
                    'created_at' => now(),
                ]);

                $deckCard->status = 'in_hand';
                $deckCard->save();
            }
        }
    }

    public function submitAction(Game $game, int $playerId, array $actionData): GameAction
    {
        $player = GamePlayer::findOrFail($playerId);

        if ($game->status !== 'in_progress') {
            throw ValidationException::withMessages(['game' => 'Game is not in progress']);
        }

        if ($game->current_turn_player_id !== $player->id) {
            throw ValidationException::withMessages(['action' => 'Not your turn']);
        }

        if ($game->turn_phase !== 'action') {
            throw ValidationException::withMessages(['action' => 'Not in action phase']);
        }

        if ($player->is_eliminated) {
            throw ValidationException::withMessages(['action' => 'You are eliminated']);
        }

        $this->validateAction($game, $player, $actionData);

        $action = GameAction::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'action_type' => $actionData['action_type'],
            'target_player_id' => $actionData['target_player_id'] ?? null,
            'claimed_character' => $actionData['claimed_character'] ?? null,
            'coins_cost' => $this->getActionCost($actionData['action_type']),
            'status' => 'pending',
            'created_at' => now(),
        ]);

        if ($actionData['action_type'] === self::ACTION_COUP) {
            $game->turn_phase = 'resolution';
        } else if (in_array($actionData['action_type'], [self::ACTION_TAX, self::ACTION_ASSASSINATE, self::ACTION_STEAL, self::ACTION_EXCHANGE])) {
            $game->turn_phase = 'challenge';
        } else if ($actionData['action_type'] === self::ACTION_FOREIGN_AID) {
            $game->turn_phase = 'block';
        } else {
            $game->turn_phase = 'resolution';
        }
        
        $game->save();

        return $action->fresh(['player.user', 'targetPlayer.user']);
    }

    protected function validateAction(Game $game, GamePlayer $player, array $actionData): void
    {
        $actionType = $actionData['action_type'];
        $cost = $this->getActionCost($actionType);

        if ($cost > $player->coins) {
            throw ValidationException::withMessages(['action' => "Not enough coins. Need {$cost}, have {$player->coins}"]);
        }

        if ($player->coins >= 10 && $actionType !== self::ACTION_COUP) {
            throw ValidationException::withMessages(['action' => 'Must coup when you have 10 or more coins']);
        }

        if (in_array($actionType, [self::ACTION_ASSASSINATE, self::ACTION_STEAL, self::ACTION_COUP])) {
            if (!isset($actionData['target_player_id'])) {
                throw ValidationException::withMessages(['action' => 'Target player required']);
            }

            $target = $game->players()->find($actionData['target_player_id']);
            if (!$target || $target->is_eliminated) {
                throw ValidationException::withMessages(['action' => 'Invalid target player']);
            }
        }
    }

    protected function getActionCost(string $actionType): int
    {
        return match($actionType) {
            self::ACTION_ASSASSINATE => 3,
            self::ACTION_COUP => 7,
            default => 0
        };
    }

    public function submitChallenge(GameAction $action, int $challengerId): Challenge
    {
        $game = $action->game;

        $this->syncChallengeRevealPhase($game);
        // Do not refresh() $game — it clears loaded relations; sync() already persisted turn_phase when needed.

        $challenger = $game->players()->find($challengerId);
        if (! $challenger || $challenger->is_eliminated) {
            throw ValidationException::withMessages(['challenge' => 'Invalid challenger']);
        }

        if ($challenger->id === $action->player_id) {
            throw ValidationException::withMessages(['challenge' => 'Cannot challenge your own action']);
        }

        $challengedPlayer = $action->player;

        if (! $action->claimed_character) {
            throw ValidationException::withMessages(['challenge' => 'This action has no claim to challenge']);
        }

        return DB::transaction(function () use ($action, $challenger, $challengedPlayer, $game) {
            $lockedGame = Game::query()->where('id', $game->id)->lockForUpdate()->firstOrFail();

            $this->syncChallengeRevealPhase($lockedGame);

            if (Challenge::query()->where('game_action_id', $action->id)->whereNull('outcome')->exists()) {
                throw ValidationException::withMessages(['challenge' => 'A challenge is already waiting for a reveal.']);
            }

            if ($lockedGame->turn_phase !== 'challenge' && $lockedGame->turn_phase !== 'block') {
                throw ValidationException::withMessages(['challenge' => 'Not in challenge phase']);
            }

            $challenge = Challenge::create([
                'game_action_id' => $action->id,
                'challenger_id' => $challenger->id,
                'challenged_player_id' => $challengedPlayer->id,
                'outcome' => null,
                'revealed_card_type' => null,
                'created_at' => now(),
            ]);

            $this->deletePhasePassesForAction($action);

            $lockedGame->turn_phase = 'challenge_reveal';
            $lockedGame->save();

            return $challenge->fresh(['challenger.user', 'challengedPlayer.user']);
        });
    }

    public function submitBlock(GameAction $action, int $blockerId, string $claimedCharacter): Block
    {
        $game = $action->game;

        $blocker = $game->players()->find($blockerId);
        if (! $blocker || $blocker->is_eliminated) {
            throw ValidationException::withMessages(['block' => 'Invalid blocker']);
        }

        if ($blocker->id === $action->player_id) {
            throw ValidationException::withMessages(['block' => 'Cannot block your own action']);
        }

        if (! $this->canBlockAction($action->action_type, $claimedCharacter)) {
            throw ValidationException::withMessages(['block' => 'This character cannot block this action']);
        }

        if (in_array($action->action_type, [self::ACTION_ASSASSINATE, self::ACTION_STEAL], true)) {
            if (! $action->target_player_id || (int) $blocker->id !== (int) $action->target_player_id) {
                throw ValidationException::withMessages(['block' => 'Only the target player can block this action.']);
            }
        }

        return DB::transaction(function () use ($action, $blocker, $claimedCharacter, $game) {
            $lockedGame = Game::query()->where('id', $game->id)->lockForUpdate()->firstOrFail();

            if ($lockedGame->turn_phase !== 'block') {
                throw ValidationException::withMessages(['block' => 'Not in block phase']);
            }

            $block = Block::create([
                'game_action_id' => $action->id,
                'blocker_id' => $blocker->id,
                'claimed_character' => $claimedCharacter,
                'was_challenged' => false,
                'outcome' => 'successful',
                'created_at' => now(),
            ]);

            $this->deletePhasePassesForAction($action);

            $lockedGame->turn_phase = 'challenge';
            $lockedGame->save();

            return $block->fresh(['blocker.user']);
        });
    }

    protected function canBlockAction(string $actionType, string $claimedCharacter): bool
    {
        $blockRules = [
            self::ACTION_FOREIGN_AID => ['Duke'],
            self::ACTION_ASSASSINATE => ['Contessa'],
            self::ACTION_STEAL => ['Captain', 'Ambassador']
        ];

        return in_array($claimedCharacter, $blockRules[$actionType] ?? []);
    }

    /**
     * Align turn_phase when a pending challenge exists but phase was not saved as challenge_reveal (DB constraint / failed save).
     */
    public function syncChallengeRevealPhase(Game $game): void
    {
        if ($game->status !== 'in_progress') {
            return;
        }

        $hasPendingReveal = Challenge::query()
            ->whereNull('outcome')
            ->whereHas('gameAction', fn ($q) => $q->where('game_id', $game->id))
            ->exists();

        if ($hasPendingReveal && $game->turn_phase !== 'challenge_reveal') {
            $game->turn_phase = 'challenge_reveal';
            $game->save();
        }
    }

    public function submitBlockChallenge(Block $block, int $challengerId): Challenge
    {
        $action = $block->gameAction;
        if (! $action) {
            throw ValidationException::withMessages(['challenge' => 'Block has no associated action.']);
        }

        $game = $action->game;

        $this->syncChallengeRevealPhase($game);

        $challenger = $game->players()->find($challengerId);
        if (! $challenger || $challenger->is_eliminated) {
            throw ValidationException::withMessages(['challenge' => 'Invalid challenger']);
        }

        $blocker = $block->blocker;

        if ($challenger->id === $blocker->id) {
            throw ValidationException::withMessages(['challenge' => 'Cannot challenge your own block']);
        }

        return DB::transaction(function () use ($action, $challenger, $blocker, $block, $game) {
            $lockedGame = Game::query()->where('id', $game->id)->lockForUpdate()->firstOrFail();

            $this->syncChallengeRevealPhase($lockedGame);

            if (Challenge::query()->where('game_action_id', $action->id)->whereNull('outcome')->exists()) {
                throw ValidationException::withMessages(['challenge' => 'A challenge is already waiting for a reveal.']);
            }

            if ($lockedGame->turn_phase !== 'challenge') {
                throw ValidationException::withMessages(['challenge' => 'Not in challenge phase']);
            }

            $challenge = Challenge::create([
                'game_action_id' => $action->id,
                'challenger_id' => $challenger->id,
                'challenged_player_id' => $blocker->id,
                'outcome' => null,
                'revealed_card_type' => null,
                'created_at' => now(),
            ]);

            $this->deletePhasePassesForAction($action);

            $block->was_challenged = true;
            $block->save();

            $lockedGame->turn_phase = 'challenge_reveal';
            $lockedGame->save();

            return $challenge->fresh(['challenger.user', 'challengedPlayer.user']);
        });
    }

    /**
     * Challenged player chooses which influence to reveal (may bluff by revealing a different card).
     */
    public function revealChallengeCard(GameAction $action, GamePlayer $player, int $playerCardId): Challenge
    {
        $game = $action->game;

        $this->syncChallengeRevealPhase($game);
        // Do not refresh() — sync() already updated turn_phase on this $game instance when healing stuck state.

        if ($game->turn_phase !== 'challenge_reveal') {
            throw ValidationException::withMessages(['reveal' => 'Cannot reveal a card right now.']);
        }

        $challenge = Challenge::query()
            ->where('game_action_id', $action->id)
            ->whereNull('outcome')
            ->first();

        if (! $challenge) {
            throw ValidationException::withMessages(['reveal' => 'No pending challenge to resolve.']);
        }

        if ((int) $challenge->challenged_player_id !== (int) $player->id) {
            throw ValidationException::withMessages(['reveal' => 'Only the challenged player may reveal a card.']);
        }

        $card = $player->cards()
            ->where('id', $playerCardId)
            ->where('is_revealed', false)
            ->where('is_discarded', false)
            ->first();

        if (! $card) {
            throw ValidationException::withMessages(['reveal' => 'Invalid card.']);
        }

        $block = $action->block;
        $isActionClaimChallenge = (int) $challenge->challenged_player_id === (int) $action->player_id;

        $claimedCharacter = $isActionClaimChallenge
            ? $action->claimed_character
            : ($block?->claimed_character);

        if (! $claimedCharacter) {
            throw ValidationException::withMessages(['reveal' => 'Invalid challenge state.']);
        }

        $revealedMatchesClaim = (string) $card->card_type === (string) $claimedCharacter;

        $card->is_revealed = true;
        $card->save();

        $challenge->revealed_card_type = $card->card_type;

        $challenger = $game->players()->find($challenge->challenger_id);
        if (! $challenger) {
            throw ValidationException::withMessages(['reveal' => 'Invalid challenger.']);
        }

        if ($revealedMatchesClaim) {
            $challenge->outcome = 'challenged_wins';
            $challenge->save();

            if ($isActionClaimChallenge) {
                $this->exchangeCard($player, $card, $game);
                $this->loseInfluence($challenger, $game);
                $game->turn_phase = 'resolution';
                $game->save();
            } else {
                if (! $block) {
                    throw ValidationException::withMessages(['reveal' => 'Invalid block state.']);
                }
                $this->exchangeCard($player, $card, $game);
                $this->loseInfluence($challenger, $game);
                $block->outcome = 'successful';
                $block->save();
                $action->status = 'blocked';
                $action->save();
                $this->advanceTurn($game);
            }
        } else {
            $challenge->outcome = 'challenger_wins';
            $challenge->save();

            if ($player->cards()->where('is_revealed', false)->where('is_discarded', false)->count() === 0) {
                $player->is_eliminated = true;
                $player->save();
            }
            $this->checkWinCondition($game);

            $game->refresh();

            if ($game->status === 'finished') {
                return $challenge->fresh(['challenger.user', 'challengedPlayer.user']);
            }

            if ($isActionClaimChallenge) {
                $action->status = 'challenged';
                $action->save();
                $this->advanceTurn($game);
            } else {
                if (! $block) {
                    throw ValidationException::withMessages(['reveal' => 'Invalid block state.']);
                }
                $block->outcome = 'failed';
                $block->save();
                $game->turn_phase = 'resolution';
                $game->save();
            }
        }

        return $challenge->fresh(['challenger.user', 'challengedPlayer.user']);
    }

    public function resolveAction(GameAction $action): void
    {
        $game = $action->game;

        if ($game->turn_phase === 'challenge_reveal') {
            throw ValidationException::withMessages(['action' => 'Resolve the challenge reveal before continuing.']);
        }

        if ($game->turn_phase !== 'resolution') {
            throw ValidationException::withMessages(['action' => 'Not in resolution phase']);
        }

        if ($action->status === 'blocked' || $action->status === 'challenged') {
            $this->advanceTurn($game);
            return;
        }

        if ($action->action_type === self::ACTION_EXCHANGE) {
            $alreadyDrawing = GameDeck::query()
                ->where('game_id', $game->id)
                ->where('status', 'exchange_temp')
                ->exists();

            if (! $alreadyDrawing) {
                DB::transaction(function () use ($action, $game) {
                    $this->beginAmbassadorExchange($action->player, $game);
                });
            }

            return;
        }

        $player = $action->player;
        $target = $action->targetPlayer;

        DB::transaction(function () use ($action, $player, $target, $game) {
            switch ($action->action_type) {
                case self::ACTION_INCOME:
                    $player->coins += 1;
                    break;

                case self::ACTION_FOREIGN_AID:
                    $player->coins += 2;
                    break;

                case self::ACTION_TAX:
                    $player->coins += 3;
                    break;

                case self::ACTION_COUP:
                    $player->coins -= 7;
                    $this->loseInfluence($target, $game);
                    break;

                case self::ACTION_ASSASSINATE:
                    $player->coins -= 3;
                    $this->loseInfluence($target, $game);
                    break;

                case self::ACTION_STEAL:
                    $stolenCoins = min(2, $target->coins);
                    $target->coins -= $stolenCoins;
                    $player->coins += $stolenCoins;
                    $target->save();
                    break;
            }

            $player->save();
            $action->status = 'completed';
            $action->save();

            $this->advanceTurn($game);
        });
    }

    /**
     * First step of Ambassador exchange: draw 2 deck cards into exchange_temp.
     * Player must call finalizeAmbassadorExchange keeping exactly as many cards as they have influence (1 or 2).
     */
    protected function beginAmbassadorExchange(GamePlayer $player, Game $game): void
    {
        if (GameDeck::query()->where('game_id', $game->id)->where('status', 'exchange_temp')->exists()) {
            throw ValidationException::withMessages(['action' => 'Finish your Ambassador exchange first.']);
        }

        $deckCards = GameDeck::query()
            ->where('game_id', $game->id)
            ->where('status', 'in_deck')
            ->inRandomOrder()
            ->limit(2)
            ->get();

        if ($deckCards->count() < 2) {
            throw ValidationException::withMessages(['exchange' => 'Not enough cards in the deck.']);
        }

        foreach ($deckCards as $card) {
            $card->status = 'exchange_temp';
            $card->save();
        }
    }

    /**
     * Complete Ambassador exchange: keep exactly H cards from H hand + 2 drawn deck rows (H = 1 or 2).
     * The 2 non-kept cards are shuffled back into the deck via the temp rows.
     *
     * @param  array<int>  $keepHandIds  player_cards.id values to keep
     * @param  array<int>  $keepDeckIds  game_deck.id values (exchange_temp) to keep
     */
    public function finalizeAmbassadorExchange(Game $game, GamePlayer $player, array $keepHandIds, array $keepDeckIds): void
    {
        $action = GameAction::query()
            ->where('game_id', $game->id)
            ->where('player_id', $player->id)
            ->where('action_type', self::ACTION_EXCHANGE)
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->first();

        if (! $action) {
            throw ValidationException::withMessages(['exchange' => 'No pending Exchange action.']);
        }

        $hand = $player->cards()
            ->where('is_revealed', false)
            ->where('is_discarded', false)
            ->orderBy('position')
            ->get();

        $temp = GameDeck::query()
            ->where('game_id', $game->id)
            ->where('status', 'exchange_temp')
            ->orderBy('id')
            ->get();

        $influenceCount = $hand->count();
        $drawCount = $temp->count();

        if ($influenceCount < 1 || $influenceCount > 2 || $drawCount !== 2) {
            throw ValidationException::withMessages(['exchange' => 'Invalid exchange state.']);
        }

        if (count($keepHandIds) !== count(array_unique($keepHandIds)) || count($keepDeckIds) !== count(array_unique($keepDeckIds))) {
            throw ValidationException::withMessages(['exchange' => 'Duplicate card selection.']);
        }

        if (count($keepHandIds) + count($keepDeckIds) !== $influenceCount) {
            throw ValidationException::withMessages([
                'exchange' => $influenceCount === 1
                    ? 'Choose exactly 1 card to keep.'
                    : 'Choose exactly 2 cards to keep.',
            ]);
        }

        foreach ($keepHandIds as $id) {
            if (! $hand->pluck('id')->contains($id)) {
                throw ValidationException::withMessages(['exchange' => 'Invalid hand card id.']);
            }
        }

        foreach ($keepDeckIds as $id) {
            if (! $temp->pluck('id')->contains($id)) {
                throw ValidationException::withMessages(['exchange' => 'Invalid deck draw id.']);
            }
        }

        $keptTypes = [];

        foreach ($hand->filter(fn (PlayerCard $pc) => in_array($pc->id, $keepHandIds, true))->sortBy('position') as $pc) {
            $keptTypes[] = $pc->card_type;
        }

        foreach ($temp->filter(fn (GameDeck $gd) => in_array($gd->id, $keepDeckIds, true))->sortBy('id') as $gd) {
            $keptTypes[] = $gd->card_type;
        }

        if (count($keptTypes) !== $influenceCount) {
            throw ValidationException::withMessages(['exchange' => 'Invalid selection.']);
        }

        $returnedTypes = [];

        foreach ($hand->filter(fn (PlayerCard $pc) => ! in_array($pc->id, $keepHandIds, true))->sortBy('position') as $pc) {
            $returnedTypes[] = $pc->card_type;
        }

        foreach ($temp->filter(fn (GameDeck $gd) => ! in_array($gd->id, $keepDeckIds, true))->sortBy('id') as $gd) {
            $returnedTypes[] = $gd->card_type;
        }

        if (count($returnedTypes) !== $drawCount) {
            throw ValidationException::withMessages(['exchange' => 'Invalid return set.']);
        }

        DB::transaction(function () use ($hand, $temp, $keptTypes, $returnedTypes, $influenceCount, $player, $action, $game) {
            $orderedHand = $hand->values();
            for ($i = 0; $i < $influenceCount; $i++) {
                $orderedHand[$i]->card_type = $keptTypes[$i];
                $orderedHand[$i]->save();
            }

            foreach ($temp->values() as $i => $gd) {
                $gd->card_type = $returnedTypes[$i];
                $gd->status = 'in_deck';
                $gd->save();
            }

            $player->save();
            $action->status = 'completed';
            $action->save();

            $this->advanceTurn($game);
        });
    }

    protected function loseInfluence(GamePlayer $player, Game $game): void
    {
        $card = $player->cards()
            ->where('is_revealed', false)
            ->where('is_discarded', false)
            ->first();

        if ($card) {
            $card->is_revealed = true;
            $card->save();

            if ($player->cards()->where('is_revealed', false)->where('is_discarded', false)->count() === 0) {
                $player->is_eliminated = true;
                $player->save();

                $this->checkWinCondition($game);
            }
        }
    }

    protected function exchangeCard(GamePlayer $player, PlayerCard $revealedCard, Game $game): void
    {
        $newDeckCard = GameDeck::where('game_id', $game->id)
            ->where('status', 'in_deck')
            ->where('card_type', $revealedCard->card_type)
            ->first();

        if ($newDeckCard) {
            $revealedCard->card_type = $newDeckCard->card_type;
            $revealedCard->is_revealed = false;
            $revealedCard->save();

            $newDeckCard->status = 'in_hand';
            $newDeckCard->save();
        }
    }

    protected function advanceTurn(Game $game): void
    {
        $game->refresh();

        if ($game->status === 'finished') {
            return;
        }

        $players = $game->players()
            ->where('is_eliminated', false)
            ->orderBy('seat_number')
            ->get();

        if ($players->count() <= 1) {
            $this->endGame($game);
            return;
        }

        $currentPlayer = $players->firstWhere('id', $game->current_turn_player_id);
        $currentIndex = $players->search($currentPlayer);
        $nextIndex = ($currentIndex + 1) % $players->count();

        $game->current_turn_player_id = $players[$nextIndex]->id;
        $game->turn_phase = 'action';
        $game->save();
    }

    protected function checkWinCondition(Game $game): void
    {
        $activePlayers = $game->players()
            ->where('is_eliminated', false)
            ->count();

        if ($activePlayers <= 1) {
            $this->endGame($game);
        }
    }

    protected function endGame(Game $game): void
    {
        $game->status = 'finished';
        $game->finished_at = now();
        $game->save();

        $fresh = Game::query()
            ->with([
                'players.user',
                'players.cards' => function ($q) {
                    $q->select('id', 'game_player_id', 'card_type', 'is_revealed', 'is_discarded', 'position');
                },
                'actions' => function ($q) {
                    $q->orderBy('id', 'desc')->limit(150)->with([
                        'player.user',
                        'targetPlayer.user',
                        'challenge.challenger.user',
                        'challenge.challengedPlayer.user',
                        'block.blocker.user',
                    ]);
                },
                'exchangeTempDeckCards',
            ])
            ->find($game->id);

        if (! $fresh) {
            return;
        }

        $winner = $fresh->players->firstWhere('is_eliminated', false);
        $message = $winner && $winner->user
            ? $winner->user->username.' wins!'
            : 'Game over';

        GameStateBroadcaster::dispatch($fresh, $message);
    }

    public function passPhase(Game $game, GamePlayer $passingPlayer): void
    {
        if ($game->turn_phase === 'challenge_reveal') {
            throw ValidationException::withMessages(['phase' => 'The challenged player must reveal a card first.']);
        }

        if (! in_array($game->turn_phase, ['challenge', 'block'], true)) {
            throw ValidationException::withMessages(['phase' => 'Cannot pass in this phase']);
        }

        DB::transaction(function () use ($game, $passingPlayer) {
            $lockedGame = Game::query()->where('id', $game->id)->lockForUpdate()->firstOrFail();

            if ($lockedGame->turn_phase === 'challenge_reveal') {
                throw ValidationException::withMessages(['phase' => 'The challenged player must reveal a card first.']);
            }

            if (! in_array($lockedGame->turn_phase, ['challenge', 'block'], true)) {
                throw ValidationException::withMessages(['phase' => 'Cannot pass in this phase']);
            }

            $pendingAction = GameAction::query()
                ->where('game_id', $lockedGame->id)
                ->where('status', 'pending')
                ->orderByDesc('id')
                ->first();

            if (! $pendingAction) {
                throw ValidationException::withMessages(['action' => 'No pending action.']);
            }

            $pendingAction->load('block');
            $lockedGame->load('players');

            $round = $this->currentPassRound($lockedGame, $pendingAction);
            if ($round === null) {
                throw ValidationException::withMessages(['phase' => 'Cannot pass in this phase']);
            }

            $eligibleIds = $this->eligiblePlayerIdsForRound($lockedGame, $pendingAction, $round);
            $passerId = (int) $passingPlayer->id;

            if (! in_array($passerId, array_map('intval', $eligibleIds), true)) {
                throw ValidationException::withMessages(['phase' => $this->passIneligibleMessage($round, $pendingAction)]);
            }

            GameActionPhasePass::query()->firstOrCreate(
                [
                    'game_action_id' => $pendingAction->id,
                    'pass_round' => $round,
                    'game_player_id' => $passingPlayer->id,
                ],
                ['created_at' => now()]
            );

            $eligibleCount = count($eligibleIds);
            $passCount = GameActionPhasePass::query()
                ->where('game_action_id', $pendingAction->id)
                ->where('pass_round', $round)
                ->count();

            if ($passCount < $eligibleCount) {
                return;
            }

            $this->deletePhasePassesForAction($pendingAction);

            if ($round === GameActionPhasePass::ROUND_ACTION_CLAIM) {
                $pendingUnchallengedBlock = $pendingAction->block && ! $pendingAction->block->was_challenged;
                if ($pendingUnchallengedBlock) {
                    $pendingAction->status = 'blocked';
                    $pendingAction->save();
                    $lockedGame->turn_phase = 'resolution';
                    $lockedGame->save();

                    return;
                }

                $lockedGame->turn_phase = $this->actionHasBlockPhase($pendingAction->action_type) ? 'block' : 'resolution';
                $lockedGame->save();

                return;
            }

            if ($round === GameActionPhasePass::ROUND_BLOCK_DECLARATION) {
                $lockedGame->turn_phase = 'resolution';
                $lockedGame->save();

                return;
            }

            if ($round === GameActionPhasePass::ROUND_BLOCK_CLAIM) {
                $pendingAction->status = 'blocked';
                $pendingAction->save();
                $lockedGame->turn_phase = 'resolution';
                $lockedGame->save();
            }
        });
    }

    protected function deletePhasePassesForAction(GameAction $action): void
    {
        GameActionPhasePass::query()->where('game_action_id', $action->id)->delete();
    }

    /**
     * Which pass round applies for the current game state (server-side; matches client passRound.ts).
     */
    public function currentPassRound(Game $game, GameAction $action): ?string
    {
        if ($game->turn_phase === 'block') {
            return GameActionPhasePass::ROUND_BLOCK_DECLARATION;
        }

        if ($game->turn_phase === 'challenge') {
            $block = $action->block;
            if ($block && ! $block->was_challenged) {
                return GameActionPhasePass::ROUND_BLOCK_CLAIM;
            }

            return GameActionPhasePass::ROUND_ACTION_CLAIM;
        }

        return null;
    }

    /**
     * Non-eliminated player ids who may pass in this round (order not significant).
     *
     * @return list<int>
     */
    public function eligiblePlayerIdsForRound(Game $game, GameAction $action, string $round): array
    {
        $activePlayerIds = $game->players
            ->where('is_eliminated', false)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($round === GameActionPhasePass::ROUND_ACTION_CLAIM) {
            return array_values(array_filter($activePlayerIds, fn (int $id) => $id !== (int) $action->player_id));
        }

        if ($round === GameActionPhasePass::ROUND_BLOCK_DECLARATION) {
            if ($action->action_type === self::ACTION_FOREIGN_AID) {
                return array_values(array_filter($activePlayerIds, fn (int $id) => $id !== (int) $action->player_id));
            }

            if (in_array($action->action_type, [self::ACTION_ASSASSINATE, self::ACTION_STEAL], true)) {
                if (! $action->target_player_id) {
                    return [];
                }
                $tid = (int) $action->target_player_id;

                return in_array($tid, $activePlayerIds, true) ? [$tid] : [];
            }

            return [];
        }

        if ($round === GameActionPhasePass::ROUND_BLOCK_CLAIM) {
            $block = $action->block;
            if (! $block) {
                return [];
            }
            $bid = (int) $block->blocker_id;

            return array_values(array_filter($activePlayerIds, fn (int $id) => $id !== $bid));
        }

        return [];
    }

    protected function passIneligibleMessage(string $round, GameAction $action): string
    {
        if ($round === GameActionPhasePass::ROUND_ACTION_CLAIM) {
            return 'You cannot pass for this action right now.';
        }

        if ($round === GameActionPhasePass::ROUND_BLOCK_DECLARATION) {
            if ($action->action_type === self::ACTION_FOREIGN_AID) {
                return 'The acting player does not use the block phase.';
            }

            return 'Only the target player may pass or block during this phase.';
        }

        return 'You cannot pass for this block right now.';
    }

    /**
     * Actions that use a dedicated block phase (after any character-claim challenges).
     */
    protected function actionHasBlockPhase(string $actionType): bool
    {
        return in_array($actionType, [
            self::ACTION_FOREIGN_AID,
            self::ACTION_ASSASSINATE,
            self::ACTION_STEAL,
        ], true);
    }

    public function chooseCardToLose(GamePlayer $player, int $cardId): void
    {
        $game = $player->game;
        if ($game && $game->turn_phase === 'challenge_reveal') {
            throw ValidationException::withMessages(['card' => 'Use the challenge reveal flow to flip a card.']);
        }

        $card = $player->cards()
            ->where('id', $cardId)
            ->where('is_revealed', false)
            ->where('is_discarded', false)
            ->firstOrFail();

        $card->is_revealed = true;
        $card->save();

        if ($player->cards()->where('is_revealed', false)->where('is_discarded', false)->count() === 0) {
            $player->is_eliminated = true;
            $player->save();

            $this->checkWinCondition($player->game);
        }
    }

}
