#!/usr/bin/env bash
# Curran TV — fetch the latest prebuilt pack, swap it in, verify, roll back on failure.
# Keeps only the current and previous versions. Never touches shared/.env.
set -uo pipefail

BASE=/opt/curran-tv
LOG="$BASE/shared/update.log"
REPO="${CURRAN_REPO:-georgedcurran3-cmd/pi-streamer}"
URL="https://github.com/$REPO/releases/download/latest"
log() { echo "[$(date -Is)] $*" >> "$LOG"; }

NEW="$(curl -fsSL "$URL/VERSION" 2>/dev/null | tr -d '[:space:]')" || exit 0
[ -n "$NEW" ] || exit 0
OLD="$(basename "$(readlink -f "$BASE/current")")"
[ "$NEW" = "$OLD" ] && exit 0

log "update ${OLD:0:7} -> ${NEW:0:7}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "$URL/curran-tv.tar.gz" -o "$TMP/app.tgz" || { log "download failed"; exit 0; }
mkdir -p "$BASE/releases/$NEW"
tar -xzf "$TMP/app.tgz" -C "$BASE/releases/$NEW" || { log "bad pack"; rm -rf "$BASE/releases/$NEW"; exit 0; }

ln -sfn "$BASE/releases/$NEW" "$BASE/current"
sudo systemctl restart curran-tv.service

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://localhost:3000/"; then
    log "healthy on ${NEW:0:7}"
    # Prune: keep current + previous only.
    ls -1t "$BASE/releases" | grep -vx -e "$NEW" -e "$OLD" | while read -r d; do rm -rf "$BASE/releases/$d"; done
    exit 0
  fi
  sleep 2
done

log "FAILED — rolling back to ${OLD:0:7}"
ln -sfn "$BASE/releases/$OLD" "$BASE/current"
rm -rf "$BASE/releases/$NEW"
sudo systemctl restart curran-tv.service
exit 1
