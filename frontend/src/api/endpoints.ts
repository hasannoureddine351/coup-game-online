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
  },
} as const;



