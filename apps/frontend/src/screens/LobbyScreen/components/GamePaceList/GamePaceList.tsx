import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useCanAccessAdmin } from '@/hooks';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';
import { GAME_PACE_EMOJIS, getGamePaceDescription, getGamePaceOptions } from '@/utils/gamePace';

import type { GamePaceListProps } from './GamePaceList.types';

export const GamePaceList = ({ selected, onSelect, disabled = false }: GamePaceListProps) => {
  const { t, i18n } = useAppTranslation('rooms');
  const canAccessAdmin = useCanAccessAdmin();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const gamePaceOptions = getGamePaceOptions(canAccessAdmin);

  return (
    <Box className="gap-3.5">
      {gamePaceOptions.map(({ key, titleKey }) => {
        const isSelected = selected === key;
        const description = getGamePaceDescription(locale, key, t);
        const title = t(titleKey);

        return (
          <Pressable
            key={key}
            className={mergeClassNames(
              panelClassNames.strong,
              'gap-3 rounded-[18px] px-4 py-3.5',
              isSelected ? badgeToneClassNames.accentSurfaceStrong : badgeToneClassNames.strong,
              isSelected && surfaceEffectClassNames.accent
            )}
            disabled={disabled}
            onPress={() => {
              onSelect(key);
            }}
          >
            <Box className="flex-row items-start gap-3">
              <Box
                className={mergeClassNames(
                  'h-12 w-12 items-center justify-center rounded-[16px]',
                  isSelected ? badgeToneClassNames.accentEmphasis : badgeToneClassNames.surface
                )}
              >
                <Emoji emoji={GAME_PACE_EMOJIS[key]} className="text-[26px]" size={26} />
              </Box>
              <Box className="flex-1 gap-1.5 pt-0.5">
                <Box className="flex-row justify-between items-start gap-3">
                  <Text className="flex-1 text-[16px] font-bold text-text-primary">{title}</Text>
                  {isSelected ? (
                    <Box
                      className={mergeClassNames(
                        badgeBaseClassNames.chip,
                        badgeToneClassNames.accentEmphasis
                      )}
                    >
                      <Text
                        className={mergeClassNames(
                          'text-[11px] font-bold',
                          badgeTextToneClassNames.accent
                        )}
                      >
                        {t('gamePaceDetails.selectedBadge')}
                      </Text>
                    </Box>
                  ) : null}
                </Box>
                <Text className="text-[14px] leading-5 text-text-secondary">{description}</Text>
              </Box>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
};
