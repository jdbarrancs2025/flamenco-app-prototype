# Flamenco Audio Player - Project Instructions

## Project Overview

This is a **functional web prototype** for a flamenco music study app. It's a responsive PWA that allows users to practice flamenco rhythms with synchronized audio tracks and guitar mute functionality.

**This is NOT a production app** - it's a prototype for user validation and demonstration purposes.

## Key Technical Constraints

- **No backend required** - Pure frontend application
- **No authentication** - No login/users system
- **No database** - State resets on page refresh
- **No payments** - No subscription system
- **Must work on**: iOS Safari + Android Chrome (mobile-first)

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: CSS (follow Figma design exactly)
- **Audio**: Web Audio API (required for synchronized playback)
- **Routing**: React Router or Wouter
- **State**: React Context or Zustand
- **Hosting**: Vercel
- **PWA**: Basic manifest.json for "Add to Home Screen"

## Language

- **Code**: English (variables, comments, documentation)
- **UI Content**: Spanish (Spain) - all labels, track names, navigation text

## Critical Audio Requirements

1. **Synchronized dual-track playback**: Some tracks have 2 audio files (guitar + cante/palmas) that must play in perfect sync
2. **Mute guitar in real-time**: Toggle guitar track without affecting sync
3. **Speed control (0.8x - 1.2x)**: Change tempo without losing sync between tracks
4. **No audio glitches**: Smooth playback without cuts or delays

## Documentation Structure

Read these docs in order before starting development:

1. `docs/PRD.md` - Product requirements and scope
2. `docs/TECHNICAL.md` - Architecture and implementation details
3. `docs/DESIGN.md` - UI components and screens
4. `docs/AUDIO.md` - Audio system architecture
5. `docs/MILESTONES.md` - Development phases and acceptance criteria

## Development Approach

Follow the milestones defined in `docs/MILESTONES.md`:

### Milestone 1 (Week 1) - Base Structure & UI
1. Project setup (Vite + React + TypeScript + routing + PWA manifest)
2. Home screen UI (header, pills, playlist cards, tab bar)
3. Player screen layout (slider, controls, track list)
4. Navigation between screens
5. Responsive design (mobile-first)

### Milestone 2 (Week 2) - Audio Logic & Controls
1. Audio engine with Web Audio API (this is the critical path)
2. Play/pause, track selection, auto-advance
3. Dual-track synchronization for mutable tracks
4. Speed control (0.8x - 1.2x)
5. Guitar mute functionality
6. Loop single track
7. Drag & drop reordering

### Milestone 3 (Week 3) - Stabilization & Delivery
1. Track deletion
2. Bug fixes
3. Visual polish (Figma alignment)
4. PWA setup
5. Deployment to Vercel
6. Documentation

## Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## File Structure (Recommended)

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   └── Pills.tsx
│   ├── player/
│   │   ├── Player.tsx
│   │   ├── PlayerControls.tsx
│   │   ├── SpeedSlider.tsx
│   │   └── TrackList.tsx
│   └── home/
│       └── PlaylistCard.tsx
├── hooks/
│   └── useAudioEngine.ts
├── context/
│   └── AudioContext.tsx
├── data/
│   └── playlists.ts
├── pages/
│   ├── Home.tsx
│   └── Playlist.tsx
├── types/
│   └── index.ts
├── styles/
│   └── (CSS files)
├── App.tsx
└── main.tsx
```

## Important Notes

- The bottom navigation bar icons are **decorative only** - only the headphones icon (home) is functional
- The tabs "Plantillas", "Progreso", and "..." are **decorative only** - only "Mixer" tab works
- Shuffle button is **crossed out/disabled** in the design
- All track deletions are **temporary** - reset on page refresh or playlist change
- Mute state **persists** during playlist playback (even when looping back)
