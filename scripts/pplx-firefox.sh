#!/usr/bin/env bash
# Start one headless Firefox on a private copy of the signed-in Perplexity profile and print export lines.
# Usage:  eval "$(scripts/pplx-firefox.sh)"      then PPLX_BIDI_WS, FIREFOX_PID and PPLX_PROFILE are set.
# Stop:   kill "$FIREFOX_PID"; rm -rf "$PPLX_PROFILE"      (scripts/cleanup.sh does both for every mfa-pplx profile).
# Env:    PPLX_SRC_PROFILE (default the signed-in profile below), PPLX_TABS (tabs you intend to open, for the memory guard).
set -euo pipefail
SRC_PROFILE="${PPLX_SRC_PROFILE:-/home/opc/.mozilla/firefox/w6ycu9xj.default-default}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$SRC_PROFILE" ] || { echo "source profile missing: $SRC_PROFILE" >&2; exit 2; }
command -v firefox >/dev/null || { echo "firefox not on PATH" >&2; exit 2; }
node "$ROOT/tools/mem-guard.mjs" "${PPLX_TABS:-1}" >&2
PORT=$(node -e 's=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')
PROFILE=$(mktemp -d /tmp/mfa-pplx-profile-XXXXXX)
chmod 700 "$PROFILE"
cp -r "$SRC_PROFILE/." "$PROFILE/"
rm -f "$PROFILE/.parentlock" "$PROFILE/lock"
MOZ_HEADLESS=1 nohup firefox --no-remote --profile "$PROFILE" --remote-debugging-port="$PORT" >/dev/null 2>&1 &
PID=$!
for _ in $(seq 1 30); do
  if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then break; fi
  sleep 1
done
echo "export PPLX_BIDI_WS=ws://127.0.0.1:$PORT/session"
echo "export FIREFOX_PID=$PID"
echo "export PPLX_PROFILE=$PROFILE"
