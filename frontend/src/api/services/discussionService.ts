import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { DiscussionPost } from '../types';

export interface PaginatedPosts {
  data: DiscussionPost[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const discussionService = {
  listPosts(page = 1) {
    return api.get<PaginatedPosts>(ENDPOINTS.discussion.POSTS, { params: { page } });
  },

  getPost(id: number) {
    return api.get<DiscussionPost>(ENDPOINTS.discussion.POST(id));
  },

  createPost(body: string) {
    return api.post<DiscussionPost>(ENDPOINTS.discussion.POSTS, { body });
  },

  reply(id: number, body: string) {
    return api.post<DiscussionPost>(ENDPOINTS.discussion.REPLIES(id), { body });
  },

  deletePost(id: number) {
    return api.delete<{ message: string }>(ENDPOINTS.discussion.POST(id));
  },
};
