import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import type { AppLocale } from '@shedding-game/shared';

import { resolveAppLocale } from '@shedding-game/shared';

import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { surfaceEffectClassNames } from '@/theme';
import { showErrorAlert } from '@/utils/alert';

type LanguageSwitcherProps = {
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
  variant?: 'compact' | 'panel';
};

const OPTIONS: { locale: AppLocale; flag: string }[] = [
  { locale: 'uk', flag: '🇺🇦' },
  { locale: 'en', flag: '🇬🇧' },
];

export const LanguageSwitcher = ({
  style,
  showLabel = false,
  variant = 'compact',
}: LanguageSwitcherProps) => {
  const setLocale = useAuth((state) => state.setLocale);
  const { t, i18n } = useAppTranslation(['common', 'alerts']);
  const [isPending, setIsPending] = useState(false);

  const currentLocale = resolveAppLocale(i18n.language);
  const isPanel = variant === 'panel';

  const onSelect = async (locale: AppLocale) => {
    if (isPending || currentLocale === locale) {
      return;
    }

    setIsPending(true);
    try {
      await setLocale(locale);
    } catch {
      showErrorAlert(t('alerts:titles.error'), t('common:language.saveFailed'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Box className={isPanel ? 'w-full gap-3' : 'items-center gap-2'} style={style}>
      {showLabel && (
        <Text className="text-xs font-bold uppercase tracking-[0.8px] text-text-tertiary">
          {t('common:language.label')}
        </Text>
      )}
      <Box
        className={mergeClassNames(
          isPanel
            ? 'w-full flex-row items-center rounded-[24px] border border-border-default bg-surface-card-strong p-1.5'
            : 'flex-row items-center rounded-[20px] border border-border-default bg-surface-card px-1.5 py-1.5',
          surfaceEffectClassNames.card
        )}
      >
        {OPTIONS.map((option) => {
          const isActive = option.locale === currentLocale;

          return (
            <Pressable
              key={option.locale}
              className={mergeClassNames(
                isPanel
                  ? 'min-h-[52px] flex-1 flex-row items-center justify-center rounded-[18px] px-3 py-2'
                  : 'min-h-[42px] min-w-[64px] flex-row items-center justify-center rounded-[16px] px-3 py-2',
                isActive ? 'bg-text-accent' : isPanel ? 'bg-surface-card' : 'bg-transparent',
                isPending && 'opacity-70',
                isActive && surfaceEffectClassNames.accent
              )}
              onPress={() => {
                void onSelect(option.locale);
              }}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={`${t('common:language.label')} ${option.locale.toUpperCase()}`}
            >
              <Box className="mr-2">
                <Emoji
                  emoji={option.flag}
                  className={isPanel ? 'text-[18px]' : 'text-[17px]'}
                  size={isPanel ? 18 : 17}
                />
              </Box>
              <Text
                className={mergeClassNames(
                  isPanel
                    ? 'text-[14px] font-extrabold tracking-[0.6px]'
                    : 'text-[13px] font-extrabold tracking-[0.6px]',
                  isActive ? 'text-text-on-accent' : 'text-text-secondary'
                )}
              >
                {option.locale.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
};
