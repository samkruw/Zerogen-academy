#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .emulators
if [ ! -f .emulators/database.jar ]; then
  curl -fL --max-time 60 https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar -o .emulators/database.jar
fi
echo 'b70d99344caf17c98b6f910fa8f6edf32a7c016cb1035e8915f70d38901eb97f  .emulators/database.jar' | sha256sum -c -
java -jar .emulators/database.jar --host 127.0.0.1 --port 9000 --single_project_mode Error > .emulators/database.log 2>&1 &
ZEROGEN_EMULATOR_PID=$!
trap 'kill "$ZEROGEN_EMULATOR_PID" 2>/dev/null || true' EXIT
for attempt in {1..40}; do
  if rg -q 'Listening at' .emulators/database.log; then break; fi
  if ! kill -0 "$ZEROGEN_EMULATOR_PID" 2>/dev/null; then cat .emulators/database.log; exit 1; fi
  sleep 0.25
done
# Firebase's Node WebSocket transport ignores NO_PROXY. Only this local emulator
# process bypasses HTTP proxies; it never contacts Firebase production endpoints.
HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy= timeout 40s node tests/rules.integration.ts
if [ "${ZEROGEN_BROWSER_SYNC:-0}" = 1 ]; then
  ZEROGEN_SYNC_TEST=1 npx playwright test --config playwright.config.ts tests/browser/sync.spec.ts
fi
