import { useEffect, useEffectEvent } from 'react';

import type { EmojiReactionEvent, ReactionType } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { useEmojiReactions } from '@/components/EmojiReactionOverlay/EmojiReactionOverlay';
import { useAuth } from '@/hooks/useAuthStore';
import { appRoutes } from '@/navigation/appRoutes';
import { playReactionHaptic } from '@/services/haptics';
import { SocketService } from '@/services/SocketService';
import { getReactionButtons, getReactionEmoji } from '@/shared/emoji';

import { useEmojiReactionStore } from './useEmojiReactionStore';

export const useEmojiReactionHandlers = (roomId: string | undefined) => {
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const openEmojiPicker = useEmojiReactionStore((state) => state.openEmojiPicker);

  const { emojis, spawnReaction, removeEmoji } = useEmojiReactions();

  const reactionButtons = getReactionButtons(user?.emojiPreferences);

  const onEmojiReaction = useEffectEvent(
    ({ emoji, playerName, actualEmoji }: EmojiReactionEvent) => {
      spawnReaction(emoji, playerName, actualEmoji);
    }
  );

  useEffect(function subscribeToEmojiReactions() {
    SocketService.on('emoji_reaction', onEmojiReaction);
    return () => {
      SocketService.off('emoji_reaction', onEmojiReaction);
    };
  }, []);

  const handleEmojiReaction = (reactionType: ReactionType) => {
    if (!roomId) return;
    const actualEmoji = getReactionEmoji(reactionType, user?.emojiPreferences);
    playReactionHaptic();
    SocketService.emit('emoji_reaction', { roomId, emoji: reactionType, actualEmoji });
  };

  const handleLongPressReaction = (reactionType: ReactionType) => {
    openEmojiPicker(reactionType);
    router.push(appRoutes.emojiPicker);
  };

  return {
    // State
    emojis,
    reactionButtons,
    emojiPreferences: user?.emojiPreferences,
    // Handlers
    handleEmojiReaction,
    handleLongPressReaction,
    removeEmoji,
  };
};
