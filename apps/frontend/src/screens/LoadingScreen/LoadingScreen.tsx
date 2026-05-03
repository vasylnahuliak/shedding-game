import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SUITS } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import {
  StyledAnimatedText,
  StyledAnimatedView,
  StyledSafeAreaView,
} from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { APP_ENV } from '@/config';
import { useAppTranslation } from '@/i18n';
import { shadowClassNames } from '@/theme';
import { appBuildInfo } from '@/utils/appBuildInfo';
import { getSuitSymbol, getSuitTextClassName } from '@/utils/card';

const isLocalEnv = APP_ENV === 'local';
const envLabelByAppEnv = {
  local: 'common:env.local',
  staging: 'common:env.staging',
  production: 'common:env.production',
} as const;

const loadingSuitCardClassName = mergeClassNames(
  'absolute h-[50px] w-9 items-center justify-center rounded-[6px] border border-border-accent bg-surface-card-face',
  shadowClassNames.subtle
);

export const LoadingScreen = () => {
  const { t } = useAppTranslation(['common', 'game']);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  const fade = useSharedValue(0);

  useEffect(
    function startLoadingAnimations() {
      fade.value = withTiming(1, { duration: 400 });

      spin.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);

      pulse.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    },
    [fade, spin, pulse]
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0.6, 1], [0.6, 1]),
  }));

  return (
    <StyledSafeAreaView className="flex-1 bg-surface-screen">
      <StyledAnimatedView
        className="flex-1 items-center justify-center p-xl"
        style={containerStyle}
      >
        <Box className="w-[120px] h-[120px] justify-center items-center mb-10">
          <StyledAnimatedView
            className="h-[120px] w-[120px] items-center justify-center"
            style={spinStyle}
          >
            {SUITS.map((suit, index) => (
              <View
                key={suit}
                className={loadingSuitCardClassName}
                style={[
                  [
                    { top: 0, left: 42 },
                    { right: 0, top: 35 },
                    { bottom: 0, left: 42 },
                    { left: 0, top: 35 },
                  ][index] as ViewStyle,
                ]}
              >
                <Text
                  className={mergeClassNames(
                    'text-xl font-bold text-text-on-card-face',
                    getSuitTextClassName(suit)
                  )}
                >
                  {getSuitSymbol(suit)}
                </Text>
              </View>
            ))}
          </StyledAnimatedView>
        </Box>

        <StyledAnimatedText
          className="text-center text-2xl font-bold text-text-primary text-shadow-subtle"
          style={pulseStyle}
        >
          {t('game:loading.title')}
        </StyledAnimatedText>
        <Text className="text-sm text-text-secondary mt-sm text-center">
          {t('game:loading.subtitle')}
        </Text>
      </StyledAnimatedView>

      <Box className="absolute bottom-[52px] self-center rounded-lg bg-surface-icon-button px-2.5 py-[3px]">
        <Text
          className={`text-[11px] font-semibold uppercase tracking-[1px] ${
            isLocalEnv ? 'text-feedback-warning' : 'text-feedback-success'
          }`}
        >
          {t(envLabelByAppEnv[APP_ENV])}
        </Text>
      </Box>
      <Text className="absolute bottom-8 self-center text-[11px] text-text-muted text-center">
        v{appBuildInfo.version} • {appBuildInfo.buildTime}
      </Text>
    </StyledSafeAreaView>
  );
};
