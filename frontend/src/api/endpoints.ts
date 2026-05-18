// API endpoint constants — full paths including /coup (Laravel apiPrefix)
export const ENDPOINTS = {
  auth: {
    LOGIN: `/auth/login`,
    SIGNUP: `/auth/register`,
  },
  token: {
    GET_CURRENT_USER: `/auth/me`,
    REFRESH: `/auth/refresh`,
  },
  games: {
    LIST: `/games`,
    CREATE: `/games`,
    JOIN: (id: number) => `/games/${id}/join`,
    DELETE: (id: number) => `/games/${id}`,
    CURRENT_GAME: `/games/current-game`,
    LEAVE: (id: number) => `/games/${id}/leave`,
    READY: (id: number) => `/games/${id}/ready`,
    START: (id: number) => `/games/${id}/start`,
    SUBMIT_ACTION: (id: number) => `/games/${id}/actions`,
    CHALLENGE: (gameId: number, actionId: number) => `/games/${gameId}/actions/${actionId}/challenge`,
    BLOCK: (gameId: number, actionId: number) => `/games/${gameId}/actions/${actionId}/block`,
    BLOCK_CHALLENGE: (gameId: number, actionId: number) => `/games/${gameId}/actions/${actionId}/block-challenge`,
    REVEAL_CHALLENGE: (gameId: number, actionId: number) => `/games/${gameId}/actions/${actionId}/reveal-challenge`,
    RESOLVE: (gameId: number, actionId: number) => `/games/${gameId}/actions/${actionId}/resolve`,
    PASS: (id: number) => `/games/${id}/pass`,
    CHOOSE_CARD: (id: number) => `/games/${id}/choose-card`,
    EXCHANGE_FINALIZE: (id: number) => `/games/${id}/exchange/finalize`,
    MESSAGES: (id: number) => `/games/${id}/messages`,
    POLLS: (id: number) => `/games/${id}/polls`,
    POLL_VOTE: (gameId: number, pollId: number) => `/games/${gameId}/polls/${pollId}/vote`,
  },
  leaderboard: {
    LIST: `/leaderboard`,
  },
  discussion: {
    POSTS: `/discussion/posts`,
    POST: (id: number) => `/discussion/posts/${id}`,
    REPLIES: (id: number) => `/discussion/posts/${id}/replies`,
  },
} as const;



