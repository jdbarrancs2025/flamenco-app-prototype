# Milestone 3: Stabilization & Final Delivery - Complete Implementation Prompt

## Overview

You are completing **Milestone 3** of a flamenco music practice web app prototype. Milestones 1 and 2 are **100% complete**. The app has a working audio engine with dual-track synchronization, speed control, guitar muting, drag & drop reordering, and loop functionality.

**Your mission**: Complete the final stabilization phase focusing on track deletion, bug fixes, visual polish, PWA completion, and deployment.

---

## Priority Order for Milestone 3

### 1. TRACK DELETION (Priority #1)
### 2. Bug Fixes & Edge Cases
### 3. Visual Polish & Figma Alignment
### 4. PWA Completion
### 5. Deployment to Vercel
### 6. Documentation

---

## Project Context

### Tech Stack
- **Framework**: Vite + React 19 + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + CSS variables
- **Audio**: Web Audio API (custom hook)
- **Routing**: React Router v7
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React + custom SVGs
- **Hosting**: Vercel

### Key Constraints
- **No backend** - Pure frontend application
- **No authentication** - No login system
- **No database** - State resets on page refresh
- **Mobile-first** - Must work on iOS Safari + Android Chrome
- **UI Language**: Spanish (Spain)

### File Structure
```
flamenco-app-prototype/
├── public/
│   ├── manifest.json          # PWA manifest (exists, complete)
│   ├── icons/
│   │   ├── icon-192.png       # PWA icon (exists)
│   │   └── icon-512.png       # PWA icon (exists)
│   └── audio/                 # 28 WAV files across 2 playlists
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Pills.tsx
│   │   │   └── TabBar.tsx
│   │   ├── player/
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── SpeedSlider.tsx
│   │   │   ├── TrackList.tsx
│   │   │   ├── SortableTrackItem.tsx
│   │   │   └── TrackItem.tsx
│   │   └── home/
│   │       └── PlaylistCard.tsx
│   ├── hooks/
│   │   └── useAudioEngine.ts  # 686-line Web Audio API engine
│   ├── data/
│   │   └── playlists.ts       # 2 playlists, 14 tracks total
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── PlaylistView.tsx   # Main player logic (310 lines)
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── design-tokens.css
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html                 # PWA meta tags already added
├── package.json
├── vite.config.ts
└── vercel.json
```

---

## 1. TRACK DELETION (Priority #1)

### Current Implementation (in PlaylistView.tsx:224-234)

```typescript
const handleDelete = () => {
  if (tracks.length <= 1) return;

  const newTracks = tracks.filter((_, index) => index !== currentTrackIndex);
  setTracks(newTracks);

  // Adjust current track index
  if (currentTrackIndex >= newTracks.length) {
    setCurrentTrackIndex(Math.max(0, newTracks.length - 1));
  }
};
```

### Requirements

1. **Trash button deletes selected/current track**
   - Clicking trash removes the track at `currentTrackIndex`
   - Track should be removed from the visible list immediately

2. **Track removed from list**
   - Track disappears from TrackList component
   - List UI updates without flickering

3. **Playback continues correctly**
   - If deleting the currently PLAYING track:
     - Stop playback OR auto-advance to next track
     - Don't crash or leave audio playing orphaned
   - If deleting a track BEFORE current: adjust currentTrackIndex
   - If deleting a track AFTER current: no index adjustment needed

4. **Reset on refresh/playlist change**
   - Tracks reset to original when:
     - User refreshes page (already works via useState initialization)
     - User changes to different playlist (already works via playlist ID check)
     - User returns to home menu and comes back

### Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|-------------------|
| Delete currently playing track | Stop playback, load next track (or previous if last) |
| Delete last remaining track | Prevent deletion (button disabled or no-op) |
| Delete while paused | Just remove track, update index |
| Delete first track | Next track becomes index 0 |
| Delete last track in list | Previous track becomes current |
| Rapid multiple deletions | Handle gracefully, no race conditions |
| Delete track that was muted | Remove from mutedTrackIds Set |

### Implementation Suggestions

