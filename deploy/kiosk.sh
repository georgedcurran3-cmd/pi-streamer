#!/usr/bin/env bash
# Launches Chromium full screen on the TV, tuned for a Raspberry Pi 3B.
set -u

URL="http://localhost:${PORT:-3000}/"
PROFILE="$HOME/.config/curran-kiosk"

export DISPLAY=:0
xset s off -dpms s noblank 2>/dev/null || true
unclutter -idle 0.5 -root &

# Wait for the app to answer.
for _ in $(seq 1 60); do
  curl -fsS -o /dev/null "$URL" && break
  sleep 2
done

# The profile persists the YouTube sign-in between reboots.
exec chromium-browser \
  --kiosk "$URL" \
  --user-data-dir="$PROFILE" \
  --start-fullscreen \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --enable-gpu-rasterization \
  --ignore-gpu-blocklist \
  --disable-software-rasterizer \
  --renderer-process-limit=2 \
  --check-for-update-interval=604800
