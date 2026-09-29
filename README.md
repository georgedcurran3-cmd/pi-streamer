# Curran TV

A cinematic media centre for a Raspberry Pi 3B plugged into the TV, with a phone
remote that controls everything.

- **TV interface** — big-screen home with a cinematic hero, Continue Watching,
  Trending, New Releases, Popular Films, Popular TV, Recommended and YouTube
  Trending. Films, TV Shows, YouTube, Peacock, My List, Search and Settings.
- **Phone remote** — open `/remote`, scan the code on the Settings screen and
  your phone becomes a D-pad, transport controls, volume, keyboard for the TV's
  search boxes and a Now Playing view.
- **YouTube** — plays on the TV in its own signed-in browser session.
- **Peacock** — opens the real Peacock player with your own subscription.
- **Everything else** — titles come from the film database, matched by ID and
  opened on the configured source.

## Put it on the Pi (lightweight — nothing is built on the Pi)

GitHub builds the app on every push to `main` and publishes a small pack
(Actions tab → "Build Pi release"). The repo must be public. On the Pi:

```bash
curl -fsSL https://raw.githubusercontent.com/georgedcurran3-cmd/pi-streamer/main/deploy/install.sh | bash
sudo reboot
```

The installer asks for your TMDB key once and stores it in
`/opt/curran-tv/shared/.env`. Total footprint is roughly 250 MB including Node.js.

## Storage & smoothness

- Only the current and previous versions are kept (for rollback).
- System logs live in memory (50 MB cap); the update log is capped at 1 MB.
- Browser cache lives in `/tmp` (RAM), capped at 100 MB, wiped each boot.
- Swap uses compressed RAM (zram) instead of the SD card.
- A built-in extension forces H.264 video up to 720p so the Pi's video chip
  decodes it instead of the CPU. Graphics memory set to 128 MB.

## Updates

Every 5 minutes the Pi checks for a new pack, swaps it in, restarts, health-checks
and rolls back on failure. `.env` is never touched. Log: `/opt/curran-tv/shared/update.log`.

## Handy commands

```bash
sudo systemctl status curran-tv                    # is the app running?
sudo journalctl -u curran-tv -f                    # live logs
bash /opt/curran-tv/current/deploy/update.sh       # update right now
du -sh /opt/curran-tv                              # space used
```

## Sign in to YouTube once

With a keyboard on the Pi, press `Ctrl+Alt+T`, run `bash deploy/kiosk.sh` if it
is not already up, open YouTube from the app and sign in. The session is kept in
the kiosk profile and survives reboots and updates.
