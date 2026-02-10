# Flamenco Player - Handoff Guide

Welcome! This document explains everything you need to know about your Flamenco Player app. It's written in plain language so you don't need to be a developer to understand it.

---

## What Is This App?

The **Flamenco Player** is a web app (accessible from any browser) that lets users practice flamenco rhythms. It works like a specialized music player with two main features:

1. **Play flamenco tracks** organized into playlists (Solea por Buleria and Bulerias)
2. **Mute the guitar** on certain tracks so you can play along yourself

The app is designed for mobile phones (iPhone and Android) and can be "installed" on the home screen like a native app.

**Important:** This is a **prototype** -- it was built to validate the idea and demonstrate the concept. There are no user accounts, no payments, and no database. Everything resets when you refresh the page.

---

## What You're Receiving

| Item | What it is | Where it lives |
|------|-----------|---------------|
| **Source code** | All the code that makes the app work | GitHub repository |
| **Live website** | The app running on the internet | Vercel (hosting) |
| **Audio files** | The flamenco music files (MP3) | Inside the code repository |
| **This document** | Everything you need to know | This file |

### Your Accounts & Services

You will need access transferred for these two services:

1. **GitHub** (github.com) -- This is where the code is stored
   - Repository: `https://github.com/jdbarrancs2025/flamenco-app-prototype`
   - Think of it as a secure folder in the cloud that keeps track of every change ever made to the code

2. **Vercel** (vercel.com) -- This is where the app is hosted (published to the internet)
   - When someone visits your app URL, Vercel is the service that shows them the app
   - It's connected to GitHub: every time code changes are pushed to GitHub, Vercel automatically rebuilds and updates the live website

**No other accounts or services are needed.** There are no databases, no servers to manage, no API keys, and no monthly costs beyond Vercel hosting (the free tier may be sufficient for your usage).

---

## How the App Works (For Non-Developers)

### The Two Screens

1. **Home Screen** (`/`)
   - Shows two playlist cards: "Tablao, Solea por Buleria" and "Fiesta, Bulerias"
   - Tap a card to open that playlist

2. **Player Screen** (`/playlist/...`)
   - Shows all tracks in the playlist
   - Has play/pause, speed control (0.8x to 1.2x), loop, and mute buttons
   - Tracks can be reordered by dragging
   - Tracks can be deleted (temporarily -- comes back on refresh)

### Features That Work

- Play / Pause tracks
- Skip to any track by tapping it
- Mute guitar on tracks that have a separate guitar recording (shown with a guitar icon)
- Change playback speed (slower or faster)
- Loop a single track
- Reorder tracks by dragging
- Delete tracks (resets on page refresh)
- "Add to Home Screen" on phones for a native-app feel

### Decorative Elements (Not Functional)

These are part of the visual design but don't do anything yet -- they're placeholder for future features:

- The hamburger menu icon (top-left)
- Bottom navigation icons (except the headphones icon, which goes Home)
- "Plantillas" and "Progreso" tabs
- The shuffle button (shown crossed out)

---

## The Music Content

The app comes with **14 tracks** across **2 playlists**:

### Playlist 1: Tablao - Solea por Buleria (9 tracks)
- Includes tracks like "Salida de Cante," "Falseta 1," "A pasar fatiga," etc.
- 4 tracks have mutable guitar (you can mute the guitar to play along)

### Playlist 2: Fiesta - Bulerias (5 tracks)
- Includes tracks like "Aguilas que vais volando," "Tiro piedras por la calle," etc.
- 2 tracks have mutable guitar

The audio files are MP3 format and stored inside the project at `public/audio/`. Total size is about 12 MB.

**How mutable guitar works:** Some tracks have two audio files -- one with everything (cante + palmas), and one with just the guitar. The app plays both at the same time in perfect sync. When you tap "mute guitar," it silences the guitar-only file so you hear just the singing and clapping.

---

## How to Make Changes

### Adding or Changing Content (Playlists & Tracks)

The playlist data is defined in a single file: `src/data/playlists.ts`

To add a new track:
1. Put the audio file(s) in the `public/audio/` folder
2. Add a new entry in `playlists.ts` with the track name, audio file path, and number of compases
3. If the track should have mutable guitar, provide both a `main` and `guitar` audio file

To add a new playlist:
1. Add a new playlist object in `playlists.ts` following the same pattern as the existing ones
2. The home screen will automatically show it as a new card

**You will need a developer to make these changes**, but the changes are simple and well-structured.

### Changing Text or Labels

All visible text in the app is in **Spanish (Spain)**. The text is spread across the component files in `src/components/` and `src/pages/`. A developer can search and replace text as needed.

