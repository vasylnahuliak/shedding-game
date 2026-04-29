import type { ReactNode } from 'react';

import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { surfaceEffectClassNames, theme } from '@/theme';

type HeaderRightRenderer = () => ReactNode;

type CreateStackHeaderOptionsArgs = {
  fallbackHref?: Href;
  headerRight?: HeaderRightRenderer;
};

const StackHeaderBackButton = ({ fallbackHref = appRoutes.home }: { fallbackHref?: Href }) => {
  const router = useRouter();
  const { t } = useAppTranslation('common');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  };

  return (
    <Pressable
      className={`min-h-[44px] min-w-[44px] flex-row items-center gap-1.5 rounded-full border border-border-default bg-overlay-scrim px-3.5 ${surfaceEffectClassNames.card}`}
      onPress={handleBack}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={t('buttons.back')}
    >
      <Text className="text-[16px] font-bold text-text-accent">←</Text>
      <Text className="text-[14px] font-semibold text-text-secondary">{t('buttons.back')}</Text>
    </Pressable>
  );
};

export const createStackHeaderOptions = (
  title: string,
  { fallbackHref, headerRight }: CreateStackHeaderOptionsArgs = {}
): NativeStackNavigationOptions => ({
  headerShown: true,
  headerBackVisible: false,
  title,
  headerTitleAlign: 'center',
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
  headerLeft: () => (
    <Box className="ml-4">
      <StackHeaderBackButton fallbackHref={fallbackHref} />
    </Box>
  ),
  headerStyle: {
    backgroundColor: theme.surface.screen,
  },
  headerTintColor: theme.text.accent,
  headerTitleStyle: {
    color: theme.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerRight: headerRight ? () => <Box className="mr-4">{headerRight()}</Box> : undefined,
});
