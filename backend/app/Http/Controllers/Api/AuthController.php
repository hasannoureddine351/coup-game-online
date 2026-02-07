<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'refresh']]);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return $this->respondWithTokenAndUser($token, auth('api')->user());
    }

    /**
     * Register a new user and return a JWT.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'confirmPassword' => ['required', 'string', 'same:password'],
        ], [
            'confirmPassword.same' => 'The password confirmation does not match.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::query()->create([
            'username' => $request->input('username'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'coins_balance' => 0,
        ]);

        $token = auth('api')->login($user);

        return $this->respondWithTokenAndUser($token, $user);
    }

    /**
     * Get the authenticated user.
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json($this->userToArray($user));
    }

    /**
     * Refresh a token. Accepts token in request body (frontend sends { token }).
     */
    public function refresh(Request $request): JsonResponse
    {
        $token = $request->input('token');

        if (! $token || ! is_string($token)) {
            return response()->json(['message' => 'Token is required.'], 422);
        }

        try {
            auth('api')->setToken($token);
            $newToken = auth('api')->refresh();
            $user = auth('api')->user();
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Token is invalid or expired.'], 401);
        }

        return $this->respondWithTokenAndUser($newToken, $user);
    }

    /**
     * Get the token array structure with user.
     *
     * @param  \App\Models\User  $user
     */
    protected function respondWithTokenAndUser(string $token, $user): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) auth('api')->factory()->getTTL() * 60,
            'user' => $this->userToArray($user),
        ]);
    }

    /**
     * @param  \App\Models\User  $user
     * @return array<string, mixed>
     */
    protected function userToArray($user): array
    {
        return [
            'id' => (string) $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'coins_balance' => (int) $user->coins_balance,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }
}
