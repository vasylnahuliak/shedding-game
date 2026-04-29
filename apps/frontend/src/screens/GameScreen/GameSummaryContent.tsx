import type { Card } from '@shedding-game/shared';

import { modalScrollAreaClassName } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';
import { type Player, type RoundScore } from '@/types/rooms';

import { DiscardPileDisplay } from './DiscardPileDisplay';
import { PlayerHandsDisplay } from './PlayerHandsDisplay';
import { getPlayersToShowHands } from './utils/getPlayersToShowHands';

type GameSummaryContentProps = {
  discardPile: Card[];
  players: Player[];
  scoreHistory?: RoundScore[][];
};

export const GameSummaryContent = ({
  discardPile,
  players,
  scoreHistory,
}: GameSummaryContentProps) => (
  <StyledScrollView
    className={modalScrollAreaClassName}
    contentContainerClassName="gap-5 pb-4"
    showsVerticalScrollIndicator={false}
  >
    <Box className="gap-5">
      <DiscardPileDisplay discardPile={discardPile} />
      <PlayerHandsDisplay players={getPlayersToShowHands(players, scoreHistory)} />
    </Box>
  </StyledScrollView>
);
