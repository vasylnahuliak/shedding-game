import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

type BoxProps = ViewProps & { className?: string; ref?: React.Ref<View> };

function Box({ ref, className, ...props }: BoxProps) {
  return <View ref={ref} className={className} {...props} />;
}

Box.displayName = 'Box';
export { Box };
