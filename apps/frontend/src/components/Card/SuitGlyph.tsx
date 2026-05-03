import type { Suit, SuitDisplayMode } from '@shedding-game/shared';

import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { getSuitSymbol, getSuitTextClassName } from '@/utils/card';

type SuitGlyphProps = {
  className: string;
  suit: Suit;
  suitDisplayMode?: SuitDisplayMode;
};

export const SuitGlyph = ({ className, suit, suitDisplayMode }: SuitGlyphProps) => (
  <Text className={mergeClassNames(className, getSuitTextClassName(suit, suitDisplayMode))}>
    {getSuitSymbol(suit)}
  </Text>
);
