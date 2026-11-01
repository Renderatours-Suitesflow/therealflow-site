# therealflow.tv

The TheRealFlow website. It runs on autopilot: nobody needs to touch it when a new video or episode goes out.

## How it updates itself

A GitHub Action (`.github/workflows/publish.yml`) runs every 2 hours. It:

1. reads the podcast RSS feed (Spotify for Creators) and the YouTube channel feed,
2. adds anything new to `data/episodes.json` and `data/videos.json` (the archive keeps every item, even after it drops out of the live feeds),
3. rebuilds every page and publishes the site to GitHub Pages.

To force an update right away: **Actions → Publish site → Run workflow**.

## What lives where

| File | What it is |
| --- | --- |
| `config.json` | Feed URLs, channel links, host details. Add the Apple Podcasts link here when it exists. |
| `data/tracker.json` | Luxury Development Tracker projects. Edit this to add or update a project. |
| `scripts/templates.mjs` | The HTML for every page. |
| `assets/site.css` | Styles, in the SuitesFlow brand (ink, parchment, gold; Cormorant Garamond + Jost). |
| `assets/tracker.js` | The tracker globe and filters. |

## Build locally

```
npm install
npm run build          # pulls the feeds
npm run build:offline  # uses the saved archive only
```

The output goes to `dist/`.
