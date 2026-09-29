#!/usr/bin/env bash
# Full-screen Chromium on labwc/Wayland, tuned for a Pi 3B.
set -u
URL="http://localhost:3000/"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE="$HOME/.config/curran-kiosk"   # keeps the YouTube sign-in
CACHE=/tmp/chromium-cache              # RAM, wiped on boot
BIN="$(command -v chromium || command -v chromium-browser)"

for _ in $(seq 1 60); do curl -fsS -o /dev/null "$URL" && break; sleep 2; done

# Stop "restore pages?" bubbles after a power cut.
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' \
  "$PROFILE/Default/Preferences" 2>/dev/null || true

exec "$BIN" \
  --kiosk "$URL" \
  --ozone-platform=wayland \
  --user-data-dir="$PROFILE" \
  --disk-cache-dir="$CACHE" \
  --disk-cache-size=104857600 \
  --media-cache-size=52428800 \
  --load-extension="$DIR/h264ify" \
  --enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --autoplay-policy=no-user-gesture-required \
  --renderer-process-limit=2 \
  --disable-background-networking \
  --disable-component-update \
  --disable-sync \
  --disable-features=TranslateUI,MediaRouter,OptimizationHints \
  --noerrdialogs --disable-infobars --no-first-run \
  --password-store=basic
