// Shared API types

export interface User {
  id: string;
  username: string;
  email: string;
  coins_balance: number;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token?: string;
  token?: string;
  user?: User;
}
