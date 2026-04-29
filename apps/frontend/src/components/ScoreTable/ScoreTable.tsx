import { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';

import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import type { RoundScore } from '@/types/rooms';

import type { ScoreTableProps } from './ScoreTable.types';

const ROW_HEIGHT = 34;

const getEmoji = (event?: RoundScore['event']) => {
  if (!event) return '';
  switch (event.type) {
    case 'reset_115':
      return ' 🔥';
    case 'eliminated':
      return ' 💀';
    case 'jack_bonus':
      return ' 🃏';
    case 'bridge':
      return ' 🌉';
    default:
      return '';
  }
};

const DEFAULT_MAX_VISIBLE_ROWS = 4;

/** Round index when player was eliminated (-1 if not in history). */
const getEliminatedRoundIndex = (playerId: string, history: RoundScore[][]): number =>
  history.findIndex((round) =>
    round.some((s) => s.playerId === playerId && s.event?.type === 'eliminated')
  );

export const ScoreTable = ({
  players,
  scoreHistory,
  maxVisibleRows = DEFAULT_MAX_VISIBLE_ROWS,
  readyForNextRoundPlayerIds,
}: ScoreTableProps) => {
  const { t } = useAppTranslation('game');
  const history = scoreHistory ?? [];
  const scrollRef = useRef<ScrollView>(null);

  useEffect(
    function scrollToLatestScoreRow() {
      scrollRef.current?.scrollToEnd({ animated: false });
    },
    [history.length]
  );

  const roundCellBase =
    'w-[44px] border-r border-r-border-default py-1.5 text-center text-[17px] text-text-muted';
  const dataCellBase =
    'flex-1 border-r border-r-border-default py-1.5 text-center text-[17px] text-text-muted';

  return (
    <Box className="min-h-[100px] min-w-[280px] w-full self-stretch overflow-hidden rounded-[6px] border border-border-strong">
      <Box className="h-[34px] w-full flex-row items-center border-b border-b-border-default">
        <Text
          className="w-[44px] border-r border-r-border-default py-1.5 text-center text-sm font-semibold text-text-primary"
          numberOfLines={1}
        >
          #
        </Text>
        {players.map((p) => {
          const ready = readyForNextRoundPlayerIds
            ? readyForNextRoundPlayerIds.includes(p.id)
            : true;
          return (
            <Text
              key={p.id}
              className={`flex-1 border-r border-r-border-default py-1.5 text-center text-sm font-semibold ${ready ? 'text-text-primary' : 'text-text-placeholder'}`}
              numberOfLines={1}
            >
              {p.isLeaver ? `${p.name} ${t('scoreTable.leaverSuffix')}` : p.name}
            </Text>
          );
        })}
      </Box>
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: ROW_HEIGHT * maxVisibleRows }}
        showsVerticalScrollIndicator={false}
      >
        {history.map((round, roundIdx) => (
          <Box
            key={roundIdx}
            className="h-[34px] w-full flex-row items-center border-b border-b-border-default"
          >
            <Text className={roundCellBase}>{roundIdx + 1}</Text>
            {players.map((p) => {
              const eliminatedAt = getEliminatedRoundIndex(p.id, history);
              const isAfterElimination = eliminatedAt >= 0 && roundIdx > eliminatedAt;
              const ps = round.find((s) => s.playerId === p.id);
              const change = ps?.scoreChange ?? 0;
              const emoji = getEmoji(ps?.event);
              const showValue = !isAfterElimination;
              const hasEmptyHand = Array.isArray(p.hand) ? p.hand.length === 0 : false;
              const isMostRecentRound = roundIdx === history.length - 1;
              const finishedByBridge = ps?.event?.type === 'bridge';
              const isRoundFinisher =
                showValue && isMostRecentRound && (hasEmptyHand || finishedByBridge);
              return (
                <Text
                  key={p.id}
                  className={mergeClassNames(
                    dataCellBase,
                    showValue && change <= 0 && 'font-semibold text-feedback-success',
                    isRoundFinisher && 'bg-overlay-success-soft'
                  )}
                >
                  {showValue ? `${change > 0 ? '+' : ''}${change}${emoji}` : ''}
                </Text>
              );
            })}
          </Box>
        ))}
      </ScrollView>
      <Box className="h-[34px] w-full flex-row items-center border-y border-y-border-default">
        <Text className={roundCellBase}>∑</Text>
        {players.map((p) => {
          const isEliminated = p.score >= SCORE_ELIMINATION_THRESHOLD;
          return (
            <Text
              key={p.id}
              className={`flex-1 border-r border-r-border-default py-1.5 text-center text-lg font-bold text-text-primary ${isEliminated ? 'bg-overlay-danger-soft text-feedback-danger' : ''}`}
            >
              {p.score}
              {isEliminated && ' 💀'}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
};
