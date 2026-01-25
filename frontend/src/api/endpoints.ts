// API endpoint constants — path strings only, grouped by domain

export const ENDPOINTS = {
  auth: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/register",
  },
  token: {
    GET_CURRENT_USER: "/auth/me",
    REFRESH: "/auth/refresh",
  },
} as const;
