import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const cwd = process.cwd();
const BASE_ENV_FILE = '.env';
const LEGACY_LOCAL_ENV_FILE = '.env.development';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const WAIT_TIMEOUT_MS = 10_000;
const WAIT_INTERVAL_MS = 250;
const lsofAvailable = (() => {
  const result = spawnSync('lsof', ['-v'], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return !result.error;
})();

const parseEnvFile = (contents) => {
  const parsed = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, '');
    }

    parsed[key] = value;
  }

  return parsed;
};

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

const resolveEnvFiles = () => {
  const baseEnvPath = path.resolve(cwd, BASE_ENV_FILE);
  const baseEnv = fs.existsSync(baseEnvPath)
    ? parseEnvFile(fs.readFileSync(baseEnvPath, 'utf8'))
    : {};
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

const readEnv = () => {
  const fileEnv = {};
  const envFiles = resolveEnvFiles();

  for (const fileName of envFiles) {
    const filePath = path.resolve(cwd, fileName);
    if (!fs.existsSync(filePath)) continue;
    Object.assign(fileEnv, parseEnvFile(fs.readFileSync(filePath, 'utf8')));
  }

  return {
    ...fileEnv,
    ...process.env,
  };
};

const toServiceTarget = (name, kind, urlValue, defaultPort) => {
  if (!urlValue) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(urlValue);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname;
  const port = Number(parsedUrl.port || defaultPort);

  if (!LOCAL_HOSTS.has(host) || !Number.isInteger(port) || port <= 0) {
    return null;
  }

  return {
    host,
    kind,
    name,
    port,
    url: urlValue,
  };
};

const checkPortOpenWithSocket = (host, port) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (isOpen) => {
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

const checkPortOpen = async (host, port) => {
  if (lsofAvailable) {
    const result = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (!result.error) {
      return result.status === 0;
    }
  }

  return checkPortOpenWithSocket(host, port);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForTarget = async (target) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    if (await checkPortOpen(target.host, target.port)) {
      return true;
    }
    await sleep(WAIT_INTERVAL_MS);
  }

  return false;
};

const hasCommand = (command, args = ['--version']) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return !result.error && result.status === 0;
};

const runCommand = (command, args) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    return { ok: false, status: 1 };
  }

  return { ok: result.status === 0, status: result.status ?? 1 };
};

const startWithDocker = async (missingTargets) => {
  console.log(
    `Starting local services with Docker Compose for: ${missingTargets.map((t) => t.name).join(', ')}`
  );

  const started = runCommand('docker', [
    'compose',
    '-f',
    'docker-compose.local-db.yml',
    'up',
    '-d',
  ]);
  if (!started.ok) {
    return started.status;
  }

  for (const target of missingTargets) {
    const available = await waitForTarget(target);
    if (!available) {
      console.error(
        `${target.name} did not become available at ${target.url} after Docker startup.`
      );
      return 1;
    }
  }

  return 0;
};

const env = readEnv();
const targets = [
  toServiceTarget('Postgres', 'postgres', env.DATABASE_URL, 5432),
  toServiceTarget('Redis', 'redis', env.REDIS_URL, 6379),
].filter(Boolean);

if (targets.length === 0) {
  console.log('No local Postgres/Redis targets configured. Skipping service bootstrap.');
  process.exit(0);
}

const missingTargets = [];
for (const target of targets) {
  if (!(await checkPortOpen(target.host, target.port))) {
    missingTargets.push(target);
  }
}

if (missingTargets.length === 0) {
  console.log(
    `Local services already available: ${targets.map((target) => target.name).join(', ')}`
  );
  process.exit(0);
}

if (hasCommand('docker', ['compose', 'version'])) {
  process.exit(await startWithDocker(missingTargets));
}

console.error('Required local services are not available.');
for (const target of missingTargets) {
  console.error(`- ${target.name} expected at ${target.url}`);
}
console.error(
  'Install Docker with Compose and rerun `npm run dev`, or start these services manually.'
);
process.exit(1);
