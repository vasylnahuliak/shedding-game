#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") [docker compose args...]" >&2
  exit 1
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$script_dir/env/production.env"
example_file="$script_dir/env/production.env.example"

if [[ ! -f "$env_file" ]]; then
  echo "Missing environment file: $env_file" >&2
  echo "Create it from: $example_file" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  set -- up -d --build
fi

exec docker compose \
  --project-name "shedding-game-production" \
  --env-file "$env_file" \
  -f "$script_dir/compose.yaml" \
  "$@"
