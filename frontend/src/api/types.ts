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

export interface PlayerCard {
  id: number;
  game_player_id: number;
  card_type: 'Duke' | 'Assassin' | 'Captain' | 'Ambassador' | 'Contessa';
  is_revealed: boolean;
  is_discarded: boolean;
  position: number;
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
  cards?: PlayerCard[];
  influence_count?: number;
}

/** Row from game_deck (draw pile / Ambassador exchange draws) */
export interface DeckCard {
  id: number;
  game_id: number;
  card_type: PlayerCard["card_type"];
  status: string;
  created_at?: string;
}

export interface Game {
  id: number;
  created_by_id: number | null;
  status: "waiting" | "in_progress" | "finished" | "cancelled";
  max_players: number;
  current_turn_player_id: number | null;
  turn_phase:
    | "action"
    | "challenge"
    | "block"
    | "resolution"
    | "challenge_reveal"
    | string
    | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  players?: GamePlayer[];
  actions?: GameAction[];
  /** Populated during Ambassador exchange after Resolve (2 deck draws) */
  exchange_temp_deck_cards?: DeckCard[];
}

/** Game with host flag, returned by the current-game API */
export interface CurrentGame extends Game {
  host: boolean;
}

export type ActionType = 'Income' | 'Foreign_Aid' | 'Tax' | 'Assassinate' | 'Steal' | 'Exchange' | 'Coup';
export type CharacterType = 'Duke' | 'Assassin' | 'Captain' | 'Ambassador' | 'Contessa';

export interface GameAction {
  id: number;
  game_id: number;
  player_id: number;
  action_type: ActionType;
  target_player_id: number | null;
  claimed_character: CharacterType | null;
  coins_cost: number;
  status: 'pending' | 'completed' | 'blocked' | 'challenged';
  created_at: string;
  player?: GamePlayer;
  targetPlayer?: GamePlayer;
  game?: Game;
  challenge?: Challenge;
  block?: Block;
}

export interface Challenge {
  id: number;
  game_action_id: number;
  challenger_id: number;
  challenged_player_id: number;
  outcome: 'challenger_wins' | 'challenged_wins' | null;
  revealed_card_type: CharacterType | null;
  created_at: string;
  challenger?: GamePlayer;
  challengedPlayer?: GamePlayer;
  action?: GameAction;
}

export interface Block {
  id: number;
  game_action_id: number;
  blocker_id: number;
  claimed_character: CharacterType;
  was_challenged: boolean;
  outcome: 'successful' | 'failed' | 'challenged';
  created_at: string;
  blocker?: GamePlayer;
  action?: GameAction;
}
