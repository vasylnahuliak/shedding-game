#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const FRONTEND_ENV_PATH = path.join(repoRoot, 'apps', 'frontend', '.env.local');
const FRONTEND_ENV_EXAMPLE_PATH = path.join(repoRoot, 'apps', 'frontend', '.env.example');
const BACKEND_ENV_PATH = path.join(repoRoot, 'apps', 'backend', '.env.local');
const BACKEND_ENV_EXAMPLE_PATH = path.join(repoRoot, 'apps', 'backend', '.env.local.example');

const parseEnvText = (contents) => {
  const parsed = new Map();

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z0-9._-]+)\s*=\s*(.*)$/u);
    if (!match) {
      continue;
    }

    const [, rawKey, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const normalizedKey = rawKey.replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
    parsed.set(normalizedKey, value);
  }

  return parsed;
};

const formatEnvValue = (value) => JSON.stringify(value);

const upsertEnv = (contents, updates) => {
  const lines = contents.split(/\r?\n/u);

  for (const [key, value] of Object.entries(updates)) {
    const renderedLine = `${key}=${formatEnvValue(value)}`;
    const index = lines.findIndex((line) => new RegExp(`^(?:export\\s+)?${key}=`, 'u').test(line));

    if (index >= 0) {
      lines[index] = renderedLine;
      continue;
    }

    if (lines.length > 0 && lines.at(-1) !== '') {
      lines.push('');
    }

    lines.push(renderedLine);
  }

  return `${lines.join('\n').replace(/\n+$/u, '')}\n`;
};

const loadEnvTemplate = (targetPath, examplePath) => {
  if (fs.existsSync(targetPath)) {
    return fs.readFileSync(targetPath, 'utf8');
  }

  if (fs.existsSync(examplePath)) {
    return fs.readFileSync(examplePath, 'utf8');
  }

  return '';
};

const status = spawnSync('npx', ['supabase@latest', 'status', '--workdir', repoRoot, '-o', 'env'], {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (status.status !== 0) {
  const stderr = status.stderr.trim();
  const stdout = status.stdout.trim();
  const details = stderr || stdout || 'Unknown error.';
  console.error('Failed to read local Supabase status.');
  console.error(details);
  console.error('Start the local stack first with `npm run supabase:start`.');
  process.exit(status.status ?? 1);
}

const env = parseEnvText(status.stdout);
const supabaseUrl = env.get('API_URL');
const supabaseAnonKey = env.get('ANON_KEY');
const supabaseServiceRoleKey = env.get('SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Supabase CLI status output is missing API_URL, ANON_KEY, or SERVICE_ROLE_KEY.');
  process.exit(1);
}

const normalizedSupabaseUrl = supabaseUrl.replace(/\/+$/u, '');
const jwtIssuer = `${normalizedSupabaseUrl}/auth/v1`;

const frontendEnv = upsertEnv(loadEnvTemplate(FRONTEND_ENV_PATH, FRONTEND_ENV_EXAMPLE_PATH), {
  EXPO_PUBLIC_APP_ENV: 'local',
  EXPO_PUBLIC_SUPABASE_URL: normalizedSupabaseUrl,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
});

const backendEnv = upsertEnv(loadEnvTemplate(BACKEND_ENV_PATH, BACKEND_ENV_EXAMPLE_PATH), {
  APP_ENV: 'local',
  SUPABASE_URL: normalizedSupabaseUrl,
  SUPABASE_JWT_ISSUER: jwtIssuer,
  SUPABASE_JWT_AUDIENCE: 'authenticated',
  SUPABASE_SECRET_KEY: supabaseServiceRoleKey,
});

fs.writeFileSync(FRONTEND_ENV_PATH, frontendEnv);
fs.writeFileSync(BACKEND_ENV_PATH, backendEnv);

console.log(
  `Updated ${path.relative(repoRoot, FRONTEND_ENV_PATH)} with local Supabase URL and anon key.`
);
console.log(
  `Updated ${path.relative(repoRoot, BACKEND_ENV_PATH)} with local Supabase URL, issuer, audience, and service role key.`
);
