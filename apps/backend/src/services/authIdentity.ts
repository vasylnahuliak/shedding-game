import { createRemoteJWKSet, jwtVerify } from 'jose';

type AuthIdentity = {
  userId: string;
  email: string;
};

type SupabaseJwtConfig = {
  issuer: string;
  audience: string;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const getSupabaseConfig = (): SupabaseJwtConfig | null => {
  const explicitIssuer = process.env.SUPABASE_JWT_ISSUER?.trim();
  if (explicitIssuer) {
    return {
      issuer: trimTrailingSlashes(explicitIssuer),
      audience: process.env.SUPABASE_JWT_AUDIENCE?.trim() || 'authenticated',
    };
  }

  // Fallback for local development where only frontend env may be configured.
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  const normalized = trimTrailingSlashes(supabaseUrl);
  return {
    issuer: normalized.endsWith('/auth/v1') ? normalized : `${normalized}/auth/v1`,
    audience: process.env.SUPABASE_JWT_AUDIENCE?.trim() || 'authenticated',
  };
};

const supabaseJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const getSupabaseJwks = (issuer: string) => {
  const cached = supabaseJwksCache.get(issuer);
  if (cached) {
    return cached;
  }

  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    supabaseJwksCache.set(issuer, jwks);
    return jwks;
  } catch {
    return null;
  }
};

const isLikelyJwt = (token: string) => token.split('.').length === 3;

const verifySupabaseToken = async (token: string): Promise<AuthIdentity | null> => {
  if (!isLikelyJwt(token)) {
    return null;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const supabaseJwks = getSupabaseJwks(config.issuer);
  if (!supabaseJwks) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, supabaseJwks, {
      issuer: config.issuer,
      audience: config.audience,
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return null;
    }

    const email =
      typeof payload.email === 'string' && payload.email.trim().length > 0
        ? payload.email.trim().toLowerCase()
        : null;

    if (!email) {
      return null;
    }

    return {
      userId: payload.sub,
      email,
    };
  } catch {
    return null;
  }
};

export const resolveAuthIdentity = async (token: string): Promise<AuthIdentity | null> => {
  return verifySupabaseToken(token);
};
