import { defineConfig } from 'prisma/config';

import { loadBackendEnvFiles } from './src/env';

loadBackendEnvFiles();

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && /(?:^|[/:@?])(?:HOST|USER|PASSWORD|DB_NAME)(?:$|[/:@?])/i.test(databaseUrl)) {
  throw new Error(
    'DATABASE_URL in env contains template placeholders (HOST/USER/PASSWORD/DB_NAME).'
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
