# 🐦‍⬛ OPERATION: PURPLE SUNDAY 💜

A wildly over-engineered [Zola](https://www.getzola.org/) site for one (1) Ravens game:
**Bengals @ Ravens — Sunday, Oct 25, 2026, 1:00 PM ET, M&T Bank Stadium.**

Tap the crew photo. Then tap it again.

## Features nobody asked for
- Live countdown (down to the centisecond) + conversions into Lamar 40-yard dashes, crab cakes, and Poe recitals
- Canvas particle engine: sparkles, confetti, emoji, rainbow shockwaves, glitter rain, cursor trail
- Chaos control panel: Seven Nation Army synth (WebAudio, no files), raven storm, disco, crab rave, Comic Sans mode
- Secret: Konami code, or tap the title 8 times
- Live gameday forecast (Open-Meteo), Leaflet map with transit stops, directions buttons
- Gameday timeline that tracks itself, packing checklist (saved locally), score "predictor", lore flip cards
- `.ics` / Google Calendar export and native share

## Run locally
```sh
zola serve
```

## Deploy
Pushes to `main` build with Zola and deploy via GitHub Actions (`.github/workflows/deploy.yml`).
Repo **Settings → Pages → Source: GitHub Actions** must be enabled.

Game details live in `config.toml` under `[extra]`.
