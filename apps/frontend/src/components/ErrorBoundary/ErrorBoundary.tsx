import type { ReactNode } from 'react';
import React, { Component } from 'react';
import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import i18n from '@/i18n';
import { LoggingService } from '@/services/LoggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    LoggingService.componentError(error, info.componentStack ?? undefined);
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box className="flex-1 items-center justify-center bg-surface-screen-raised p-xl">
          <Text className="mb-2.5 text-2xl font-bold text-text-primary">
            {i18n.t('alerts:errorBoundary.title')}
          </Text>
          <Text className="mb-xl text-center text-sm text-text-secondary">
            {this.state.error?.message || i18n.t('alerts:errorBoundary.fallback')}
          </Text>
          <Pressable className="rounded-md bg-text-accent px-6 py-3" onPress={this.handleRetry}>
            <Text className="font-bold text-text-on-accent">{i18n.t('common:buttons.retry')}</Text>
          </Pressable>
        </Box>
      );
    }

    return this.props.children;
  }
}