```typescript
const handleDelete = () => {
  // Prevent deleting last track
  if (tracks.length <= 1) return;

  const deletedTrackId = tracks[currentTrackIndex]?.id;
  const wasPlaying = audioState.isPlaying;

  // Stop playback if deleting current track
  if (wasPlaying) {
    stop();
  }

  // Remove from muted set if it was muted
  if (deletedTrackId && mutedTrackIds.has(deletedTrackId)) {
    setMutedTrackIds(prev => {
      const next = new Set(prev);
      next.delete(deletedTrackId);
      return next;
    });
  }

  // Remove track
  const newTracks = tracks.filter((_, index) => index !== currentTrackIndex);
  setTracks(newTracks);
  tracksRef.current = newTracks;

  // Determine new current index
  let newIndex = currentTrackIndex;
  if (currentTrackIndex >= newTracks.length) {
    newIndex = Math.max(0, newTracks.length - 1);
  }

  // If was playing, set flag to auto-play after track loads
  if (wasPlaying && newTracks.length > 0) {
    wasPlayingRef.current = true;
  }

  setCurrentTrackIndex(newIndex);
};
```

### Testing Checklist for Track Deletion

```
[ ] Delete track while playing - playback handles correctly
[ ] Delete track while paused - track removed, no crash
[ ] Delete first track - index adjusts to 0
[ ] Delete middle track - index adjusts correctly
[ ] Delete last track in list - previous becomes current
[ ] Delete muted track - mute state cleaned up
[ ] Attempt delete last remaining track - prevented
[ ] Delete multiple tracks rapidly - no race conditions
[ ] Delete then play - audio works correctly
[ ] Refresh page - tracks reset to original
[ ] Change playlist - tracks reset to original
[ ] Return home and back - tracks reset to original
```

---

## 2. Bug Fixes & Edge Cases

### Known Issues to Verify/Fix

1. **Audio engine cleanup on unmount**
   - Verify `destroy()` is called when leaving PlaylistView
   - No orphaned AudioContext instances

2. **Mute state persistence edge cases**
   - Mute a track → delete it → mute state should be removed
   - Mute a track → reorder it → mute state should persist
   - Mute multiple tracks → loop playlist → all mutes persist

3. **Playlist loop behavior**
   - Playlist loops at end (goes back to track 0)
   - Mute states preserved on loop
   - Deletion states preserved on loop

4. **Race conditions**
   - Rapid track selection
   - Rapid play/pause toggling
   - Speed slider while track is loading

5. **Error states**
   - Audio file fails to load → graceful error, not crash
   - Network timeout → user feedback

### Error Handling Pattern

```typescript
// Add error boundary or try-catch for audio operations
try {
  await loadTrack(track);
} catch (error) {
  console.error('[PlaylistView] Failed to load track:', error);
  // Optionally show user feedback
  // Don't crash - allow retry or skip to next track
}
```

---

## 3. Visual Polish & Figma Alignment

### Design Tokens (from design-tokens.css)

```css
/* Colors */
--color-primary: #6750A4;           /* Purple - active states */
--color-primary-container: #E8DEF8; /* Light purple - slider inactive */
--color-gray-text: #828282;
--color-gray-border: #E0E0E0;
--color-gray-bg: #F6F6F6;

/* Typography */
--font-title: 600 20px/140% 'Inter';
--font-card-title: 600 28px/120% 'Inter';
--font-body: 500 14px/140% 'Inter';
--font-caption: 500 12px/150% 'Inter';

/* Spacing */
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* Border Radius */
--radius-sm: 8px;
--radius-full: 20px;
--radius-slider: 16px;
```

### Visual Checklist

```
[ ] Active track name is purple (#6750A4)
[ ] Inactive track names are black
[ ] Muted guitar icon shows purple when muted
[ ] Loop button shows purple when active
[ ] Speed slider has correct purple gradient
[ ] Pills have correct active/inactive states
[ ] Tab bar icons have correct opacity (inactive: 0.5)
[ ] Playlist cards have correct border and shadow
[ ] Spacing matches Figma (margins, paddings)
[ ] Track list scrolls smoothly with visible scrollbar
[ ] Drag handle is visible on track items
```

---

## 4. PWA Completion

