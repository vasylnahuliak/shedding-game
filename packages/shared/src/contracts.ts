import * as v from 'valibot';

import { BACKEND_MESSAGE_CODES } from './backendMessages';
import {
  AppLocaleSchema,
  AppRoleSchema,
  AssignUserRoleBodySchema,
  CardSchema,
  DebugModeSchema,
  EmojiReactionPayloadSchema,
  EmojiSchema,
  GamePaceSchema,
  GameStatusSchema,
  MakeMovePayloadSchema,
  PassTurnPayloadSchema,
  ReactionTypeSchema,
  RoomIdPayloadSchema,
  UpdateLocaleBodySchema,
  UserTypeSchema,
} from './schemas';
import { parseWithSchema, safeParseWithSchema, type SchemaMapOutput } from './validation';

export const BackendMessageCodeSchema = v.picklist([...BACKEND_MESSAGE_CODES]);
export const MessageParamsSchema = v.record(v.string(), v.union([v.string(), v.number()]));

export const LocalizedMessageSchema = v.object({
  code: BackendMessageCodeSchema,
  message: v.string(),
  params: v.optional(MessageParamsSchema),
});

export const RoundScoreEventSchema = v.object({
  type: v.picklist(['reset_115', 'eliminated', 'jack_bonus', 'bridge']),
});

export const RoundScoreSchema = v.object({
  playerId: v.string(),
  scoreChange: v.number(),
  totalScore: v.number(),
  event: v.optional(RoundScoreEventSchema),
});

export const AuthUserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  locale: AppLocaleSchema,
  hapticsEnabled: v.boolean(),
  discardPileExpandedByDefault: v.boolean(),
  roles: v.array(AppRoleSchema),
  emojiPreferences: v.optional(v.record(v.string(), v.string())),
});

export const AuthUserResponseSchema = v.object({
  user: AuthUserSchema,
});

export const AdminUserListSchema = v.array(AuthUserSchema);
export const AdminUserListResponseSchema = v.object({
  users: AdminUserListSchema,
});
export const AssignUserRoleRequestSchema = AssignUserRoleBodySchema;
export const AdminUserResponseSchema = v.object({
  user: AuthUserSchema,
});

export const AdminAccountDeletionRequestSchema = v.object({
  requestId: v.string(),
  email: v.string(),
  userId: v.optional(v.string()),
  displayName: v.optional(v.string()),
  notes: v.optional(v.string()),
  locale: AppLocaleSchema,
  source: v.string(),
  createdAt: v.number(),
});

export const AdminAccountDeletionRequestListSchema = v.array(AdminAccountDeletionRequestSchema);
export const AdminAccountDeletionRequestListResponseSchema = v.object({
  requests: AdminAccountDeletionRequestListSchema,
});

export const RoomSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  playersCount: v.number(),
  maxPlayers: v.number(),
  isCurrentUserInRoom: v.boolean(),
  isCurrentUserHost: v.boolean(),
});

export const RoomSummaryListSchema = v.array(RoomSummarySchema);

export const RoomPlayerSchema = v.object({
  id: v.string(),
  name: v.string(),
  playerType: UserTypeSchema,
  hand: v.union([v.number(), v.array(CardSchema)]),
  score: v.number(),
  isLeaver: v.optional(v.boolean()),
  isOnline: v.optional(v.boolean()),
});

export const RoomDetailsSchema = v.object({
  id: v.string(),
  name: v.string(),
  hostId: v.string(),
  createdAt: v.number(),
  lastActivityAt: v.number(),
  turnStartedAt: v.optional(v.number()),
  gamePace: GamePaceSchema,
  players: v.array(RoomPlayerSchema),
  deck: v.number(),
  discardPile: v.array(CardSchema),
  currentPlayerIndex: v.number(),
  gameStatus: GameStatusSchema,
  penaltyCardsCount: v.number(),
  activeSuit: v.nullable(v.picklist(['hearts', 'diamonds', 'clubs', 'spades'])),
  debugMode: v.optional(DebugModeSchema),
  hasDrawnThisTurn: v.boolean(),
  scoreHistory: v.array(v.array(RoundScoreSchema)),
  reshuffleCount: v.number(),
  bridgeAvailable: v.boolean(),
  bridgePlayerId: v.nullable(v.string()),
  bridgeLastCards: v.nullable(v.array(CardSchema)),
  readyForNextRoundPlayerIds: v.optional(v.array(v.string())),
  isOpeningTurn: v.boolean(),
  gameStartedAt: v.optional(v.number()),
  gameFinishedAt: v.optional(v.number()),
  winnerId: v.optional(v.string()),
  winnerName: v.optional(v.string()),
});

