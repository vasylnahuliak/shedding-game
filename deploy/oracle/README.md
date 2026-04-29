# Oracle Cloud (Always Free) deployment

This stack targets a single Oracle Cloud VM (Ampere A1 `VM.Standard.A1.Flex`) and keeps everything private except ports `80` and `443`.

It is based on the existing VM deployment in this repo, but documented specifically for OCI and ARM64.

## Environment model

This deployment is production-only (single environment).

### CI-managed environment (recommended)

For automated deploys (e.g. GitHub Actions -> SSH -> VM), keep the real production env file in GitHub **Environment secrets** and upload it on each deploy.

- Create a GitHub Environment named `production` and add a secret `ORACLE_PRODUCTION_ENV` with the full contents of `deploy/oracle/env/production.env`.
- The workflow `.github/workflows/deploy-oracle.yml` uploads it to `~/shedding-game/deploy/oracle/env/production.env` before running Docker Compose.
- To update CORS (or any other server config), change the secret value and redeploy — no manual SSH edits.

## What is included

- `Caddy` for automatic TLS, HTTP to HTTPS, and reverse proxying
- `frontend` container serving the static legal/deep-link website from `apps/frontend/public`
- `backend` container running Prisma migrations on boot and serving HTTP/WebSocket traffic
- `Postgres` and `Redis` on an internal Docker network only

## OCI prerequisites

1. Create an ARM VM (Ubuntu 24.04 LTS or Debian 12 recommended).
2. Open inbound TCP ports `22`, `80`, and `443` in both:
   - VCN Security List / Network Security Group rules
   - The VM firewall (if enabled, e.g. `ufw`)
3. Ensure you have enough persistent disk space:
   - Docker named volumes live under `/var/lib/docker` by default.
   - If your boot volume is small, attach a Block Volume and mount it (commonly under `/srv`), or increase the boot volume size.

## DNS

Create A or AAAA records before the first deploy:

- `${APP_DOMAIN}` -> your Oracle VM public IP

## First deploy

### (Optional) Create infra with Terraform

If you want to avoid clicking around in the OCI UI, this repo includes a Terraform setup that creates:
VCN + public subnet + Internet Gateway + routes + security rules + an ARM instance preconfigured with Docker.

See: `deploy/oracle/terraform/README.md`

1. Install Docker Engine and the Docker Compose plugin on the VM.
2. Clone this repository onto the VM.
3. Copy the production environment file:

```bash
cp deploy/oracle/env/production.env.example deploy/oracle/env/production.env
```

4. Fill in the real domain, Supabase values, and strong secrets.
   - `deploy/oracle/env/*.env` files are gitignored by default.
5. Start the stack:

```bash
deploy/oracle/compose-env.sh
```

`deploy/oracle/compose-env.sh` defaults to `docker compose up -d --build` for production.

6. Verify the deployment:

```bash
deploy/oracle/compose-env.sh ps
curl https://$APP_DOMAIN/api/health
```

## Supabase settings

Set these in Supabase Auth:

- `Site URL` -> `https://$APP_DOMAIN`
- `Redirect URLs` -> at least `https://$APP_DOMAIN/**`

The frontend container serves static files directly from `apps/frontend/public`. If you change the legal pages, landing page, or associated app-link files, rebuild the frontend container.

## Sentry

- Set `SENTRY_DSN_BACKEND` to enable backend error delivery. Backend startup now fails in non-local environments if this is missing.
- Backend `SENTRY_RELEASE` is derived automatically from `apps/backend/package.json` as `<name>@<version>`.

## Aptabase analytics

- For local Expo development, keep the same key in `apps/frontend/.env.local` or another local frontend env file that Expo loads.
- For native EAS builds and updates, add `EXPO_PUBLIC_APTABASE_APP_KEY` to the relevant EAS environment because Expo resolves `EXPO_PUBLIC_*` at build/update time.

## Smler invite links and deferred deep links

- Set `SMLER_API_KEY` in `deploy/oracle/env/production.env` so the backend can create Smler invite links.
- The backend now uses `PUBLIC_APP_URL` to build canonical room invite destinations. In the Oracle stack this is derived from `APP_DOMAIN`.
- The frontend static site also exposes `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` so the domain can participate in native deep-link handoff.
- `assetlinks.json` currently matches the Android keystore fingerprint checked into `apps/frontend/android/app/debug.keystore`. If you switch release signing, update that fingerprint before deploy.

## Updating

```bash
git pull
deploy/oracle/compose-env.sh
```

## Backups and operations

- Back up the `postgres_data` volume (and optionally `redis_data`). VM snapshots are useful, but logical Postgres backups are still recommended.
- Anonymous/guest auth is removed. Keep backend `SUPABASE_URL`/`SUPABASE_SECRET_KEY`/`SUPABASE_JWT_*` and frontend `EXPO_PUBLIC_SUPABASE_*` values present in the production env file.
- RBAC lives in Postgres. Bootstrap the first `super_admin` with `npm run roles:grant -w shedding-game-backend -- --email <user@example.com> --role super_admin`.
- Do not publish Postgres or Redis ports to the internet.
- `/health` returns the resolved environment so you can confirm the server is running with the expected config.
