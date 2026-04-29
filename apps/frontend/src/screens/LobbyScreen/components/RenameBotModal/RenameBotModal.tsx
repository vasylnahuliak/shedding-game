import {
  type BotPersonaName,
  formatBotDisplayName,
  getAvailableBotPersonaNames,
  getBotPersonaName,
} from '@shedding-game/shared';

/* jscpd:ignore-start */
import { useUpdateBotNameMutation } from '@/api';
import { ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { badgeTextToneClassNames, badgeToneClassNames, panelClassNames } from '@/theme';
import type { Player } from '@/types/rooms';
import { showErrorAlert } from '@/utils/alert';
/* jscpd:ignore-end */

type RenameBotModalContentProps = {
  roomId: string;
  botId: string;
  botName: string;
  players: Player[];
  onClose: () => void;
};

export const RenameBotModalContent = ({
  roomId,
  botId,
  botName,
  players,
  onClose,
}: RenameBotModalContentProps) => {
  const { t } = useAppTranslation(['alerts', 'common', 'lobby']);
  const updateBotNameMutation = useUpdateBotNameMutation();
  const availableNames = getAvailableBotPersonaNames(
    players.filter((player) => player.playerType === 'bot').map((player) => player.name),
    botName
  );
  const currentBotName = getBotPersonaName(botName);

  const handleRename = async (name: BotPersonaName) => {
    if (updateBotNameMutation.isPending) return;

    if (name === currentBotName) {
      onClose();
      return;
    }

    try {
      await updateBotNameMutation.mutateAsync({ roomId, botId, name });
      onClose();
    } catch {
      showErrorAlert(t('alerts:titles.error'), t('lobby:botRename.saveFailed'));
    }
  };

  return (
    <ModalShell
      title={t('lobby:screen.renameBotTitle')}
      onClose={onClose}
      buttons={[
        {
          variant: 'secondary',
          title: t('common:buttons.cancel'),
          disabled: updateBotNameMutation.isPending,
          onPress: onClose,
        },
      ]}
    >
      <Box className="shrink gap-md min-h-0">
        <Text className="text-sm leading-5 text-text-tertiary text-center">
          {t('lobby:botRename.subtitle')}
        </Text>

        {availableNames.length > 0 ? (
          <StyledScrollView
            className="shrink min-h-0"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-1"
          >
            {availableNames.map((name) => {
              const isCurrent = name === currentBotName;

              return (
                <Pressable
                  key={name}
                  className={mergeClassNames(
                    panelClassNames.strong,
                    'flex-row items-center justify-between gap-md rounded-[16px] px-md py-md disabled:opacity-60',
                    isCurrent ? badgeToneClassNames.accentSurfaceStrong : badgeToneClassNames.strong
                  )}
                  disabled={updateBotNameMutation.isPending}
                  onPress={() => {
                    void handleRename(name);
                  }}
                >
                  <Text className="flex-1 text-[16px] font-semibold text-text-primary">
                    {formatBotDisplayName(name)}
                  </Text>
                  {isCurrent ? (
                    <Text
                      className={mergeClassNames(
                        'text-[13px] font-bold',
                        badgeTextToneClassNames.accent
                      )}
                    >
                      {t('lobby:botRename.current')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </StyledScrollView>
        ) : (
          <Text className="text-sm leading-5 text-text-tertiary text-center">
            {t('lobby:botRename.empty')}
          </Text>
        )}
      </Box>
    </ModalShell>
  );
};