### Changing Colors or Styling

The main brand color is **purple (#6750A4)**. Colors and design variables are defined in:
- `src/styles/design-tokens.css` -- main design variables
- `src/index.css` -- global styles

---

## Technical Details (For Developers)

This section is for anyone doing future development work on the app.

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type-safe JavaScript |
| Vite | 7.3 | Build tool and dev server |
| Tailwind CSS | 4.1 | Styling |
| React Router | 7 | Page navigation |
| dnd-kit | 6/10 | Drag and drop |
| Lucide React | 0.562 | Icons |
| Web Audio API | (browser) | Audio playback engine |

### Prerequisites

- **Node.js** 22+ (tested with v22.17.0)
- **pnpm** 10+ (tested with v10.13.1) -- this is the package manager (like npm but faster)

### Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/jdbarrancs2025/flamenco-app-prototype.git
cd flamenco-app-prototype

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
# Opens at http://localhost:5173

# 4. Build for production
pnpm build

# 5. Preview production build locally
pnpm preview
```

### Project Structure (Key Files)

```
src/
  hooks/useAudioEngine.ts    -- The audio engine (most complex file, ~875 lines)
  pages/PlaylistView.tsx     -- Main player screen logic (~443 lines)
  pages/Home.tsx             -- Home screen
  data/playlists.ts          -- All playlist and track data
  types/index.ts             -- TypeScript type definitions
  components/                -- UI components (player controls, track list, etc.)
  styles/design-tokens.css   -- Design system variables

public/
  audio/                     -- All MP3 files
  manifest.json              -- PWA configuration
  icons/                     -- App icons

docs/                        -- Original design/spec documents (PRD, technical, etc.)
vercel.json                  -- Vercel hosting config (SPA routing)
```

### Deployment

The app is hosted on **Vercel**. Deployment is automatic:

1. Push code changes to the `main` branch on GitHub
2. Vercel detects the change and rebuilds the app automatically
3. The live site updates within about 1 minute

**Manual deployment** (if needed):
```bash
npx vercel --prod
```

### Key Architecture Notes

- **Audio Engine** (`useAudioEngine.ts`): Uses the Web Audio API for sample-accurate synchronization of dual audio tracks. Includes extensive iOS Safari workarounds (silent unlock, suspended state recovery, visibility change handling). This is the most critical and complex part of the codebase.

- **No backend/database**: All data is hardcoded in `playlists.ts`. State (deletions, reordering) resets on refresh.

- **PWA**: Basic "Add to Home Screen" support via `manifest.json`. No offline support (no service worker).

- **No environment variables**: Nothing to configure. No API keys, no secrets.

### Browser Support

| Browser | Status |
|---------|--------|
| iOS Safari | Tested and working (requires special audio handling) |
| Android Chrome | Tested and working |
| Desktop Chrome | Works |
| Desktop Safari | Works |
| Firefox | Should work (not extensively tested) |

---

## Costs & Billing

| Service | Current plan | Expected cost |
|---------|-------------|---------------|
| GitHub | Free tier | Free for private repos with limited collaborators |
| Vercel | Hobby or Pro | Free tier: 100 GB bandwidth/month. Pro: $20/month |

The app has no backend servers, databases, or third-party APIs, so there are no additional running costs.

---

## What to Do If Something Goes Wrong

### The website is down
- Check [Vercel Status](https://www.vercel-status.com/) for outages
- Log into your Vercel dashboard to check if the deployment is healthy
- The app has no server -- if Vercel is up, the app should be up

### Audio doesn't play on iPhone
- This is a known browser limitation. iPhones require a user tap before playing audio. The app already handles this, but if issues arise, make sure:
  - The user taps a play button (auto-play won't work)
  - Silent mode is off on the phone
  - The app is loaded fresh (not from a cached/old tab)

### Need to roll back a change
- Every code change is saved in Git history. A developer can revert to any previous version with one command

---

## Original Documentation

The `docs/` folder contains the original specification documents used to build this app:

| File | Contents |
|------|----------|
| `docs/PRD.md` | Product requirements -- what the app should do |
| `docs/TECHNICAL.md` | Technical architecture decisions |
| `docs/DESIGN.md` | Visual design specifications |
| `docs/AUDIO.md` | Audio system architecture (the most complex part) |
| `docs/MILESTONES.md` | Development phases and timeline |

---

## Contact & Support

For any questions about the code or how things work, a developer familiar with **React** and **TypeScript** should be able to understand and modify this project. The codebase is well-structured and documented.

If hiring a developer for future work, share this document and the `docs/` folder with them -- it contains everything they need to get started quickly.
