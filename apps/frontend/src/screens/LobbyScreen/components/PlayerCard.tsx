/* jscpd:ignore-start */
import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
  theme,
} from '@/theme';
/* jscpd:ignore-end */

const PLAYER_ICON_TONE_CLASS_NAMES = {
  host: badgeToneClassNames.accent,
  bot: badgeToneClassNames.action,
  human: badgeToneClassNames.surface,
} as const;

const PLAYER_ROLE_TONE_CLASS_NAMES = {
  host: badgeToneClassNames.accent,
  bot: badgeToneClassNames.action,
  human: badgeToneClassNames.neutral,
} as const;

const PLAYER_ROLE_TEXT_TONE_CLASS_NAMES = {
  host: badgeTextToneClassNames.accent,
  bot: badgeTextToneClassNames.action,
  human: badgeTextToneClassNames.neutral,
} as const;

interface PlayerCardProps {
  name: string;
  isHost?: boolean;
  isBot?: boolean;
  isOnline?: boolean;
  onRenameBot?: () => void;
  canRemove?: boolean;
  onRemove?: () => void;
}

export const PlayerCard = ({
  name,
  isHost,
  isBot,
  isOnline,
  onRenameBot,
  canRemove,
  onRemove,
}: PlayerCardProps) => {
  const { t } = useAppTranslation('lobby');
  const initial = name.charAt(0).toUpperCase();
  const isOffline = !isBot && isOnline === false;
  const playerTone = isHost ? 'host' : isBot ? 'bot' : 'human';
  const roleLabel = isHost
    ? t('playerCard.host')
    : isBot
      ? t('playerCard.bot')
      : t('playerCard.human');

  return (
    <Box
      className={mergeClassNames(
        isHost ? panelClassNames.accentStrong : panelClassNames.subtleCard,
        'flex-row items-center rounded-[22px] px-4 py-3',
        surfaceEffectClassNames.card
      )}
    >
      <Box className="relative h-12 w-12">
        <Box
          className={mergeClassNames(
            badgeBaseClassNames.icon,
            'h-12 w-12 rounded-[18px]',
            PLAYER_ICON_TONE_CLASS_NAMES[playerTone]
          )}
        >
          <Text className="text-[20px] font-extrabold text-text-primary">{initial}</Text>
        </Box>
        {!isBot && (
          <Box
            className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2"
            style={{
              borderColor: isHost ? theme.surface.cardStrong : theme.surface.card,
              backgroundColor: isOffline ? theme.feedback.danger : theme.feedback.success,
            }}
          />
        )}
      </Box>
      <Box className="ml-3 min-w-0 flex-1">
        {isBot && onRenameBot ? (
          <Pressable className="self-start" onPress={onRenameBot} hitSlop={8}>
            <Text className="text-[18px] font-extrabold text-text-primary" numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        ) : (
          <Text className="text-[18px] font-extrabold text-text-primary" numberOfLines={1}>
            {name}
          </Text>
        )}
        <Box className="mt-1 flex-row flex-wrap items-center gap-2">
          <Box
            className={mergeClassNames(
              badgeBaseClassNames.chip,
              'px-3',
              PLAYER_ROLE_TONE_CLASS_NAMES[playerTone]
            )}
          >
            <Text
              className={mergeClassNames(
                'text-[13px] font-bold',
                PLAYER_ROLE_TEXT_TONE_CLASS_NAMES[playerTone]
              )}
            >
              {roleLabel}
            </Text>
          </Box>
          {!isBot ? (
            <Text
              className={mergeClassNames(
                'text-[13px] font-medium',
                isOffline ? badgeTextToneClassNames.danger : badgeTextToneClassNames.tertiary
              )}
            >
              {isOffline ? t('playerCard.offline') : t('playerCard.online')}
            </Text>
          ) : null}
        </Box>
      </Box>
      {canRemove && onRemove && (
        <Pressable
          className={mergeClassNames(
            'ml-2 h-9 w-9 items-center justify-center rounded-[16px] border',
            badgeToneClassNames.dangerSurface
          )}
          onPress={onRemove}
          hitSlop={8}
        >
          <Text
            className={mergeClassNames('text-[16px] font-bold', badgeTextToneClassNames.danger)}
          >
            ✕
          </Text>
        </Pressable>
      )}
    </Box>
  );
};
