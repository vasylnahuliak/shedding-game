import fs from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { parse as parseDotenv } from 'dotenv';

const cwd = process.cwd();
const BASE_ENV_FILE = '.env';
const LEGACY_LOCAL_ENV_FILE = '.env.development';
const VALID_ROLES = new Set(['player', 'admin', 'super_admin']);

const normalizeAppEnv = (value, fallback) => {
  switch (value?.trim().toLowerCase()) {
    case 'local':
    case 'development':
    case 'dev':
      return 'local';
    case 'staging':
      return 'staging';
    case 'production':
    case 'prod':
      return 'production';
    default:
      return fallback;
  }
};

const readEnvFile = (fileName) => {
  const filePath = path.resolve(cwd, fileName);

  try {
    return parseDotenv(fs.readFileSync(filePath));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
};

const resolveEnvFiles = () => {
  const baseEnv = readEnvFile(BASE_ENV_FILE);
  const fallbackAppEnv =
    process.env.NODE_ENV === 'production' || baseEnv.NODE_ENV?.trim().toLowerCase() === 'production'
      ? 'production'
      : 'local';
  const appEnv = normalizeAppEnv(process.env.APP_ENV ?? baseEnv.APP_ENV, fallbackAppEnv);

  if (appEnv === 'local') {
    return [BASE_ENV_FILE, '.env.local', LEGACY_LOCAL_ENV_FILE];
  }

  return [BASE_ENV_FILE, `.env.${appEnv}`, `.env.${appEnv}.local`];
};

const loadEnv = () => {
  const initialEnvKeys = new Set(Object.keys(process.env));

  for (const fileName of resolveEnvFiles()) {
    const parsed = readEnvFile(fileName);

    for (const [key, value] of Object.entries(parsed)) {
      if (initialEnvKeys.has(key)) continue;
      process.env[key] = value;
    }
  }
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const nextValue = args[index + 1];

    if (arg === '--email' && nextValue) {
      parsed.email = nextValue.trim().toLowerCase();
      index += 1;
      continue;
    }

    if (arg === '--user-id' && nextValue) {
      parsed.userId = nextValue.trim();
      index += 1;
      continue;
    }

    if (arg === '--role' && nextValue) {
      parsed.role = nextValue.trim();
      index += 1;
    }
  }

  return parsed;
};

const printUsageAndExit = (message) => {
  if (message) {
    console.error(message);
  }

  console.error(
    'Usage: npm run roles:grant -- --email <user@example.com> --role <player|admin|super_admin>'
  );
  console.error('   or: npm run roles:grant -- --user-id <uuid> --role <player|admin|super_admin>');
  process.exit(1);
};

loadEnv();

const { email, userId, role } = parseArgs();

if ((!email && !userId) || (email && userId)) {
  printUsageAndExit('Provide exactly one of --email or --user-id.');
}

if (!role || !VALID_ROLES.has(role)) {
  printUsageAndExit('Provide a valid --role value.');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

try {
  const user = await prisma.user.findFirst({
    where: email ? { email } : { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.error('User not found.');
    process.exit(1);
  }

  const roleRecord = await prisma.role.findUnique({
    where: { name: role },
    select: { id: true },
  });

  if (!roleRecord) {
    console.error(`Role "${role}" is not seeded. Run migrations first.`);
    process.exit(1);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    },
    create: {
      userId: user.id,
      roleId: roleRecord.id,
      assignedAtMs: BigInt(Date.now()),
    },
    update: {},
  });

  console.log(`Granted role "${role}" to ${user.email} (${user.id}).`);
} finally {
  await prisma.$disconnect();
}
