import { useMemo, useState } from 'react';
import type { ImageStyle, StyleProp, TextProps, TextStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';

import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';

const TWEMOJI_BASE_URL = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/72x72';
const VARIATION_SELECTOR_16 = 0xfe0f;
const COMBINING_ENCLOSING_KEYCAP = 0x20e3;
const ZERO_WIDTH_JOINER = 0x200d;
const DEFAULT_EMOJI_PRESENTATION_CODE_POINTS = new Set([
  0x00a9, 0x00ae, 0x203c, 0x2049, 0x2122, 0x2139, 0x231a, 0x231b, 0x23e9, 0x23ea, 0x23eb, 0x23ec,
  0x23f0, 0x23f3, 0x25fd, 0x25fe, 0x2614, 0x2615, 0x2648, 0x2649, 0x264a, 0x264b, 0x264c, 0x264d,
  0x264e, 0x264f, 0x2650, 0x2651, 0x2652, 0x2653, 0x267f, 0x2693, 0x26a1, 0x26aa, 0x26ab, 0x26bd,
  0x26be, 0x26c4, 0x26c5, 0x26ce, 0x26d4, 0x26ea, 0x26f2, 0x26f3, 0x26f5, 0x26fa, 0x26fd, 0x2705,
  0x270a, 0x270b, 0x2728, 0x274c, 0x274e, 0x2753, 0x2754, 0x2755, 0x2757, 0x2764, 0x2795, 0x2796,
  0x2797, 0x27b0, 0x27bf, 0x2b1b, 0x2b1c, 0x2b50, 0x2b55,
]);

const TEXT_SIZE_CLASS_NAME_TO_FONT_SIZE: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
  'text-6xl': 60,
};

type EmojiProps = Omit<TextProps, 'children'> & {
  className?: string;
  emoji: string;
  imageStyle?: StyleProp<ImageStyle>;
  size?: number;
  style?: StyleProp<TextStyle>;
};

const getCodePoints = (emoji: string): number[] =>
  Array.from(emoji.trim())
    .map((character) => character.codePointAt(0))
    .filter((codePoint): codePoint is number => typeof codePoint === 'number');

const isProbablyEmojiCodePoint = (codePoint: number) =>
  codePoint === VARIATION_SELECTOR_16 ||
  codePoint === COMBINING_ENCLOSING_KEYCAP ||
  codePoint === ZERO_WIDTH_JOINER ||
  DEFAULT_EMOJI_PRESENTATION_CODE_POINTS.has(codePoint) ||
  (codePoint >= 0x1f000 && codePoint <= 0x1faff);

const hasEmojiPresentationHint = (codePoints: number[]) =>
  codePoints.includes(VARIATION_SELECTOR_16) ||
  codePoints.includes(COMBINING_ENCLOSING_KEYCAP) ||
  codePoints.some((codePoint) => codePoint >= 0x1f000);

const isProbablyEmoji = (emoji: string) => {
  const codePoints = getCodePoints(emoji);

  if (codePoints.length === 0) {
    return false;
  }

  if (hasEmojiPresentationHint(codePoints)) {
    return true;
  }

  return codePoints.some(isProbablyEmojiCodePoint);
};

const getTwemojiCodePoint = (emoji: string): string | null => {
  if (!isProbablyEmoji(emoji)) {
    return null;
  }

  const codePoint = getCodePoints(emoji)
    .filter((value) => value !== VARIATION_SELECTOR_16)
    .map((value) => value.toString(16))
    .join('-');

  return codePoint.length > 0 ? codePoint : null;
};

const getTwemojiUri = (emoji: string) => {
  const codePoint = getTwemojiCodePoint(emoji);

  return codePoint ? `${TWEMOJI_BASE_URL}/${codePoint}.png` : null;
};

const getFontSizeFromClassName = (className?: string) => {
  if (!className) {
    return undefined;
  }

  const arbitrarySize = /(?:^|\s)text-\[(\d+(?:\.\d+)?)px\](?:\s|$)/.exec(className);

  if (arbitrarySize?.[1]) {
    return Number(arbitrarySize[1]);
  }

  return className
    .split(/\s+/)
    .map((classNamePart) => TEXT_SIZE_CLASS_NAME_TO_FONT_SIZE[classNamePart])
    .find((fontSize): fontSize is number => typeof fontSize === 'number');
};

const getResolvedSize = (
  size: number | undefined,
  className: string | undefined,
  style: StyleProp<TextStyle>
) => {
  if (typeof size === 'number') {
    return size;
  }

  const flattenedStyle = StyleSheet.flatten(style);

  if (typeof flattenedStyle?.fontSize === 'number') {
    return flattenedStyle.fontSize;
  }

  return getFontSizeFromClassName(className) ?? 20;
};

export const Emoji = ({
  accessibilityLabel,
  accessible,
  allowFontScaling = false,
  className,
  emoji,
  imageStyle,
  size,
  style,
  testID,
  ...textProps
}: EmojiProps) => {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = useMemo(() => getTwemojiUri(emoji), [emoji]);
  const resolvedSize = getResolvedSize(size, className, style);
  const shouldRenderTwemoji =
    (Platform.OS === 'android' || Platform.OS === 'ios') && uri && failedUri !== uri;

  if (!shouldRenderTwemoji) {
    return (
      <Text
        {...textProps}
        accessibilityLabel={accessibilityLabel}
        accessible={accessible}
        allowFontScaling={allowFontScaling}
        className={className}
        style={style}
        testID={testID}
      >
        {emoji}
      </Text>
    );
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel ?? emoji}
      accessible={accessible}
      cachePolicy="memory-disk"
      contentFit="contain"
      onError={() => setFailedUri(uri)}
      source={{ uri }}
      style={[{ height: resolvedSize, width: resolvedSize }, imageStyle]}
      testID={testID}
    />
  );
};
