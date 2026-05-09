import type { ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { mergeClassNames } from '@/components/ui/utils';
import { useEmojiReactionHandlers } from '@/hooks';

import { EmojiReactionOverlay } from '../EmojiReactionOverlay/EmojiReactionOverlay';

const BUTTON_GAP = 6;
const EMOJI_LINE_HEIGHT_MULTIPLIER = 1.2;

interface EmojiReactionButtonsProps {
  roomId: string;
  direction?: 'vertical' | 'horizontal';
  buttonSize?: number;
  variant?: 'default' | 'game';
  style?: ViewStyle;
}

export const EmojiReactionButtons = function EmojiReactionButtons({
  roomId,
  direction = 'vertical',
  buttonSize = 40,
  variant = 'default',
  style,
}: EmojiReactionButtonsProps) {
  const { emojis, reactionButtons, handleEmojiReaction, handleLongPressReaction, removeEmoji } =
    useEmojiReactionHandlers(roomId);

  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
  };

  const fontSize = buttonSize * 0.62;
  const emojiLineHeight = Math.ceil(fontSize * EMOJI_LINE_HEIGHT_MULTIPLIER);

  return (
    <Box
      className={mergeClassNames(
        'items-center gap-[6px]',
        direction === 'horizontal' ? 'flex-row' : 'flex-col'
      )}
      style={style}
    >
      <EmojiReactionOverlay
        emojis={emojis}
        direction={direction}
        buttonSize={buttonSize}
        buttonGap={BUTTON_GAP}
        onDone={removeEmoji}
      />
      {reactionButtons.map((r) => (
        <Pressable
          key={r.id}
          className={mergeClassNames(
            'items-center justify-center bg-transparent border-0',
            variant === 'game' && 'border-transparent'
          )}
          style={buttonStyle}
          onPress={() => handleEmojiReaction(r.id)}
          onLongPress={() => handleLongPressReaction(r.id)}
          delayLongPress={400}
        >
          <Emoji
            allowFontScaling={false}
            className="text-center text-shadow-emphasis"
            emoji={r.emoji}
            size={fontSize}
            style={{
              fontSize,
              lineHeight: emojiLineHeight,
            }}
          />
        </Pressable>
      ))}
    </Box>
  );
};
