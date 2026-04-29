import { QueryClient } from '@tanstack/react-query';

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  const status =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
      ? error.response.status
      : undefined;

  // Do not retry client-side errors (401/403/404/etc).
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }

  // Retry network/5xx failures once.
  return failureCount < 1;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: shouldRetryQuery,
    },
    mutations: {
      retry: 0,
    },
  },
});
