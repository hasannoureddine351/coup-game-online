<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscussionPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DiscussionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 50);

        $paginator = DiscussionPost::query()
            ->whereNull('parent_id')
            ->with(['user:id,username'])
            ->withCount('replies')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($paginator);
    }

    public function show(int $id): JsonResponse
    {
        $post = DiscussionPost::query()
            ->whereNull('parent_id')
            ->with([
                'user:id,username',
                'replies.user:id,username',
            ])
            ->findOrFail($id);

        return response()->json($post);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::guard('api')->user();

        $post = DiscussionPost::query()->create([
            'user_id' => $user->id,
            'parent_id' => null,
            'body' => $request->input('body'),
        ]);

        $post->load('user:id,username');

        return response()->json($post, 201);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $parent = DiscussionPost::query()->whereNull('parent_id')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::guard('api')->user();

        $reply = DiscussionPost::query()->create([
            'user_id' => $user->id,
            'parent_id' => $parent->id,
            'body' => $request->input('body'),
        ]);

        $reply->load('user:id,username');

        return response()->json($reply, 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = Auth::guard('api')->user();
        $post = DiscussionPost::query()->findOrFail($id);

        if ((int) $post->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
