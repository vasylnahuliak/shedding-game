import * as v from 'valibot';

import { BOT_PERSONA_NAMES, type BotPersonaName } from './botNames';
import { GAME_PACES, MAX_PLAYER_NAME_LENGTH, RANKS, SUITS } from './constants';
import { POPULAR_EMOJIS, REACTIONS, type ReactionType } from './game';
import { SUPPORTED_LOCALES } from './i18n';

const toTrimmedString = (maxLength?: number) =>
  v.pipe(
    v.unknown(),
    v.transform((input) => {
      if (
        typeof input === 'string' ||
        typeof input === 'number' ||
        typeof input === 'boolean' ||
        typeof input === 'bigint'
      ) {
        return String(input).trim();
      }

      return '';
    }),
    v.transform((value) => (maxLength === undefined ? value : value.slice(0, maxLength)))
  );

// ── Core type schemas ──────────────────────────────────────────────

export const SuitSchema = v.picklist([...SUITS]);
export const RankSchema = v.picklist([...RANKS]);
export const UserTypeSchema = v.picklist(['human', 'bot']);
export const AppRoleSchema = v.picklist(['player', 'admin', 'super_admin']);
export const GameStatusSchema = v.picklist(['waiting', 'playing', 'round_over', 'finished']);

export const CardSchema = v.object({
  suit: SuitSchema,
  rank: RankSchema,
});

export const DebugModeSchema = v.picklist([
  'none',
  'one_six_four_jacks',
  'one_jack_four_sevens',
  'one_jack_four_eights',
  'one_jack_four_sixes',
  'one_jack_four_kings',
  'one_jack_four_aces',
]);
export const GamePaceSchema = v.picklist([...GAME_PACES]);

export const AppLocaleSchema = v.picklist([...SUPPORTED_LOCALES]);

const REACTION_IDS = REACTIONS.map((r) => r.id) as [ReactionType, ...ReactionType[]];
const ALL_EMOJIS = [...REACTIONS.map((r) => r.emoji), ...POPULAR_EMOJIS];

export const ReactionTypeSchema = v.picklist(REACTION_IDS);
export const EmojiSchema = v.picklist(ALL_EMOJIS as [string, ...string[]]);
export const RoomIdSchema = v.pipe(v.string(), v.trim(), v.nonEmpty());
const NameSchema = toTrimmedString(MAX_PLAYER_NAME_LENGTH);
export const PlayerNameSchema = NameSchema;
export const RoomNameSchema = NameSchema;
export const BotPersonaNameSchema = v.picklist([...BOT_PERSONA_NAMES] as [
  BotPersonaName,
  ...BotPersonaName[],
]);

// ── HTTP request body schemas ──────────────────────────────────────

export const UpsertProfileBodySchema = v.object({
  displayName: PlayerNameSchema,
});

export const UpdateEmojiPreferenceBodySchema = v.object({
  reactionType: ReactionTypeSchema,
  emoji: v.picklist([...POPULAR_EMOJIS] as [string, ...string[]]),
});

export const UpdateLocaleBodySchema = v.object({
  locale: AppLocaleSchema,
});

export const UpdateHapticsPreferenceBodySchema = v.object({
  enabled: v.boolean(),
});

export const UpdateDiscardPilePreferenceBodySchema = v.object({
  enabled: v.boolean(),
});

export const AssignUserRoleBodySchema = v.object({
  role: AppRoleSchema,
});

const roomOptionsBodyEntries = {
  name: v.optional(RoomNameSchema),
  debugMode: v.optional(DebugModeSchema),
  gamePace: v.optional(GamePaceSchema),
};

export const CreateRoomBodySchema = v.object(roomOptionsBodyEntries);

export const UpdateRoomOptionsBodySchema = v.object(roomOptionsBodyEntries);

export const ReorderPlayersBodySchema = v.object({
  playerIds: v.array(RoomIdSchema),
});

export const UpdateBotNameBodySchema = v.object({
  name: BotPersonaNameSchema,
});

// ── Socket event payload schemas ───────────────────────────────────

export const RoomIdPayloadSchema = v.object({
  roomId: RoomIdSchema,
});

export const MakeMovePayloadSchema = v.object({
  roomId: RoomIdSchema,
  cards: v.array(CardSchema),
  chosenSuit: v.optional(SuitSchema),
  applyBridgeAfterMove: v.optional(v.boolean()),
});

export const PassTurnPayloadSchema = v.object({
  roomId: RoomIdSchema,
  chosenSuit: v.optional(SuitSchema),
});

export const EmojiReactionPayloadSchema = v.object({
  roomId: RoomIdSchema,
  emoji: ReactionTypeSchema,
  actualEmoji: v.optional(EmojiSchema),
});
