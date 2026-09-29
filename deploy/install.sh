#!/usr/bin/env bash
# Curran TV — lightweight one-time install on a Raspberry Pi 3B.
# Downloads a prebuilt app from GitHub. Nothing is compiled on the Pi.
#   curl -fsSL https://raw.githubusercontent.com/georgedcurran3-cmd/pi-streamer/main/deploy/install.sh | bash
set -euo pipefail

REPO="${CURRAN_REPO:-georgedcurran3-cmd/pi-streamer}"
BASE=/opt/curran-tv
USER_NAME="$(whoami)"

echo "==> Installing only what's needed"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y --no-install-recommends nodejs
fi
command -v chromium >/dev/null || command -v chromium-browser >/dev/null || \
  sudo apt-get install -y --no-install-recommends chromium
sudo apt-get install -y --no-install-recommends curl zram-tools
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*

echo "==> Folders"
sudo mkdir -p "$BASE/releases" "$BASE/shared"
sudo chown -R "$USER_NAME" "$BASE"

if [ ! -f "$BASE/shared/.env" ]; then
  read -r -p "Paste your TMDB API key and press Enter: " TMDB_KEY </dev/tty
  cat > "$BASE/shared/.env" <<EOF
PORT=3000
HOST=0.0.0.0
TMDB_API_KEY=$TMDB_KEY
SUPABASE_URL=https://xlhtrdrbxfwvhhfmuzgl.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_ypdSwJvQWpm5mBTo80BTBw_DAGCOr9C
CURRAN_REPO=$REPO
EOF
  chmod 600 "$BASE/shared/.env"
fi

echo "==> Downloading the app"
TMP="$(mktemp -d)"
curl -fsSL "https://github.com/$REPO/releases/download/latest/curran-tv.tar.gz" -o "$TMP/app.tgz"
VER="$(curl -fsSL "https://github.com/$REPO/releases/download/latest/VERSION")"
mkdir -p "$BASE/releases/$VER"
tar -xzf "$TMP/app.tgz" -C "$BASE/releases/$VER"
rm -rf "$TMP"
ln -sfn "$BASE/releases/$VER" "$BASE/current"
D="$BASE/current/deploy"

echo "==> Services"
render() { sed -e "s|__BASE__|$BASE|g" -e "s|__USER__|$USER_NAME|g" "$1"; }
render "$D/systemd/curran-tv.service"     | sudo tee /etc/systemd/system/curran-tv.service >/dev/null
render "$D/systemd/curran-update.service" | sudo tee /etc/systemd/system/curran-update.service >/dev/null
sudo cp "$D/systemd/curran-update.timer" /etc/systemd/system/
sudo rm -f /etc/systemd/system/curran-kiosk.service

echo "==> Keeping logs small and off the SD card"
sudo mkdir -p /etc/systemd/journald.conf.d
sudo cp "$D/journald-curran.conf" /etc/systemd/journald.conf.d/curran.conf
sudo systemctl restart systemd-journald
sudo cp "$D/logrotate-curran" /etc/logrotate.d/curran-tv
sudo sed -i 's/^#\?PERCENTAGE=.*/PERCENTAGE=50/' /etc/default/zramswap || true
sudo systemctl enable --now zramswap || true
sudo dphys-swapfile swapoff 2>/dev/null && sudo systemctl disable dphys-swapfile 2>/dev/null && sudo rm -f /var/swap || true

echo "==> Turning off unused background services"
sudo systemctl disable --now cups cups-browsed ModemManager triggerhappy 2>/dev/null || true

echo "==> Video: 128 MB for the graphics chip"
sudo raspi-config nonint do_memory_split 128 2>/dev/null || true

echo "==> Kiosk autostart (labwc/Wayland)"
mkdir -p "$HOME/.config/labwc"
AUTO="$HOME/.config/labwc/autostart"
touch "$AUTO"
sed -i '/curran-tv/d' "$AUTO"
echo "bash $BASE/current/deploy/kiosk.sh &  # curran-tv" >> "$AUTO"

sudo systemctl daemon-reload
sudo systemctl enable --now curran-tv.service curran-update.timer

echo
echo "Done. Reboot with:  sudo reboot"
echo "Phone remote:  http://$(hostname -I | awk '{print $1}'):3000/remote"
du -sh "$BASE"
