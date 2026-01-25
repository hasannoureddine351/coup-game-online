import { api } from "../client.ts";
import { ENDPOINTS } from "../endpoints.ts";
import type {
  User,
  LoginPayload,
  SignupPayload,
  AuthTokenResponse,
} from "../types.ts";

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
