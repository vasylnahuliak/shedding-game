import type { GamePace, Rank, Suit, SuitDisplayMode } from './types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const SUIT_DISPLAY_MODES: SuitDisplayMode[] = ['classic', 'distinct'];
export const DEFAULT_SUIT_DISPLAY_MODE: SuitDisplayMode = 'classic';

// Bridge ranks - only these ranks can form a bridge (4 cards of same rank in pile)
export const BRIDGE_RANKS = ['10', 'J', 'Q', 'K', 'A'] as const;

export const SCORE_RESET_THRESHOLD = 115;
export const SCORE_ELIMINATION_THRESHOLD = 125;
export const MAX_PLAYERS = 4;
export const MAX_PLAYER_NAME_LENGTH = 15;
export const MAX_CLOSED_GAMES_HISTORY = 100;
export const MAX_ROOMS_PER_HOST = 1;
export const GAME_PACES: GamePace[] = ['debug', 'quick', 'long'];
export const DEFAULT_GAME_PACE: GamePace = 'quick';
export const TURN_TIMER_WARNING_DELAY_MS = 60 * 1000;
export const TURN_TIMER_VISIBLE_DURATION_MS = 25 * 1000;
export const TURN_TIMEOUT_KICK_DELAY_MS =
  TURN_TIMER_WARNING_DELAY_MS + TURN_TIMER_VISIBLE_DURATION_MS;
export const TURN_TIMER_WARNING_MS = 8 * 1000;
export const TURN_TIMER_CRITICAL_MS = 5 * 1000;
export const LONG_TURN_TIMER_WARNING_DELAY_MS = 55 * 60 * 1000;
export const LONG_TURN_TIMER_VISIBLE_DURATION_MS = 5 * 60 * 1000;
export const LONG_TURN_TIMER_WARNING_MS = 60 * 1000;
export const LONG_TURN_TIMER_CRITICAL_MS = 20 * 1000;

type GamePaceConfig = {
  warningDelayMs: number;
  visibleDurationMs: number;
  warningMs: number;
  criticalMs: number;
  kickDelayMs: number;
};

const createGamePaceConfig = (
  warningDelayMs: number,
  visibleDurationMs: number,
  warningMs: number,
  criticalMs: number
): GamePaceConfig => ({
  warningDelayMs,
  visibleDurationMs,
  warningMs,
  criticalMs,
  kickDelayMs: warningDelayMs + visibleDurationMs,
});

export const GAME_PACE_CONFIGS: Record<GamePace, GamePaceConfig> = {
  debug: createGamePaceConfig(5 * 1000, 7 * 1000, 3 * 1000, 1 * 1000),
  quick: createGamePaceConfig(
    TURN_TIMER_WARNING_DELAY_MS,
    TURN_TIMER_VISIBLE_DURATION_MS,
    TURN_TIMER_WARNING_MS,
    TURN_TIMER_CRITICAL_MS
  ),
  long: createGamePaceConfig(
    LONG_TURN_TIMER_WARNING_DELAY_MS,
    LONG_TURN_TIMER_VISIBLE_DURATION_MS,
    LONG_TURN_TIMER_WARNING_MS,
    LONG_TURN_TIMER_CRITICAL_MS
  ),
};

export const getGamePaceConfig = (gamePace?: GamePace | null): GamePaceConfig =>
  GAME_PACE_CONFIGS[gamePace ?? DEFAULT_GAME_PACE];

// Room expiry timeouts
export const ROOM_WAITING_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours for waiting rooms
export const ROOM_GAME_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours for active games
