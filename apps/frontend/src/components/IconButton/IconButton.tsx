import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeToneClassNames, surfaceEffectClassNames } from '@/theme';

type IconButtonTone = 'surface' | 'surfaceMuted' | 'accent' | 'danger' | 'action';
type IconButtonSize = 'md' | 'lg';

interface IconButtonProps extends Omit<ComponentProps<typeof Pressable>, 'children' | 'style'> {
  emoji: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  emojiClassName?: string;
  style?: StyleProp<ViewStyle>;
}

const sizeClassNames: Record<IconButtonSize, string> = {
  md: 'h-[42px] w-[42px] rounded-[16px]',
  lg: 'h-[44px] w-[44px] rounded-[18px]',
};

const toneClassNames: Record<IconButtonTone, string> = {
  surface: badgeToneClassNames.cardSurface,
  surfaceMuted: badgeToneClassNames.strongDefault,
  accent: badgeToneClassNames.accent,
  danger: badgeToneClassNames.dangerSurface,
  action: badgeToneClassNames.action,
};

export const IconButton = ({
  emoji,
  tone = 'surfaceMuted',
  size = 'md',
  className,
  emojiClassName,
  style,
  ...pressableProps
}: IconButtonProps) => {
  return (
    <Pressable
      className={mergeClassNames(
        sizeClassNames[size],
        'items-center justify-center border',
        toneClassNames[tone],
        surfaceEffectClassNames.card,
        className
      )}
      style={style}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...pressableProps}
    >
      <Text
        className={
          emojiClassName
            ? `${emojiClassName} text-shadow-emphasis`
            : 'text-[18px] text-shadow-emphasis'
        }
      >
        {emoji}
      </Text>
    </Pressable>
  );
};
