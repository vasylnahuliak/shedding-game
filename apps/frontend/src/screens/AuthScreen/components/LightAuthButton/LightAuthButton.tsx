import type { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';

type LightAuthButtonProps = {
  children?: ReactNode;
  iconSlotClassName?: string;
  isBusy: boolean;
  label: string;
  labelClassName?: string;
  onPress: () => void;
};

export const LightAuthButton = ({
  children,
  iconSlotClassName,
  isBusy,
  label,
  labelClassName,
  onPress,
}: LightAuthButtonProps) => (
  <Pressable
    className="min-h-[60px] flex-row items-center rounded-[24px] border border-[#DADCE0] bg-[#FFFFFF] pl-6 pr-5 disabled:opacity-65"
    onPress={onPress}
    disabled={isBusy}
    accessibilityRole="button"
  >
    <Box
      className={mergeClassNames('mr-3.5 h-9 w-9 items-center justify-center', iconSlotClassName)}
    >
      {children}
    </Box>
    <Box className="flex-1 min-h-9 justify-center">
      <Text
        className={mergeClassNames(
          'text-left text-[16px] font-bold leading-5 text-[#1F1F1F]',
          labelClassName
        )}
      >
        {label}
      </Text>
    </Box>
  </Pressable>
);
