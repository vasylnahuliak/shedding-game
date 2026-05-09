import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { ReactionType } from '@shedding-game/shared';

import { REACTIONS } from '@shedding-game/shared';

import { Emoji } from '@/components/Emoji';
import { Text } from '@/components/ui/text';
import { DEFAULT_REACTION_EMOJI, getReactionEmojiMap } from '@/shared/emoji';

import type { FloatingEmojiData } from './EmojiReactionOverlay.types';

const DURATION = 2800;
const FLOAT_HEIGHT = 250;
const DEFAULT_BUTTON_SIZE = 40;
const DEFAULT_BUTTON_GAP = 6;
const EMOJI_LINE_HEIGHT_MULTIPLIER = 1.2;

const reactionEmojiMap = getReactionEmojiMap();

/** Center position of a reaction button by its index */
const getButtonCenter = (index: number, buttonSize: number, buttonGap: number) =>
  index * (buttonSize + buttonGap) + buttonSize / 2;

let emojiCounter = 0;

/* ── Hook ─────────────────────────────────────────── */

export const useEmojiReactions = () => {
  const [emojis, setEmojis] = useState<FloatingEmojiData[]>([]);
  const emojisRef = useRef<FloatingEmojiData[]>([]);

  const removeEmoji = (id: number) => {
    emojisRef.current = emojisRef.current.filter((e) => e.id !== id);
    setEmojis([...emojisRef.current]);
  };

  const spawnReaction = (type: ReactionType, playerName: string, actualEmoji?: string) => {
    const id = ++emojiCounter;
    const reactionIndex = REACTIONS.findIndex((r) => r.id === type);
    const item: FloatingEmojiData = {
      id,
      reactionIndex: reactionIndex === -1 ? 0 : reactionIndex,
      size: 22 + Math.random() * 10,
      emoji: actualEmoji ?? reactionEmojiMap[type] ?? DEFAULT_REACTION_EMOJI,
      playerName,
    };
    emojisRef.current = [...emojisRef.current, item];
    setEmojis([...emojisRef.current]);
  };

  return { emojis, spawnReaction, removeEmoji };
};

/* ── Single floating emoji (reanimated) ───────────── */

interface FloatingEmojiProps extends FloatingEmojiData {
  direction: 'vertical' | 'horizontal';
  buttonSize: number;
  buttonGap: number;
  onDone: (id: number) => void;
}

const FloatingEmoji = function FloatingEmoji({
  id,
  reactionIndex,
  size,
  emoji,
  playerName,
  direction,
  buttonSize,
  buttonGap,
  onDone,
}: FloatingEmojiProps) {
  const progress = useSharedValue(0);
  const startPos = getButtonCenter(reactionIndex, buttonSize, buttonGap);
  const emojiLineHeight = Math.ceil(size * EMOJI_LINE_HEIGHT_MULTIPLIER);

  const handleDone = useEffectEvent((doneId: number) => {
    onDone(doneId);
  });

  useEffect(
    function startFloatingEmojiAnimation() {
      progress.value = 0;
      progress.value = withTiming(
        1,
        { duration: DURATION, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(handleDone, id);
        }
      );

      return () => {
        cancelAnimation(progress);
      };
    },
    [id, progress]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const baseStyle = {
      opacity: p < 0.1 ? p / 0.1 : p > 0.7 ? (1 - p) / 0.3 : 1,
      transform: [
        { translateY: -p * FLOAT_HEIGHT },
        { translateX: Math.sin(p * Math.PI * 3) * 6 },
        {
          scale:
            p < 0.15
              ? 0.3 + (p / 0.15) * 0.9
              : p < 0.3
                ? 1.2 - ((p - 0.15) / 0.15) * 0.2
                : 1 - ((p - 0.3) / 0.7) * 0.2,
        },
      ],
    };

    if (direction === 'horizontal') {
      return { ...baseStyle, left: startPos - 18 };
    }
    return { ...baseStyle, top: startPos };
  });

  return (
    <Animated.View
      className="absolute items-center self-center"
      pointerEvents="none"
      style={animatedStyle}
    >
      <Emoji
        allowFontScaling={false}
        className="text-center"
        emoji={emoji}
        size={size}
        style={{ fontSize: size, lineHeight: emojiLineHeight }}
      />
      <Text
        className="mt-px overflow-hidden rounded-[4px] bg-overlay-scrim-hero px-1 py-[1px] text-[9px] font-semibold text-text-primary"
        numberOfLines={1}
      >
        {playerName}
      </Text>
    </Animated.View>
  );
};

/* ── Overlay (renders inside reaction buttons container) ── */

interface Props {
  emojis: FloatingEmojiData[];
  direction?: 'vertical' | 'horizontal';
  buttonSize?: number;
  buttonGap?: number;
  onDone: (id: number) => void;
}

export const EmojiReactionOverlay = function EmojiReactionOverlay({
  emojis,
  direction = 'vertical',
  buttonSize = DEFAULT_BUTTON_SIZE,
  buttonGap = DEFAULT_BUTTON_GAP,
  onDone,
}: Props) {
  if (emojis.length === 0) return null;
  return (
    <View className="absolute inset-0 z-10 overflow-visible" pointerEvents="none">
      {emojis.map((e) => (
        <FloatingEmoji
          key={e.id}
          {...e}
          direction={direction}
          buttonSize={buttonSize}
          buttonGap={buttonGap}
          onDone={onDone}
        />
      ))}
    </View>
  );
};
