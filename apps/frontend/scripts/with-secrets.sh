#!/bin/sh

set -eu

if [ ! -f ./.secrets ]; then
  echo "Missing apps/frontend/.secrets" >&2
  exit 1
fi

set -a
. ./.secrets
set +a

exec "$@"