const activeGameEntries = {
  id: v.string(),
  name: v.string(),
  gameStatus: GameStatusSchema,
  playersCount: v.number(),
};

export const ActiveGameSchema = v.object(activeGameEntries);

export const ActiveGameNullableSchema = v.nullable(ActiveGameSchema);

export const AdminGamePlayerSchema = v.object({
  id: v.string(),
  name: v.string(),
  isHost: v.boolean(),
  score: v.optional(v.number()),
  playerType: UserTypeSchema,
  isLeaver: v.optional(v.boolean()),
});

export const AdminGameSchema = v.object({
  ...activeGameEntries,
  players: v.array(AdminGamePlayerSchema),
  winnerId: v.optional(v.string()),
  lastRoundScores: v.optional(v.array(RoundScoreSchema)),
  roundsPlayed: v.optional(v.number()),
  isClosed: v.boolean(),
  createdAt: v.optional(v.number()),
  gameStartedAt: v.optional(v.number()),
  gameFinishedAt: v.optional(v.number()),
  closedAt: v.optional(v.number()),
  closedReasonCode: v.optional(BackendMessageCodeSchema),
  closedReasonParams: v.optional(MessageParamsSchema),
});

export const AdminGameListSchema = v.array(AdminGameSchema);

export const PlayerTypeFilterSchema = v.picklist(['all', 'humans-only', 'bots-only']);
export const GameStatusFilterSchema = v.picklist(['all', 'started-only', 'unstarted-only']);

export const GameHistoryFiltersSchema = v.object({
  playerTypeFilter: PlayerTypeFilterSchema,
  gameStatusFilter: GameStatusFilterSchema,
});

export const GameHistoryFiltersInputSchema = v.object({
  playerTypeFilter: v.optional(PlayerTypeFilterSchema),
  gameStatusFilter: v.optional(GameStatusFilterSchema),
});

export const DEFAULT_GAME_HISTORY_FILTERS = {
  playerTypeFilter: 'all',
  gameStatusFilter: 'all',
} as const;

export const GameHistoryPageSchema = v.object({
  items: AdminGameListSchema,
  totalCount: v.number(),
  hasMore: v.boolean(),
  nextCursor: v.optional(v.string()),
});

export const LeaveRoomResponseSchema = v.object({
  closed: v.boolean(),
});

export const RoomInviteLinkResponseSchema = v.object({
  roomId: v.string(),
  shortUrl: v.string(),
  canonicalUrl: v.string(),
});

export const UserStatsSchema = v.object({
  wins: v.number(),
  losses: v.number(),
  gamesPlayed: v.number(),
});

export const RoomsUpdatedEventSchema = v.object({
  rooms: RoomSummaryListSchema,
});

export const RoomClosedEventSchema = v.object({
  roomId: v.string(),
  reason: v.optional(v.string()),
  reasonCode: v.optional(BackendMessageCodeSchema),
  reasonParams: v.optional(MessageParamsSchema),
  reasonMessage: v.optional(v.string()),
});

export const PlayerKickedEventSchema = v.object({
  roomId: v.string(),
  reason: v.picklist(['host', 'timeout']),
});
export const RoomRecreatedEventSchema = RoomIdPayloadSchema;

export const EmojiReactionEventSchema = v.object({
  userId: v.string(),
  playerName: v.string(),
  emoji: ReactionTypeSchema,
  actualEmoji: v.optional(EmojiSchema),
});

export const ClientSocketEventSchemas = {
  join_room: RoomIdPayloadSchema,
  leave_room: RoomIdPayloadSchema,
  set_locale: UpdateLocaleBodySchema,
  delete_room: RoomIdPayloadSchema,
  end_game: RoomIdPayloadSchema,
  recreate_room: RoomIdPayloadSchema,
  player_leave_game: RoomIdPayloadSchema,
  make_move: MakeMovePayloadSchema,
  draw_card: RoomIdPayloadSchema,
  pass_turn: PassTurnPayloadSchema,
  player_ready_next_round: RoomIdPayloadSchema,
  apply_bridge: RoomIdPayloadSchema,
  emoji_reaction: EmojiReactionPayloadSchema,
  decline_bridge: RoomIdPayloadSchema,
} as const;

