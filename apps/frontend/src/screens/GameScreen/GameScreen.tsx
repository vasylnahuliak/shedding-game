import { Box } from '@/components/ui/box';
import { StyledSafeAreaView } from '@/components/ui/interop';
import { mergeClassNames } from '@/components/ui/utils';
import { useGameScreenStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { shadowClassNames } from '@/theme';

import { LoadingScreen } from '../LoadingScreen';

import { CardAnimationLayer } from './CardAnimationLayer';
import { CenterArea } from './CenterArea';
import { GameHeader } from './GameHeader';
import { useGameScreenContext } from './GameScreenContext';
import { OpponentsArea } from './OpponentsArea';
import { PlayerHand } from './PlayerHand';

export const GameScreen = () => {
  const room = useGameScreenStore((state) => state.room);
  const user = useAuth((state) => state.user);
  const { gameWrapperRef, animationLayerRef } = useGameScreenContext();

  if (!room || !user) {
    return <LoadingScreen />;
  }

  return (
    <StyledSafeAreaView
      className="flex-1 bg-surface-screen"
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Box className="flex-1 w-full items-center bg-surface-screen px-2.5" ref={gameWrapperRef}>
        <Box
          className={mergeClassNames(
            'flex-1 w-full overflow-hidden rounded-[28px] border border-border-subtle bg-surface-screen-raised px-2.5 pb-2 pt-1 gap-2',
            shadowClassNames.hero
          )}
        >
          <GameHeader />
          <Box className="flex-1 min-h-0 gap-2">
            <OpponentsArea />
            <CenterArea />
          </Box>
          <PlayerHand />
        </Box>
        <CardAnimationLayer ref={animationLayerRef} />
      </Box>
    </StyledSafeAreaView>
  );
};
