import type { ReactElement, RefAttributes } from 'react';
import { ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LegendList, type LegendListProps, type LegendListRef } from '@legendapp/list/react-native';
import { type ApplyUniwind, withUniwind } from 'uniwind';

type StyledLegendListComponent = <ItemT = unknown>(
  props: ApplyUniwind<LegendListProps<ItemT>> & RefAttributes<LegendListRef>
) => ReactElement | null;

export const StyledAnimatedText = Animated.Text;
export const StyledAnimatedView = Animated.View;
export const StyledLegendList = withUniwind(LegendList) as StyledLegendListComponent;
export const StyledGestureHandlerRootView = withUniwind(GestureHandlerRootView);
export const StyledSafeAreaView = withUniwind(SafeAreaView);
export const StyledScrollView = ScrollView;