export const ServerSocketEventSchemas = {
  rooms_updated: RoomsUpdatedEventSchema,
  room_updated: RoomDetailsSchema,
  error: LocalizedMessageSchema,
  game_notice: LocalizedMessageSchema,
  game_ended: v.undefined(),
  room_closed: RoomClosedEventSchema,
  player_left_game: v.undefined(),
  room_recreated: RoomRecreatedEventSchema,
  player_kicked: PlayerKickedEventSchema,
  emoji_reaction: EmojiReactionEventSchema,
} as const;

export type LocalizedMessage = v.InferOutput<typeof LocalizedMessageSchema>;
export type RoundScoreEvent = v.InferOutput<typeof RoundScoreEventSchema>;
export type RoundScore = v.InferOutput<typeof RoundScoreSchema>;
export type AuthUser = v.InferOutput<typeof AuthUserSchema>;
export type AuthUserResponse = v.InferOutput<typeof AuthUserResponseSchema>;
export type AdminUser = AuthUser;
export type AdminUserListResponse = v.InferOutput<typeof AdminUserListResponseSchema>;
export type AdminUserResponse = v.InferOutput<typeof AdminUserResponseSchema>;
export type AdminAccountDeletionRequest = v.InferOutput<typeof AdminAccountDeletionRequestSchema>;
export type AdminAccountDeletionRequestListResponse = v.InferOutput<
  typeof AdminAccountDeletionRequestListResponseSchema
>;
export type AppRole = v.InferOutput<typeof AppRoleSchema>;
export type RoomSummary = v.InferOutput<typeof RoomSummarySchema>;
export type RoomPlayer = v.InferOutput<typeof RoomPlayerSchema>;
export type RoomDetails = v.InferOutput<typeof RoomDetailsSchema>;
export type ActiveGame = v.InferOutput<typeof ActiveGameSchema>;
export type AdminGamePlayer = v.InferOutput<typeof AdminGamePlayerSchema>;
export type AdminGame = v.InferOutput<typeof AdminGameSchema>;
export type PlayerTypeFilter = v.InferOutput<typeof PlayerTypeFilterSchema>;
export type GameStatusFilter = v.InferOutput<typeof GameStatusFilterSchema>;
export type GameHistoryFilters = v.InferOutput<typeof GameHistoryFiltersSchema>;
export type GameHistoryPage = v.InferOutput<typeof GameHistoryPageSchema>;
export type LeaveRoomResponse = v.InferOutput<typeof LeaveRoomResponseSchema>;
export type RoomInviteLinkResponse = v.InferOutput<typeof RoomInviteLinkResponseSchema>;
export type UserStats = v.InferOutput<typeof UserStatsSchema>;
export type RoomClosedEvent = v.InferOutput<typeof RoomClosedEventSchema>;
export type PlayerKickedEvent = v.InferOutput<typeof PlayerKickedEventSchema>;
export type EmojiReactionEvent = v.InferOutput<typeof EmojiReactionEventSchema>;

export type ClientSocketEvent = keyof typeof ClientSocketEventSchemas;
export type ServerSocketEvent = keyof typeof ServerSocketEventSchemas;

export type ClientSocketPayloadByEvent = SchemaMapOutput<typeof ClientSocketEventSchemas>;
export type ServerSocketPayloadByEvent = SchemaMapOutput<typeof ServerSocketEventSchemas>;

type ClientSocketPayload<TEvent extends ClientSocketEvent> = v.InferOutput<
  (typeof ClientSocketEventSchemas)[TEvent]
>;
type ServerSocketPayload<TEvent extends ServerSocketEvent> = v.InferOutput<
  (typeof ServerSocketEventSchemas)[TEvent]
>;

export const parseClientSocketEvent = <TEvent extends ClientSocketEvent>(
  event: TEvent,
  payload: unknown
): ClientSocketPayload<TEvent> => {
  return parseWithSchema(ClientSocketEventSchemas[event], payload);
};

export const safeParseClientSocketEvent = <TEvent extends ClientSocketEvent>(
  event: TEvent,
  payload: unknown
) => {
  return safeParseWithSchema(ClientSocketEventSchemas[event], payload);
};

export const parseServerSocketEvent = <TEvent extends ServerSocketEvent>(
  event: TEvent,
  payload: unknown
): ServerSocketPayload<TEvent> => {
  return parseWithSchema(ServerSocketEventSchemas[event], payload);
};

export const safeParseServerSocketEvent = <TEvent extends ServerSocketEvent>(
  event: TEvent,
  payload: unknown
) => {
  return safeParseWithSchema(ServerSocketEventSchemas[event], payload);
};
