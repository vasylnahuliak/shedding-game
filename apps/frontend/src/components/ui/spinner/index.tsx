import React from 'react';
import { ActivityIndicator } from 'react-native';

type SpinnerProps = Omit<React.ComponentProps<typeof ActivityIndicator>, 'color'> & {
  className?: string;
  colorClassName?: string;
};

function Spinner({
  ref,
  className,
  focusable = false,
  'aria-label': ariaLabel = 'loading',
  ...props
}: SpinnerProps & { ref?: React.Ref<React.ComponentRef<typeof ActivityIndicator>> }) {
  return (
    <ActivityIndicator
      ref={ref}
      focusable={focusable}
      aria-label={ariaLabel}
      className={className}
      {...props}
    />
  );
}

Spinner.displayName = 'Spinner';

export { Spinner };
