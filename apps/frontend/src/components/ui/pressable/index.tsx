import type { ComponentProps, ComponentRef, Ref } from 'react';
import { Pressable as RNPressable } from 'react-native';

import { mergeClassNames } from '../utils';

type PressableProps = Omit<ComponentProps<typeof RNPressable>, 'ref'> & {
  className?: string;
  ref?: Ref<ComponentRef<typeof RNPressable>>;
};

function Pressable({ className, disabled = false, ref, ...props }: PressableProps) {
  return (
    <RNPressable
      {...props}
      ref={ref}
      disabled={disabled}
      className={mergeClassNames('active:opacity-90 disabled:opacity-40', className)}
    />
  );
}

export { Pressable };
