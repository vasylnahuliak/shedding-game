import type { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { surfaceEffectClassNames } from '@/theme';

type ProfileSectionCardProps = {
  children: ReactNode;
  hint?: string;
  title?: string;
  tone?: 'default' | 'danger';
};

export const ProfileSectionCard = ({
  children,
  hint,
  title,
  tone = 'default',
}: ProfileSectionCardProps) => {
  const isDanger = tone === 'danger';

  return (
    <Box
      className={`rounded-[28px] border px-5 py-5 ${isDanger ? 'border-border-danger bg-surface-card-closed' : 'border-border-accent-subtle bg-surface-card'} ${surfaceEffectClassNames.prominent}`}
    >
      {title || hint ? (
        <Box className="mb-4 gap-2">
          {title ? (
            <Text className="text-[18px] font-extrabold text-text-primary">{title}</Text>
          ) : null}
          {hint ? (
            <Text
              className={`text-[15px] leading-6 ${isDanger ? 'text-feedback-danger' : 'text-text-tertiary'}`}
            >
              {hint}
            </Text>
          ) : null}
        </Box>
      ) : null}
      {children}
    </Box>
  );
};
