import { useEffect, useMemo, useState } from 'react';

import { useAdminUsersQuery } from '@/api';

const SEARCH_DEBOUNCE_MS = 250;

const useDebouncedValue = (value: string, delayMs: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    function debounceValueChange() {
      const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);

      return () => clearTimeout(timeoutId);
    },
    [delayMs, value]
  );

  return debouncedValue;
};

export const useAdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => debouncedSearchQuery.trim(), [debouncedSearchQuery]);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useAdminUsersQuery(query);

  const refreshUsers = async () => {
    setManualRefreshing(true);

    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  return {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loading: isLoading && !data,
    refreshUsers,
    refreshing: manualRefreshing,
    searchQuery,
    settledSearchQuery: query,
    setSearchQuery,
    totalCount: data?.totalCount ?? 0,
    users: data?.users ?? [],
  };
};
