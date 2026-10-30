#!/usr/bin/env bash
# Attach to the real authenticated Firefox; never create a copied/fresh profile.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/tools/mem-guard.mjs" "${PPLX_TABS:-1}" >&2
PORT="${PPLX_BIDI_PORT:-9223}"
if ! (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  echo "No BiDi listener on $PORT. Inspect Firefox on display :10; restart the original authenticated profile with --restore-last-session --remote-debugging-port=$PORT if necessary. Do not copy its profile." >&2
  exit 2
fi
printf 'export PPLX_BIDI_WS=ws://127.0.0.1:%s/session\n' "$PORT"