### Current State (Already Done)
- `manifest.json` exists with correct config
- `index.html` has all required meta tags:
  - `<link rel="manifest" href="/manifest.json">`
  - `<meta name="theme-color" content="#6750A4">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
  - `<link rel="apple-touch-icon" href="/icons/icon-192.png">`

### Current manifest.json
```json
{
  "name": "Flamenco Player",
  "short_name": "Flamenco",
  "description": "Aplicación para practicar ritmos flamencos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6750A4",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### PWA Testing Checklist

```
[ ] iOS Safari: "Add to Home Screen" prompt appears
[ ] iOS Safari: App opens in standalone mode (no browser UI)
[ ] iOS Safari: App icon displays correctly on home screen
[ ] Android Chrome: "Install app" prompt appears
[ ] Android Chrome: App installs correctly
[ ] Android Chrome: App opens in standalone mode
[ ] Theme color shows in mobile browser header
[ ] Splash screen displays (if supported)
```

### Optional Enhancements (if time permits)

1. **Service Worker for offline caching** (NOT required for prototype)
2. **Splash screen customization**
3. **iOS-specific icons** (180x180 for older devices)

---

## 5. Deployment to Vercel

### Current Setup
- `vercel.json` exists in project root
- Project is a Vite + React SPA

### Deployment Steps

```bash
# 1. Ensure build works locally
pnpm build

# 2. Test production build locally
pnpm preview

# 3. Deploy to Vercel
# Option A: Via Vercel CLI
npx vercel --prod

# Option B: Via GitHub integration
# Push to main branch → auto-deploys

# 4. Verify deployed URL works
# - Test on desktop browser
# - Test on iOS Safari (real device)
# - Test on Android Chrome (real device)
```

### vercel.json Configuration (if SPA routing issues)

```json
{
  "rewrites": [
    { "source": "/((?!api|audio|icons).*)", "destination": "/index.html" }
  ]
}
```

### Post-Deployment Verification

```
[ ] Home screen loads correctly
[ ] Navigation to playlists works
[ ] Audio plays correctly
[ ] All controls work (play, pause, mute, speed, loop, delete)
[ ] PWA install works on mobile
[ ] No console errors
[ ] No 404s for audio files
[ ] HTTPS enabled (Vercel handles this)
```

---

## 6. Documentation

### README.md Updates

```markdown
# Flamenco Player

A web prototype for practicing flamenco rhythms with synchronized audio playback.

## Features

- 2 playlists with 14 tracks total
- Synchronized dual-track playback (guitar + cante/palmas)
- Real-time guitar muting
- Speed control (0.8x - 1.2x)
- Track reordering via drag & drop
- Single track loop
- Track deletion (session only)
- PWA support (Add to Home Screen)

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Web Audio API
- React Router v7
- @dnd-kit for drag & drop

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
\`\`\`

## Deployment

Deployed on Vercel: [URL HERE]

## Notes

- This is a prototype for user validation, not a production app
- No backend/database - all state resets on refresh
- Audio files are WAV format for lossless quality
- Tested on iOS Safari and Android Chrome
```

---

## Key Code References

### PlaylistView.tsx (Main Logic)

The player page at `src/pages/PlaylistView.tsx` manages:
- Track state and ordering
- Current track index
- Mute state persistence
- Audio engine integration
- Auto-advance on track end
- Prefetching next track

Key state variables:
```typescript
const [tracks, setTracks] = useState<Track[]>(() => playlist?.tracks ? [...playlist.tracks] : []);
const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
const [isLooping, setIsLooping] = useState(false);
const [mutedTrackIds, setMutedTrackIds] = useState<Set<string>>(new Set());
const [playbackRate, setPlaybackRate] = useState(1.0);
```

### useAudioEngine.ts (Audio Engine)

The audio hook at `src/hooks/useAudioEngine.ts` provides:
- `initialize()` - Create AudioContext (must be on user gesture for iOS)
- `loadTrack(track)` - Load audio buffers (parallel for dual-track)
- `prefetchTrack(track)` - Background load for next track
- `play()` / `pause()` / `stop()` - Playback control
- `setPlaybackRate(rate)` - Speed control (0.8-1.2)
- `setGuitarMuted(muted)` - Toggle guitar audio
- `onTrackEnd(callback)` - Register end handler

### PlayerControls.tsx

The controls component provides buttons for:
- Trash (delete) - calls `onDelete`
- Waveform (mute guitar) - calls `onToggleMute`
- Play/Pause - calls `onPlayPause`
- Shuffle (disabled/decorative)
- Repeat (loop) - calls `onToggleLoop`

---

## TypeScript Types

```typescript
interface Track {
  id: string;
  name: string;
  compases: number;
  hasMuteableGuitar: boolean;
  audioFiles: {
    main: string;
    guitar?: string;
  };
}

interface Playlist {
  id: string;
  name: string;
  subtitle: string;
  fullTitle: string;
  tracks: Track[];
}

interface AudioEngineHookState {
  isPlaying: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentTrackId: string | null;
}
```

---

## Acceptance Criteria (Milestone 3)

### Must Pass
- [ ] All Milestone 1 & 2 criteria still pass
- [ ] Track deletion works correctly
- [ ] No critical bugs
- [ ] Playlist loops correctly
- [ ] PWA installable on iOS and Android
- [ ] Interface matches Figma design
- [ ] Code is clean and maintainable
- [ ] Deployed and accessible via public URL

### Testing Matrix

| Feature | Desktop Chrome | iOS Safari | Android Chrome |
|---------|---------------|------------|----------------|
| Play/Pause | ✓ | ✓ | ✓ |
| Track Selection | ✓ | ✓ | ✓ |
| Auto-Advance | ✓ | ✓ | ✓ |
| Speed Control | ✓ | ✓ | ✓ |
| Guitar Mute | ✓ | ✓ | ✓ |
| Loop | ✓ | ✓ | ✓ |
| Drag & Drop | ✓ | ✓ | ✓ |
| **Track Delete** | ✓ | ✓ | ✓ |
| PWA Install | N/A | ✓ | ✓ |

---

## Commands Reference

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Type Checking
pnpm tsc --noEmit     # Check types without emitting

# Deployment
npx vercel --prod     # Deploy to Vercel
```

---

## Latest Documentation & Best Practices (2025)

### React 19 Best Practices

#### Avoiding Stale Closures with useCallback
When using functions as dependencies in useEffect, wrap them with useCallback to prevent unnecessary re-runs:

```typescript
// ✅ CORRECT - useCallback stabilizes function reference
const createOptions = useCallback(() => {
  return { serverUrl: 'https://localhost:1234', roomId: roomId };
}, [roomId]); // Only changes when roomId changes

useEffect(() => {
  const options = createOptions();
  const connection = createConnection(options);
  connection.connect();
  return () => connection.disconnect();
}, [createOptions]); // Only re-runs when createOptions changes
```

#### Race Condition Handling in useEffect
Use an `ignore` flag in cleanup to prevent stale async responses:

```typescript
// ✅ CORRECT - Handles race conditions properly
useEffect(() => {
  let ignore = false;

  async function loadData() {
    const result = await fetchData(id);
    if (!ignore) {
      setData(result); // Only update if not cancelled
    }
  }

  loadData();
  return () => { ignore = true; }; // Cleanup cancels stale updates
}, [id]);
```

#### State Updates Using Updater Functions
Use updater functions when new state depends on previous state:

```typescript
// ✅ CORRECT - Uses updater function for state based on previous
setAge(a => a + 1);
setMutedTrackIds(prev => {
  const next = new Set(prev);
  next.delete(trackId);
  return next;
});
```

### React Router v7 Best Practices

#### useParams for Dynamic Routes
```typescript
import { useParams } from "react-router";

// Route: /playlist/:playlistId
export function PlaylistView() {
  const { playlistId } = useParams();
  // playlistId is typed as string | undefined
}
```

#### Programmatic Navigation with useNavigate
```typescript
import { useNavigate, useLocation } from "react-router";

function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigate to route
  navigate("/dashboard");

  // Navigate with state
  navigate("/dashboard", {
    state: { from: location.pathname }
  });

  // Replace history (no back button)
  navigate("/dashboard", { replace: true });

  // Go back
  navigate(-1);
}
```

### dnd-kit Best Practices (Sortable Lists)

#### Complete Sortable Implementation Pattern
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function SortableList() {
  const [items, setItems] = useState(['1', '2', '3']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id) => <SortableItem key={id} id={id} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Tailwind CSS v4 with Vite

#### Vite Plugin Configuration (Current Standard)
```typescript
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
});
```

#### CSS Import (v4 Syntax)
```css
/* src/index.css */
@import "tailwindcss";
```

### Vite Production Build

#### Build Commands
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Output goes to dist/ directory by default
```

#### Manifest for Backend Integration
After `vite build`, a `.vite/manifest.json` maps source files to hashed outputs for correct asset references.

---

## Summary

**Focus Areas for Milestone 3:**

1. **Track Deletion** - Complete and test all edge cases
2. **Bug Hunting** - Test edge cases, race conditions, error states
3. **Visual Polish** - Ensure Figma alignment
4. **PWA Testing** - Verify install works on real devices
5. **Deployment** - Get public URL working
6. **Documentation** - Update README with final instructions

**Definition of Done:**
- All acceptance criteria pass
- Tested on real iOS and Android devices
- Deployed URL accessible
- Code pushed to repository
- No console errors in production
