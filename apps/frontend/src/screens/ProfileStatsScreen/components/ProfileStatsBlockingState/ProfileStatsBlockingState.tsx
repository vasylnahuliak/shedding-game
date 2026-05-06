import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/Button';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Box } from '@/components/ui/box';

import { ProfileStatsState } from '../ProfileStatsState';

type ProfileStatsBlockingFrame = 'box' | 'screen';

type ProfileStatsBlockingStateProps =
  | {
      description: string;
      frame?: ProfileStatsBlockingFrame;
      variant: 'loading';
    }
  | {
      description: string;
      disabled: boolean;
      frame?: ProfileStatsBlockingFrame;
      onRetry: () => void;
      retryTitle: string;
      title: string;
      variant: 'error';
    };

const renderFrame = (frame: ProfileStatsBlockingFrame | undefined, children: ReactNode) => {
  switch (frame) {
    case 'box':
      return <Box className="flex-1">{children}</Box>;
    case 'screen':
      return <ScreenContainer edges={['bottom']}>{children}</ScreenContainer>;
    case undefined:
      return children;
  }
};

export const ProfileStatsBlockingState = function ProfileStatsBlockingState(
  props: ProfileStatsBlockingStateProps
) {
  const content = (
    <ProfileSectionCard>
      {props.variant === 'loading' ? (
        <ProfileStatsState
          leading={<ActivityIndicator size="large" colorClassName="accent-text-accent" />}
          description={props.description}
        />
      ) : (
        <ProfileStatsState title={props.title} description={props.description}>
          <Button title={props.retryTitle} onPress={props.onRetry} disabled={props.disabled} />
        </ProfileStatsState>
      )}
    </ProfileSectionCard>
  );

  return renderFrame(props.frame, content);
};
