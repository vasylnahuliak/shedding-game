import React from 'react';
import type { TextProps } from 'react-native';
import { Text as RNText } from 'react-native';

import { mergeClassNames } from '../utils';

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type TextComponentProps = TextProps & {
  bold?: boolean;
  className?: string;
  highlight?: boolean;
  isTruncated?: boolean;
  italic?: boolean;
  ref?: React.Ref<RNText>;
  size?: TextSize;
  strikeThrough?: boolean;
  sub?: boolean;
  underline?: boolean;
};

const textSizeClassNames: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

function Text({
  ref,
  className,
  isTruncated,
  bold,
  underline,
  strikeThrough,
  size = 'md',
  sub,
  italic,
  highlight,
  ...props
}: TextComponentProps) {
  const resolvedNumberOfLines = props.numberOfLines ?? (isTruncated ? 1 : undefined);

  return (
    <RNText
      className={mergeClassNames(
        textSizeClassNames[size],
        bold && 'font-bold',
        underline && 'underline',
        strikeThrough && 'line-through',
        sub && 'text-xs',
        italic && 'italic',
        highlight && 'bg-yellow-500',
        className
      )}
      {...props}
      numberOfLines={resolvedNumberOfLines}
      ref={ref}
    />
  );
}

Text.displayName = 'Text';

export { Text };
