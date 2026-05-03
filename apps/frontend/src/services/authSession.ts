import type { Session } from '@supabase/supabase-js';

import { setAuthToken } from './authToken';
import { LoggingService } from './LoggingService';
import { supabase } from './supabase';

let refreshSessionPromise: Promise<string | null> | null = null;

const applyAuthSession = (session: Session | null | undefined) => {
  const accessToken = session?.access_token ?? null;
  setAuthToken(accessToken);
  return accessToken;
};

export const refreshAuthSession = async () => {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        LoggingService.warn('Failed to refresh auth session', {
          code: error.code,
          status: error.status,
          message: error.message,
        });
        return null;
      }

      return applyAuthSession(data.session);
    } catch (error) {
      LoggingService.warn('Failed to refresh auth session', {
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  })().finally(() => {
    refreshSessionPromise = null;
  });

  return refreshSessionPromise;
};
