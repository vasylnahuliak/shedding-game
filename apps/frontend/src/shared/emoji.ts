import type { ReactionType } from '@shedding-game/shared';

import { getReactionEmoji as sharedGetReactionEmoji, REACTIONS } from '@shedding-game/shared';

type EmojiPreferences = Record<string, string>;

export const DEFAULT_REACTION_EMOJI = REACTIONS[0]?.emoji ?? '😂';

export const getReactionEmoji = (type: ReactionType, preferences?: EmojiPreferences): string =>
  sharedGetReactionEmoji(type, preferences);

export const getReactionEmojiMap = (preferences?: EmojiPreferences): Record<ReactionType, string> =>
  REACTIONS.reduce<Record<ReactionType, string>>(
    (map, reaction) => {
      map[reaction.id] = getReactionEmoji(reaction.id, preferences);
      return map;
    },
    {} as Record<ReactionType, string>
  );

export const getReactionButtons = (
  preferences?: EmojiPreferences
): { id: ReactionType; emoji: string }[] =>
  REACTIONS.map((reaction) => ({
    ...reaction,
    emoji: getReactionEmoji(reaction.id, preferences),
  }));
