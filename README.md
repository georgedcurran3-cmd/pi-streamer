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

## Put it on the Pi

1. Create a repository on GitHub and push this project to it.
2. On the Pi:

   ```bash
   git clone https://github.com/<you>/<repo>.git ~/curran-tv
   cd ~/curran-tv
   bash deploy/install.sh
   nano .env        # add your keys
   sudo systemctl restart curran-tv
   ```

3. The Pi reboots straight into full-screen Curran TV.

## Keys

Copy `.env.example` to `.env` and fill it in. `TMDB_API_KEY` is required and
free. `YOUTUBE_API_KEY` is optional — without it, YouTube search inside the app
is off but full YouTube still works.

Keys live only on the Pi and only on the server side. They are never sent to the
browser and `.env` is never committed.

## Updates

Every 5 minutes the Pi checks GitHub for new commits, installs, builds,
restarts and checks the app answers. If anything fails it rolls straight back to
the previous version. Your `.env` is never overwritten. Push to `main` and the
TV updates itself. The Pi always makes the connection outward — nothing needs to
reach into your home network.

Update history: `deploy/update.log`.

## Handy commands

```bash
sudo systemctl status curran-tv      # is the app running?
sudo systemctl restart curran-kiosk  # restart the screen
sudo journalctl -u curran-tv -f      # live logs
bash deploy/update.sh                # update right now
```

## Sign in to YouTube once

With a keyboard on the Pi, press `Ctrl+Alt+T`, run `bash deploy/kiosk.sh` if it
is not already up, open YouTube from the app and sign in. The session is kept in
the kiosk profile and survives reboots and updates.
