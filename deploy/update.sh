#!/usr/bin/env bash
# Curran TV — pull the latest version from GitHub, build it, restart, verify.
# Rolls back automatically if the new version fails to build or start.
# The Pi always initiates the connection; nothing connects inward.
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="$APP_DIR/deploy/update.log"
BRANCH="${CURRAN_BRANCH:-main}"

log() { echo "[$(date -Is)] $*" | tee -a "$LOG"; }

cd "$APP_DIR"

# .env and local data are never touched by git.
git fetch --quiet origin "$BRANCH" || { log "fetch failed (offline?)"; exit 0; }

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

log "update found: ${LOCAL:0:7} -> ${REMOTE:0:7}"
git reset --hard "origin/$BRANCH" >>"$LOG" 2>&1

rollback() {
  log "FAILED — rolling back to ${LOCAL:0:7}"
  git reset --hard "$LOCAL" >>"$LOG" 2>&1
  npm install >>"$LOG" 2>&1
  npm run build >>"$LOG" 2>&1
  sudo systemctl restart curran-tv.service
  exit 1
}

npm install >>"$LOG" 2>&1 || rollback
npm run build >>"$LOG" 2>&1 || rollback

sudo systemctl restart curran-tv.service

# Verify the app answers before calling the update good.
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://localhost:${PORT:-3000}/"; then
    log "updated to ${REMOTE:0:7} and healthy"
    exit 0
  fi
  sleep 2
done

rollback
