#!/usr/bin/env bash
set -euo pipefail

if command -v grep >/dev/null 2>&1; then
  search_frontend_cyrillic() {
    grep -RInE --exclude-dir=i18n '[А-Яа-яІіЇїЄєҐґ]' apps/frontend/src
  }

  search_backend_http_messages() {
    grep -RInE "res\\.status\\([^)]*\\)\\.json\\(\\{[[:space:]]*message:[[:space:]]*['\\\"]" apps/backend/src
  }

  search_backend_socket_messages() {
    grep -RInE "socket\\.emit\\('error',[[:space:]]*['\\\"]" apps/backend/src
  }
else
  echo 'i18n check failed: grep is not available in PATH.'
  exit 1
fi

if search_frontend_cyrillic; then
  echo
  echo 'Hardcoded Cyrillic UI strings found outside apps/frontend/src/i18n/**'
  exit 1
fi

if search_backend_http_messages; then
  echo
  echo "Hardcoded backend HTTP message payloads found. Use apiError(...) helper with code+message+params."
  exit 1
fi

if search_backend_socket_messages; then
  echo
  echo "Hardcoded socket error strings found. Use emitSocketError(...) helper with code+message+params."
  exit 1
fi

echo 'i18n check passed: no hardcoded Cyrillic strings outside locale resources.'
