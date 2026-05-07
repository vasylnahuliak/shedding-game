import type {
  AppLocale,
  AppRole,
  BackendMessageCode,
  Card,
  DebugMode,
  GamePace,
  GameStatus,
  Suit,
  SuitDisplayMode,
  UserType,
} from '@shedding-game/shared';
import type { Request } from 'express';

export type EmojiPreferences = Record<string, string>;

export interface User {
  id: string;
  name: string;
  email: string;
  locale: AppLocale;
  userType: UserType;
  hapticsEnabled: boolean;
  discardPileExpandedByDefault: boolean;
  suitDisplayMode: SuitDisplayMode;
  roles: AppRole[];
  emojiPreferences?: EmojiPreferences;
  createdAt: number;
  updatedAt: number;
}

type LeaveReason = 'timeout' | 'host' | 'voluntary';

export interface Player {
  id: string;
  name: string;
  playerType: UserType;
  hand: Card[];
  score: number;
  isLeaver?: boolean; // Player left the match and stays in history/scoreboard, but no longer participates
  leaveReason?: LeaveReason; // Why the player left (timeout kick, host kick, or voluntary leave)
  isOnline?: boolean; // Optional presence from server
}

export interface RoundScoreEvent {
  type: 'reset_115' | 'eliminated' | 'jack_bonus' | 'bridge';
}

export interface RoundScore {
  playerId: string;
  scoreChange: number;
  totalScore: number;
  event?: RoundScoreEvent;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  createdAt: number;
  lastActivityAt: number;
  turnStartedAt?: number;
  gamePace: GamePace;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  gameStatus: GameStatus;
  penaltyCardsCount: number;
  activeSuit: Suit | null;
  debugMode?: DebugMode;
  hasDrawnThisTurn: boolean;
  scoreHistory: RoundScore[][];
  reshuffleCount: number;
  bridgeAvailable: boolean;
  bridgePlayerId: string | null;
  bridgeLastCards: Card[] | null;
  /** When round_over: player ids who pressed "ready" for next round. Bots/leavers auto-ready. */
  readyForNextRoundPlayerIds?: string[];
  /** True when a random card was auto-played at round start and the first player hasn't finished their opening turn yet. */
  isOpeningTurn: boolean;
  /** When gameStatus first changed to 'playing' */
  gameStartedAt?: number;
  /** When gameStatus changed to 'finished' (last round completed) */
  gameFinishedAt?: number;
  /** The player id who won the game (set when gameStatus becomes 'finished') */
  winnerId?: string;
  /** The player name who won the game (set when gameStatus becomes 'finished') */
  winnerName?: string;
}

export interface ClosedGame {
  id: string;
  roomId: string;
  name: string;
  hostId: string;
  gameStatus: GameStatus;
  players: Array<{
    id: string;
    name: string;
    score: number;
    isLeaver?: boolean;
    playerType: UserType;
  }>;
  roundsPlayed?: number;
  createdAt?: number;
  gameStartedAt?: number;
  gameFinishedAt?: number;
  closedAt: number;
  closedReasonCode?: BackendMessageCode;
  closedReasonParams?: Record<string, string | number>;
}

export type RequestWithRequestId = Request & {
  requestId: string;
};

export type AuthedRequest = RequestWithRequestId & {
  locale: AppLocale;
  userId: string;
  userName: string;
  userEmail: string;
  hasProfile: boolean;
  roles: AppRole[];
};

export type RequestWithLocale = RequestWithRequestId & {
  locale: AppLocale;
};
