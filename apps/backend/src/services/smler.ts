type SmlerCreateLinkResponse = {
  short_url?: unknown;
  shortUrl?: unknown;
  link?: {
    short_url?: unknown;
    shortUrl?: unknown;
    shortLink?: unknown;
    short?: unknown;
  };
};

const SMLER_CREATE_LINK_URL = 'https://smler.in/api/v1/short';

const optionalEnv = (value: string | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
};

const requireEnv = (value: string | undefined, name: string) => {
  const resolvedValue = optionalEnv(value);
  if (!resolvedValue) {
    throw new Error(`${name} environment variable is not defined`);
  }

  return resolvedValue;
};

const getPublicAppUrl = () => requireEnv(process.env.PUBLIC_APP_URL, 'PUBLIC_APP_URL');
const getSmlerApiKey = () => requireEnv(process.env.SMLER_API_KEY, 'SMLER_API_KEY');

const buildCanonicalInviteUrl = (roomId: string) => {
  const canonicalUrl = new URL('/lobby', getPublicAppUrl());
  canonicalUrl.searchParams.set('roomId', roomId);
  return canonicalUrl.toString();
};

const resolveShortUrl = (payload: unknown): string => {
  const data = payload as SmlerCreateLinkResponse | null;
  const candidateValues = [
    data?.short_url,
    data?.shortUrl,
    data?.link?.short_url,
    data?.link?.shortUrl,
    data?.link?.shortLink,
    data?.link?.short,
  ];

  for (const candidateValue of candidateValues) {
    if (typeof candidateValue === 'string' && candidateValue.trim().length > 0) {
      return candidateValue;
    }
  }

  throw new Error('Smler create link response did not include a short URL');
};

const readErrorBody = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

export const createRoomInviteLink = async (roomId: string) => {
  const canonicalUrl = buildCanonicalInviteUrl(roomId);
  const response = await fetch(SMLER_CREATE_LINK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-code': getSmlerApiKey(),
    },
    body: JSON.stringify({
      url: canonicalUrl,
      maxLength: 6,
      isDeferredLink: true,
    }),
  });

  if (!response.ok) {
    const responseBody = await readErrorBody(response);
    throw new Error(
      `Smler create link request failed with ${String(response.status)} ${response.statusText}: ${responseBody}`
    );
  }

  const payload: unknown = await response.json();

  return {
    roomId,
    shortUrl: resolveShortUrl(payload),
    canonicalUrl,
  };
};
