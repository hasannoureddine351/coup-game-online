<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DiscussionController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\GameMessageController;
use App\Http\Controllers\Api\GamePollController;
use App\Http\Controllers\Api\LeaderboardController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes(['middleware' => ['auth:api']]);

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
});

Route::middleware('auth:api')->get('leaderboard', [LeaderboardController::class, 'index']);

Route::middleware('auth:api')->prefix('discussion')->group(function () {
    Route::get('posts', [DiscussionController::class, 'index']);
    Route::get('posts/{id}', [DiscussionController::class, 'show']);
    Route::post('posts', [DiscussionController::class, 'store']);
    Route::post('posts/{id}/replies', [DiscussionController::class, 'reply']);
    Route::delete('posts/{id}', [DiscussionController::class, 'destroy']);
});

Route::middleware('auth:api')->prefix('games')->group(function () {
    Route::get('/', [GameController::class, 'index']);
    Route::get('/current-game', [GameController::class, 'currentGame']);
    Route::post('/', [GameController::class, 'store']);
    Route::post('/{id}/join', [GameController::class, 'join']);
    Route::delete('/{id}', [GameController::class, 'destroy']);
    Route::delete('/{id}/leave', [GameController::class, 'leave']);
    
    Route::post('/{id}/ready', [GameController::class, 'toggleReady']);
    Route::post('/{id}/start', [GameController::class, 'start']);
    Route::post('/{id}/actions', [GameController::class, 'submitAction']);
    Route::post('/{id}/actions/{actionId}/challenge', [GameController::class, 'submitChallenge']);
    Route::post('/{id}/actions/{actionId}/block', [GameController::class, 'submitBlock']);
    Route::post('/{id}/actions/{actionId}/block-challenge', [GameController::class, 'submitBlockChallenge']);
    Route::post('/{id}/actions/{actionId}/reveal-challenge', [GameController::class, 'revealChallengeCard']);
    Route::post('/{id}/actions/{actionId}/resolve', [GameController::class, 'resolveAction']);
    Route::post('/{id}/pass', [GameController::class, 'passPhase']);
    Route::post('/{id}/choose-card', [GameController::class, 'chooseCardToLose']);
    Route::post('/{id}/exchange/finalize', [GameController::class, 'finalizeAmbassadorExchange']);

    Route::get('/{id}/messages', [GameMessageController::class, 'index']);
    Route::post('/{id}/messages', [GameMessageController::class, 'store']);

    Route::get('/{id}/polls', [GamePollController::class, 'index']);
    Route::post('/{id}/polls', [GamePollController::class, 'store']);
    Route::post('/{id}/polls/{pollId}/vote', [GamePollController::class, 'vote']);
});
