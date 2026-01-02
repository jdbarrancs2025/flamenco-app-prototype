# Technical Architecture Document

## 1. Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Build Tool | Vite | Fast dev server, simple config |
| Framework | React 18+ | Familiar, component-based |
| Language | TypeScript | Type safety, better DX |
| Styling | CSS Modules or plain CSS | Match Figma exactly |
| Routing | React Router v6 or Wouter | Simple SPA navigation |
| State | React Context + useReducer | No need for Redux complexity |
| Audio | Web Audio API | Required for synchronized playback |
| Icons | Lucide React or custom SVG | Match Figma icons |
| Hosting | Vercel | Simple deployment, good for SPAs |

## 2. Project Structure

```
flamenco-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── favicon.ico
│   └── icons/                  # PWA icons
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.css
│   │   │   ├── TabBar.tsx
│   │   │   ├── TabBar.css
│   │   │   ├── Pills.tsx
│   │   │   └── Pills.css
│   │   ├── player/
│   │   │   ├── Player.tsx
│   │   │   ├── Player.css
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── PlayerControls.css
│   │   │   ├── SpeedSlider.tsx
│   │   │   ├── SpeedSlider.css
│   │   │   ├── TrackList.tsx
│   │   │   ├── TrackList.css
│   │   │   ├── TrackItem.tsx
│   │   │   └── TrackItem.css
│   │   └── home/
│   │       ├── PlaylistCard.tsx
│   │       └── PlaylistCard.css
│   ├── hooks/
│   │   ├── useAudioEngine.ts   # Core audio logic
│   │   └── useDragAndDrop.ts   # Track reordering
│   ├── context/
│   │   ├── AudioContext.tsx    # Global audio state
│   │   └── PlaylistContext.tsx # Playlist state
│   ├── data/
│   │   └── playlists.ts        # Playlist/track definitions
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Home.css
│   │   ├── PlaylistView.tsx
│   │   └── PlaylistView.css
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   └── audioUtils.ts       # Audio helper functions
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css               # Global styles, CSS reset
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 3. Type Definitions

```typescript
// src/types/index.ts

export interface Track {
  id: string;
  name: string;
  compases: number;
  hasMuteableGuitar: boolean;
  audioFiles: {
    main: string;           // URL to main audio (or cante+palmas if mutable)
    guitar?: string;        // URL to guitar audio (only if mutable)
  };
}

export interface Playlist {
  id: string;
  name: string;             // e.g., "SxB"
  subtitle: string;         // e.g., "Tablao"
  fullTitle: string;        // e.g., "Tablao, Soleá por Bulería"
  tracks: Track[];
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  playbackRate: number;     // 0.8 to 1.2
  isLooping: boolean;       // Single track loop
  mutedTracks: Set<string>; // Track IDs with muted guitar
}

export interface PlaylistState {
  activePlaylist: Playlist | null;
  tracks: Track[];          // Current playlist tracks (can be modified)
  deletedTrackIds: Set<string>;
}
```

## 4. Audio Architecture

### 4.1 Why Web Audio API?

HTML5 `<audio>` elements cannot guarantee sample-accurate synchronization between two audio files. Web Audio API provides:

- **Precise timing**: `AudioContext.currentTime` has ~15 decimal precision
- **Synchronized start**: Multiple `AudioBufferSourceNode` can start at exact same timestamp
- **Real-time speed control**: `playbackRate` changes apply immediately
- **Independent volume control**: Each source node has its own gain

### 4.2 Audio Engine Design

```typescript
// Simplified architecture

class AudioEngine {
  private audioContext: AudioContext;
  private mainSource: AudioBufferSourceNode | null;
  private guitarSource: AudioBufferSourceNode | null;
  private mainGain: GainNode;
  private guitarGain: GainNode;
  private bufferCache: Map<string, AudioBuffer>;
  
  // State
  private isPlaying: boolean;
  private startTime: number;       // AudioContext time when playback started
  private startOffset: number;     // Position in track when started
  private playbackRate: number;
  
  constructor() {
    this.audioContext = new AudioContext();
    this.mainGain = this.audioContext.createGain();
    this.guitarGain = this.audioContext.createGain();
    this.mainGain.connect(this.audioContext.destination);
    this.guitarGain.connect(this.audioContext.destination);
  }
  
  async loadTrack(track: Track): Promise<void> {
    // Load and decode audio buffers
    // Cache them for reuse
  }
  
  play(track: Track, offset: number = 0): void {
    // Create new source nodes (they're single-use)
    // Start both at exact same audioContext.currentTime
  }
  
  pause(): void {
    // Stop sources
    // Calculate current position for resume
  }
  
  setPlaybackRate(rate: number): void {
    // Apply to both sources simultaneously
  }
  
  setGuitarMuted(muted: boolean): void {
    // Set guitarGain.gain.value to 0 or 1
  }
}
```

### 4.3 iOS Safari Considerations

```typescript
// Must unlock AudioContext on first user interaction
function unlockAudioContext(audioContext: AudioContext): void {
  if (audioContext.state === 'suspended') {
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    
    const unlock = () => {
      audioContext.resume().then(() => {
        events.forEach(e => document.body.removeEventListener(e, unlock));
      });
    };
    
    events.forEach(e => document.body.addEventListener(e, unlock, false));
  }
}

// Handle interrupted state (when user minimizes Safari)
audioContext.onstatechange = () => {
  if (audioContext.state === 'interrupted') {
    audioContext.resume();
  }
};
```

## 5. State Management

### 5.1 Audio Context (Global)

```typescript
// src/context/AudioContext.tsx

interface AudioContextValue {
  // State
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLooping: boolean;
  mutedTracks: Set<string>;
  
  // Actions
  play: () => void;
  pause: () => void;
  playTrack: (track: Track) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  toggleGuitarMute: (trackId: string) => void;
}
```

### 5.2 Playlist Context

```typescript
// src/context/PlaylistContext.tsx

interface PlaylistContextValue {
  // State
  activePlaylist: Playlist | null;
  tracks: Track[];
  
  // Actions
  setActivePlaylist: (playlist: Playlist) => void;
  deleteTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  resetPlaylist: () => void;
}
```

## 6. Routing

```typescript
// Simple routes
const routes = [
  { path: '/', element: <Home /> },
  { path: '/playlist/:playlistId', element: <PlaylistView /> },
];
```

## 7. PWA Configuration

```json
// public/manifest.json
{
  "name": "Flamenco Player",
  "short_name": "Flamenco",
  "description": "Flamenco rhythm practice app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6750A4",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 8. Audio File Hosting

Audio files will be hosted on AWS S3 or similar CDN. The URL structure should be:

```
https://cdn.example.com/audio/
├── playlist-1/
│   ├── 01-base-solea-x2.mp3
│   ├── 02-salida-cante-main.mp3      # cante + palmas
│   ├── 02-salida-cante-guitar.mp3    # guitar only
│   ├── 03-base-solea.mp3
│   └── ...
└── playlist-2/
    └── ...
```

For development, use placeholder audio files or the actual files if provided.

## 9. Performance Considerations

1. **Preload audio buffers** when entering playlist view
2. **Cache decoded buffers** to avoid re-decoding
3. **Use appropriate audio format** (MP3 for compatibility, or AAC)
4. **Lazy load** non-critical components
5. **Minimize re-renders** in track list during playback

## 10. Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome Android | Latest | Primary target |
| Safari iOS | Latest | Primary target, handle AudioContext restrictions |
| Chrome Desktop | Latest | Secondary |
| Safari Desktop | Latest | Secondary |
| Firefox | Latest | Should work, not primary target |
