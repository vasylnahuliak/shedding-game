import { useEffect, useRef } from 'react';

import { analytics } from '@/services/analytics';

import { useGameScreenContext } from '../GameScreenContext';
import { GameSummaryModal } from '../GameSummaryModal';
import { useGameSummaryModalData } from '../useGameSummaryModalData';

export const GameOverModal = function GameOverModal() {
  const { t, room, user, players, scoreHistory, discardPile, reshuffleCount } =
    useGameSummaryModalData(['common', 'game']);
  const { winner, isHost, handleLeaveRoom, handlePlayAgain } = useGameScreenContext();
  const trackedCompletionRef = useRef<string | null>(null);
  const visible = room?.gameStatus === 'finished';
  const completionToken = room
    ? `${room.id}:${scoreHistory.length}:${room.winnerId ?? 'unknown'}`
    : null;
  const isWinner = winner?.id === user?.id;

  useEffect(
    function trackGameCompletion() {
      if (!visible || !completionToken || !user) {
        trackedCompletionRef.current = null;
        return;
      }

      if (trackedCompletionRef.current === completionToken) {
        return;
      }

      trackedCompletionRef.current = completionToken;
      analytics.track('game_finished', {
        did_win: isWinner,
        is_host: isHost,
        player_count: players.length,
        rounds_completed: scoreHistory.length,
        reshuffle_count: reshuffleCount,
      });
    },
    [
      completionToken,
      isHost,
      isWinner,
      players.length,
      reshuffleCount,
      scoreHistory.length,
      user,
      visible,
    ]
  );

  if (!room || !user) {
    return null;
  }

  const winnerName = winner?.name || t('common:defaults.unknownWinner');

  return (
    <GameSummaryModal
      title={isWinner ? t('game:gameOver.win') : t('game:gameOver.lose')}
      subtitle={!isWinner ? t('game:gameOver.winner', { name: winnerName }) : undefined}
      players={players}
      scoreHistory={scoreHistory}
      reshuffleCount={reshuffleCount}
      discardPile={discardPile}
      buttons={[
        ...(isHost
          ? [
              {
                variant: 'success' as const,
                title: t('game:gameOver.playAgain'),
                onPress: handlePlayAgain,
              },
            ]
          : []),
        {
          variant: 'danger',
          title: t('game:gameOver.leaveRoom'),
          onPress: handleLeaveRoom,
        },
      ]}
    />
  );
};
