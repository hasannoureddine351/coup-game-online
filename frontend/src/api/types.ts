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
  confirmPassword: string;
}

export interface AuthTokenResponse {
  access_token?: string;
  token?: string;
  user?: User;
}

export interface GamePlayer {
  id: number;
  game_id: number;
  user_id: number;
  seat_number: number;
  coins: number;
  is_eliminated: boolean;
  is_ready: boolean;
  user?: User;
}

export interface Game {
  id: number;
  created_by_id: number | null;
  status: "waiting" | "in_progress" | "finished" | "cancelled";
  max_players: number;
  current_turn_player_id: number | null;
  turn_phase: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  players?: GamePlayer[];
}

/** Game with host flag, returned by the current-game API */
export interface CurrentGame extends Game {
  host: boolean;
}
