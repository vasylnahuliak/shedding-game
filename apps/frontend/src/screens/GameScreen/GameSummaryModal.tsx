import type { ReactNode } from 'react';

import type { Card } from '@shedding-game/shared';

import type { ButtonProps } from '@/components/Button';
import { ModalShell } from '@/components/Modal';
import { RoundMultiplierBadge } from '@/components/RoundMultiplierBadge';
import { ScoreTable } from '@/components/ScoreTable';
import { type Player, type RoundScore } from '@/types/rooms';

import { GameSummaryContent } from './GameSummaryContent';

type GameSummaryModalProps = {
  title: string;
  subtitle?: string;
  buttons?: ButtonProps[];
  players: Player[];
  scoreHistory?: RoundScore[][];
  reshuffleCount: number;
  discardPile: Card[];
  readyForNextRoundPlayerIds?: string[];
  children?: ReactNode;
};

export const GameSummaryModal = ({
  title,
  subtitle,
  buttons,
  players,
  scoreHistory,
  reshuffleCount,
  discardPile,
  readyForNextRoundPlayerIds,
  children,
}: GameSummaryModalProps) => (
  <ModalShell
    title={title}
    titleSuffix={
      <RoundMultiplierBadge
        players={players}
        scoreHistory={scoreHistory}
        reshuffleCount={reshuffleCount}
      />
    }
    subtitle={subtitle}
    buttons={buttons}
  >
    <GameSummaryContent discardPile={discardPile} players={players} scoreHistory={scoreHistory} />
    <ScoreTable
      players={players}
      scoreHistory={scoreHistory}
      maxVisibleRows={1}
      readyForNextRoundPlayerIds={readyForNextRoundPlayerIds}
    />
    {children}
  </ModalShell>
);
