import { createClient } from '@supabase/supabase-js';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export class SupabaseAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdminError';
  }
}

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const apiKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !apiKey) {
    return null;
  }

  return createClient(trimTrailingSlashes(supabaseUrl), apiKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const deleteSupabaseAuthUser = async (userId: string): Promise<void> => {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new SupabaseAdminError(
      'Supabase admin client is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.'
    );
  }

  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) {
    throw new SupabaseAdminError(`Failed to delete Supabase auth user: ${error.message}`);
  }
};
