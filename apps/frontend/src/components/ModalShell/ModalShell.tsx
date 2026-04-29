import type { ReactNode } from 'react';

import type { ButtonProps } from '@/components/Button';
import { Button } from '@/components/Button';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeBaseClassNames, badgeToneClassNames, modalHeaderClassNames } from '@/theme';

type ModalShellProps = {
  title: string;
  titleSuffix?: ReactNode;
  onClose?: () => void;
  subtitle?: string;
  buttons?: ButtonProps[];
  children?: ReactNode;
};

export const ModalShell = function ModalShell({
  title,
  titleSuffix,
  onClose,
  subtitle,
  buttons,
  children,
}: ModalShellProps) {
  return (
    <>
      <Box className={modalHeaderClassNames.root}>
        <Box
          className={mergeClassNames(
            modalHeaderClassNames.body,
            onClose && modalHeaderClassNames.bodyWithClose
          )}
        >
          <Box className={modalHeaderClassNames.titleRow}>
            <Text className={modalHeaderClassNames.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
            {titleSuffix ? (
              <Box
                className={mergeClassNames(badgeBaseClassNames.chip, badgeToneClassNames.accent)}
              >
                {titleSuffix}
              </Box>
            ) : null}
          </Box>
          {subtitle ? <Text className={modalHeaderClassNames.subtitle}>{subtitle}</Text> : null}
        </Box>
        {onClose ? (
          <Pressable className={modalHeaderClassNames.closeButton} onPress={onClose} hitSlop={10}>
            <Text className={modalHeaderClassNames.closeIcon}>✕</Text>
          </Pressable>
        ) : null}
      </Box>

      {children}

      {buttons && buttons.length > 0 && (
        <Box className="mt-5 flex-col justify-center gap-3">
          {buttons.map((button, index) => (
            <Button key={index} {...button} />
          ))}
        </Box>
      )}
    </>
  );
};
