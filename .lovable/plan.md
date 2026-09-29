# Lightweight Pi build: small storage footprint + smooth video

The screens, remote, and features stay exactly as they are. This plan changes how the app gets onto the Pi and how the Pi is tuned.

## The main change: stop building on the Pi

Right now the Pi downloads all the building tools (roughly 400–700 MB) and builds the app itself. That is what fills the card, and it is slow and memory-hungry on a 1 GB Pi.

New approach:
- GitHub builds the app automatically whenever the code changes (using GitHub Actions, which is free).
- It packs only the finished, ready-to-run app into one small download (roughly 5–15 MB).
- The Pi downloads that pack, swaps it in, restarts, checks it works, and rolls back if it doesn't. No building tools on the Pi, and no leftover build files.

The Pi still starts every connection itself and still checks for updates every 5 minutes. Your keys file is never touched.

## Storage protection on the Pi

- Keep only 2 versions: the current one and the previous one for rollback. Older ones are deleted automatically.
- The update log is capped at about 1 MB and rotated.
- The system log is capped at 50 MB and kept in memory, so it doesn't keep writing to the SD card.
- The browser's cache is capped at about 100 MB and wiped on each boot.
- The installer clears package download caches after installing, and installs only what's needed: Node.js, Chromium, and the kiosk helper. No git, no build tools.
- The app keeps its film data cache in memory (already capped), never on disk.
- Optional: turn swap into compressed memory (zram) instead of a swap file on the card. This saves space and SD card wear.

Expected total on the card: under about 250 MB including Node.js. Chromium is already installed.

## Smooth video

- **Hardware video only:** add the free "h264ify" extension to the kiosk browser. It makes YouTube send H.264 video, which the Pi 3B's video chip can decode. VP9/AV1 video runs on the processor instead, which is the main cause of stutter.
- **Cap YouTube at 720p.** 1080p is the Pi 3B's hard limit and drops frames.
- Set GPU memory to 128 MB.
- Tune browser startup flags for Wayland/labwc, which your Pi uses: hardware video decode, fewer background processes, no translate or sync services.
- Launch the kiosk from labwc's autostart, replacing the old X11 script that used xset/unclutter and doesn't work on your setup.
- Limit app server memory so the browser gets most of the RAM.
- Turn "Raspberry Pi mode" on by default, which removes blur and animation. The look stays the same.
- Disable unused background services (printing, modem, Bluetooth if you don't use it) at install.

## What you'll run on the Pi

One copy-paste block: download the installer, paste your film-database key when asked, then reboot. I'll send the exact commands after this is built.

## Technical details

- New `.github/workflows/release.yml`: on push to main, run `npm ci && npm run build`, tar `.output/` plus `package.json` as `curran-tv.tar.gz`, and publish it to a rolling `latest` GitHub Release with a version file (commit SHA).
- `deploy/install.sh` rewritten: apt install `nodejs` (NodeSource 20, `--no-install-recommends`), `apt-get clean`, and create `/opt/curran-tv/{releases,current,shared/.env}`. No `npm install` or git clone needed.
- `deploy/update.sh`: curl the version file, compare it with the current version, download to /tmp, extract to `releases/<sha>`, repoint the `current` symlink, restart, run the health check, and on failure repoint back. Prune releases down to the newest 2.
- journald: `SystemMaxUse=50M`, `Storage=volatile`. logrotate for `update.log`.
- Kiosk: `~/.config/labwc/autostart` launches `chromium --kiosk --ozone-platform=wayland --enable-features=VaapiVideoDecoder --disk-cache-size=104857600 --disk-cache-dir=/tmp/chromium-cache --renderer-process-limit=2 --disable-background-networking --load-extension=<h264ify dir>`. Chromium profile kept for the YouTube sign-in.
- systemd `curran-tv.service`: `ExecStart=node --max-old-space-size=128 current/server/index.mjs`, `MemoryMax=220M`.
- Default `liteMode` to true when the device is a Pi (hardwareConcurrency ≤ 4 already does this; also check the user agent for aarch64/armv7).
- README updated with the new install steps. Public repo needed for anonymous release downloads (already recommended).
