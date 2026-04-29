import { Box } from '@/components/ui/box';
import { mergeClassNames } from '@/components/ui/utils';

import type { CardListItemProps } from './CardListItem.types';

export const CardListItem = function CardListItem({
  children,
  className,
  style,
}: CardListItemProps) {
  return (
    <Box
      className={mergeClassNames(
        'rounded-[24px] border border-border-subtle bg-surface-card px-4 py-4 mb-4',
        className
      )}
      style={style}
    >
      {children}
    </Box>
  );
};
