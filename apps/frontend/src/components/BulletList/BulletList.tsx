import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';

import type { BulletListProps } from './BulletList.types';

const BULLET_LIST_VARIANT_CLASS_NAMES = {
  compact: {
    bullet: 'mr-2 w-4 text-xs font-bold text-feedback-info',
    root: 'gap-2',
    text: 'flex-1 text-xs leading-4 text-text-primary',
  },
  default: {
    bullet: 'mr-sm w-5 text-sm font-bold text-feedback-info',
    root: 'gap-2.5',
    text: 'flex-1 text-sm leading-5 text-text-primary',
  },
} as const;

export const BulletList = ({
  items,
  className,
  itemClassName,
  bulletClassName,
  textClassName,
  variant = 'default',
}: BulletListProps) => {
  const styles = BULLET_LIST_VARIANT_CLASS_NAMES[variant];

  return (
    <Box className={mergeClassNames(styles.root, className)}>
      {items.map((item) => (
        <Box key={item} className={mergeClassNames('flex-row items-start', itemClassName)}>
          <Text className={mergeClassNames(styles.bullet, bulletClassName)}>•</Text>
          <Text className={mergeClassNames(styles.text, textClassName)}>{item}</Text>
        </Box>
      ))}
    </Box>
  );
};
