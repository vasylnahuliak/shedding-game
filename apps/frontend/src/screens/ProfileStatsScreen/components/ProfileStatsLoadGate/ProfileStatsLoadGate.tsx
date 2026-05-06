import type { ReactNode } from 'react';

import { useAppTranslation } from '@/i18n';

import { ProfileStatsBlockingState } from '../ProfileStatsBlockingState';

type ProfileStatsLoadGateProps = {
  children: ReactNode;
  frame: 'box' | 'screen';
  hasBlockingError: boolean;
  isInitialLoading: boolean;
  loadingDescription: string;
  onRetry: () => void;
  retrying: boolean;
};

export const ProfileStatsLoadGate = function ProfileStatsLoadGate({
  children,
  frame,
  hasBlockingError,
  isInitialLoading,
  loadingDescription,
  onRetry,
  retrying,
}: ProfileStatsLoadGateProps) {
  const { t } = useAppTranslation(['alerts', 'common']);

  if (isInitialLoading) {
    return (
      <ProfileStatsBlockingState frame={frame} variant="loading" description={loadingDescription} />
    );
  }

  if (hasBlockingError) {
    return (
      <ProfileStatsBlockingState
        frame={frame}
        variant="error"
        title={t('alerts:errorBoundary.title')}
        description={t('alerts:errorBoundary.fallback')}
        retryTitle={retrying ? t('common:labels.loading') : t('common:buttons.retry')}
        onRetry={onRetry}
        disabled={retrying}
      />
    );
  }

  return children;
};
