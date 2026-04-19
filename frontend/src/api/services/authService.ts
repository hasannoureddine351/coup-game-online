import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  User,
  LoginPayload,
  SignupPayload,
  AuthTokenResponse,
} from "../types";

export const authService = {
  login(payload: LoginPayload) {
    return api.post<AuthTokenResponse & { user?: User }>(
      ENDPOINTS.auth.LOGIN,
      payload
    );
  },

  signup(payload: SignupPayload) {
    return api.post<AuthTokenResponse & { user?: User }>(
      ENDPOINTS.auth.SIGNUP,
      payload
    );
  },

  refreshToken(token: string) {
    return api.post<AuthTokenResponse>(ENDPOINTS.token.REFRESH, { token });
  },

  getCurrentUser() {
    return api.get<User>(ENDPOINTS.token.GET_CURRENT_USER);
  },
};
