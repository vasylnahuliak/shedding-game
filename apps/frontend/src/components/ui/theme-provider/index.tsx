import React, { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { type ThemeName, Uniwind } from 'uniwind';

type ModeType = ThemeName | 'system';

export function AppThemeProvider({
  mode = 'dark',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  useEffect(
    function syncTheme() {
      Uniwind.setTheme(mode);
    },
    [mode]
  );

  return (
    <View className="flex-1 h-full w-full" style={props.style}>
      {props.children}
    </View>
  );
}
