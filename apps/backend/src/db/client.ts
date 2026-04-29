import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { loadBackendEnvFiles } from '@/env';

declare global {
  var __prisma__: PrismaClient | undefined;
}

loadBackendEnvFiles();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Set it in environment variables, apps/backend/.env, apps/backend/.env.local, apps/backend/.env.staging, or apps/backend/.env.production.'
  );
}

const looksLikeTemplate = /(?:^|[/:@?])(?:HOST|USER|PASSWORD|DB_NAME)(?:$|[/:@?])/i.test(
  databaseUrl
);
if (looksLikeTemplate) {
  throw new Error(
    'DATABASE_URL contains template placeholders (HOST/USER/PASSWORD/DB_NAME). Replace it with a real Postgres URL.'
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}

export const ensureDatabaseConnection = async (): Promise<void> => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
};
