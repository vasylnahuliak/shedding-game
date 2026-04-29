import type { TextStyle, ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeBaseClassNames, badgeTextToneClassNames, badgeToneClassNames } from '@/theme';

type BadgeVariant = 'primary' | 'secondary' | 'host' | 'guest';

const variantClassNames: Record<BadgeVariant, string> = {
  primary: badgeToneClassNames.primary,
  secondary: badgeToneClassNames.strong,
  host: badgeToneClassNames.accent,
  guest: badgeToneClassNames.action,
};

const textVariantClassNames: Record<BadgeVariant, string> = {
  primary: badgeTextToneClassNames.primary,
  secondary: badgeTextToneClassNames.neutral,
  host: badgeTextToneClassNames.accent,
  guest: badgeTextToneClassNames.action,
};

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge = ({ text, variant = 'primary', style, textStyle }: BadgeProps) => {
  return (
    <Box
      className={mergeClassNames(badgeBaseClassNames.pillLabel, variantClassNames[variant])}
      style={style}
    >
      <Text
        className={mergeClassNames('text-[14px] font-bold', textVariantClassNames[variant])}
        style={textStyle}
      >
        {text}
      </Text>
    </Box>
  );
};
