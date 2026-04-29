import type { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

type ProfileStatsStateProps = {
  description: string;
  title?: string;
  leading?: ReactNode;
  children?: ReactNode;
};

export const ProfileStatsState = function ProfileStatsState({
  description,
  title,
  leading,
  children,
}: ProfileStatsStateProps) {
  return (
    <Box className="items-center py-xl px-md gap-md">
      {leading}
      {title ? (
        <Text className="text-center text-[18px] font-bold text-text-primary">{title}</Text>
      ) : null}
      <Text className="text-center text-[15px] leading-[22px] text-text-secondary max-w-[280px]">
        {description}
      </Text>
      {children}
    </Box>
  );
};
