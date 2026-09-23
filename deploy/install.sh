#!/usr/bin/env bash
# Curran TV — one-time install on a Raspberry Pi 3B (Raspberry Pi OS).
# Run once:  bash deploy/install.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_NAME="$(whoami)"

echo "==> Installing system packages"
sudo apt-get update
sudo apt-get install -y curl git unclutter chromium-browser xdotool

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installing app dependencies"
cd "$APP_DIR"
npm ci --omit=dev || npm install

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "!! Created .env — add your keys with:  nano $APP_DIR/.env"
fi

echo "==> Building"
npm run build

echo "==> Installing services"
render_unit() {
  sed -e "s|__APP_DIR__|$APP_DIR|g" -e "s|__USER__|$USER_NAME|g" "$1"
}
render_unit "$APP_DIR/deploy/systemd/curran-tv.service" | sudo tee /etc/systemd/system/curran-tv.service >/dev/null
render_unit "$APP_DIR/deploy/systemd/curran-kiosk.service" | sudo tee /etc/systemd/system/curran-kiosk.service >/dev/null
render_unit "$APP_DIR/deploy/systemd/curran-update.service" | sudo tee /etc/systemd/system/curran-update.service >/dev/null
sudo cp "$APP_DIR/deploy/systemd/curran-update.timer" /etc/systemd/system/curran-update.timer

sudo systemctl daemon-reload
sudo systemctl enable --now curran-tv.service
sudo systemctl enable --now curran-kiosk.service
sudo systemctl enable --now curran-update.timer

echo
echo "Done. The TV app is running on http://localhost:3000"
echo "Phone remote:  http://$(hostname -I | awk '{print $1}'):3000/remote"
