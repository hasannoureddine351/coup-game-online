<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
});

Route::middleware('auth:api')->prefix('games')->group(function () {
    Route::get('/', [GameController::class, 'index']);
    Route::get('/current-game', [GameController::class, 'currentGame']);
    Route::post('/', [GameController::class, 'store']);
    Route::post('/{id}/join', [GameController::class, 'join']);
    Route::delete('/{id}', [GameController::class, 'destroy']);
    Route::delete('/{id}/leave', [GameController::class, 'leave']);
});
