import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

import { useGameScreenContext } from '../GameScreenContext';
import { GameSummaryModal } from '../GameSummaryModal';
import { useGameSummaryModalData } from '../useGameSummaryModalData';

import { useRoundOverReady } from './hooks';

const EMPTY_READY_PLAYER_IDS: string[] = [];

export const RoundOverModal = function RoundOverModal() {
  const { t, room, user, players, scoreHistory, discardPile, reshuffleCount } =
    useGameSummaryModalData('game');
  const { handleReadyNextRound } = useGameScreenContext();
  const currentUserId = user?.id ?? '';
  const readyForNextRoundPlayerIds = room?.readyForNextRoundPlayerIds ?? EMPTY_READY_PLAYER_IDS;
  const roundNumber = scoreHistory?.length || 1;
  const { isReady, allReady } = useRoundOverReady(
    players,
    currentUserId,
    readyForNextRoundPlayerIds
  );

  if (!room || !user) {
    return null;
  }

  const currentUser = players.find((p) => p.id === currentUserId);
  const isCurrentEliminated = (currentUser?.score ?? 0) >= SCORE_ELIMINATION_THRESHOLD;
  return (
    <GameSummaryModal
      title={t('roundOver.title', { round: roundNumber })}
      subtitle={t('roundOver.subtitle')}
      players={players}
      scoreHistory={scoreHistory}
      reshuffleCount={reshuffleCount}
      discardPile={discardPile}
      readyForNextRoundPlayerIds={readyForNextRoundPlayerIds}
      buttons={
        !allReady && !isCurrentEliminated
          ? [
              {
                variant: 'success' as const,
                title: t('roundOver.ready'),
                onPress: handleReadyNextRound,
                disabled: isReady,
              },
            ]
          : undefined
      }
    >
      {allReady && (
        <Box className="mt-4 self-center rounded-full border border-border-action-subtle bg-overlay-success-soft px-4 py-2">
          <Text className="text-center text-sm font-semibold text-feedback-success">
            {t('roundOver.allReady')}
          </Text>
        </Box>
      )}
    </GameSummaryModal>
  );
};
