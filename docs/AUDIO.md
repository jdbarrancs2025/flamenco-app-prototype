# Audio System Documentation

## 1. Overview

The audio system is the **core technical challenge** of this project. It must:

1. Play two audio files (guitar + cante/palmas) in **perfect synchronization**
2. Allow **real-time muting** of the guitar track
3. Support **speed changes** (0.8x - 1.2x) without losing sync
4. Work reliably on **iOS Safari** and **Android Chrome**

## 2. Why Web Audio API?

### HTML5 Audio Limitations

```javascript
// This approach WILL NOT work for synchronized playback
const audio1 = new Audio('guitar.mp3');
const audio2 = new Audio('cante.mp3');

audio1.play();
audio2.play(); // ❌ No guarantee these start at the same time!
```

Problems:
- Network latency varies between files
- Browser may introduce different delays
- No sample-accurate timing control
- Speed changes affect tracks independently

### Web Audio API Advantages

```javascript
// Web Audio API provides precise timing
const audioContext = new AudioContext();
const startTime = audioContext.currentTime + 0.1; // Schedule 100ms in future

guitarSource.start(startTime);  // ✅ Both start at EXACT same audio time
canteSource.start(startTime);   // ✅ Guaranteed synchronization
```

## 3. Audio Engine Architecture

### 3.1 Class Structure

```typescript
// src/hooks/useAudioEngine.ts

interface AudioEngineState {
  isPlaying: boolean;
  currentTrackId: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

interface AudioEngine {
  // Initialization
  initialize(): Promise<void>;
  
  // Playback control
  loadTrack(track: Track): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  
  // Speed control
  setPlaybackRate(rate: number): void;
  
  // Guitar mute
  setGuitarMuted(muted: boolean): void;
  
  // State
  getState(): AudioEngineState;
  onStateChange(callback: (state: AudioEngineState) => void): void;
  onTrackEnd(callback: () => void): void;
}
```

### 3.2 Implementation

```typescript
class AudioEngineImpl implements AudioEngine {
  private audioContext: AudioContext | null = null;
  private mainGainNode: GainNode | null = null;
  private guitarGainNode: GainNode | null = null;
  
  private mainSource: AudioBufferSourceNode | null = null;
  private guitarSource: AudioBufferSourceNode | null = null;
  
  private mainBuffer: AudioBuffer | null = null;
  private guitarBuffer: AudioBuffer | null = null;
  
  private bufferCache: Map<string, AudioBuffer> = new Map();
  
  // Playback state tracking
  private isPlaying = false;
  private startTime = 0;        // audioContext.currentTime when playback started
  private startOffset = 0;      // Position in audio when playback started
  private playbackRate = 1.0;
  private guitarMuted = false;
  
  private stateCallbacks: ((state: AudioEngineState) => void)[] = [];
  private trackEndCallbacks: (() => void)[] = [];
  
  async initialize(): Promise<void> {
    // Create AudioContext (must be called after user interaction on iOS)
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create gain nodes for volume control
    this.mainGainNode = this.audioContext.createGain();
    this.guitarGainNode = this.audioContext.createGain();
    
    // Connect to destination
    this.mainGainNode.connect(this.audioContext.destination);
    this.guitarGainNode.connect(this.audioContext.destination);
    
    // Handle iOS Safari restrictions
    this.setupiOSHandling();
  }
  
  private setupiOSHandling(): void {
    if (!this.audioContext) return;
    
    const ctx = this.audioContext;
    
    // Resume on user interaction
    const resume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    
    ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
      document.body.addEventListener(event, resume, { once: true });
    });
    
    // Handle interrupted state (iOS background)
    ctx.onstatechange = () => {
      if (ctx.state === 'interrupted') {
        ctx.resume();
      }
    };
  }
  
  async loadTrack(track: Track): Promise<void> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    // Load main audio (always required)
    this.mainBuffer = await this.loadBuffer(track.audioFiles.main);
    
    // Load guitar audio (only for mutable tracks)
    if (track.hasMuteableGuitar && track.audioFiles.guitar) {
      this.guitarBuffer = await this.loadBuffer(track.audioFiles.guitar);
    } else {
      this.guitarBuffer = null;
    }
  }
  
  private async loadBuffer(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    
    // Fetch and decode
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    // Cache for reuse
    this.bufferCache.set(url, audioBuffer);
    
    return audioBuffer;
  }
  
  play(): void {
    if (!this.audioContext || !this.mainBuffer) return;
    if (this.isPlaying) return;
    
    // Create new source nodes (they are single-use)
    this.mainSource = this.audioContext.createBufferSource();
    this.mainSource.buffer = this.mainBuffer;
    this.mainSource.playbackRate.value = this.playbackRate;
    this.mainSource.connect(this.mainGainNode!);
    
    // Handle track end
    this.mainSource.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.trackEndCallbacks.forEach(cb => cb());
      }
    };
    
    // Create guitar source if track has separate guitar
    if (this.guitarBuffer) {
      this.guitarSource = this.audioContext.createBufferSource();
      this.guitarSource.buffer = this.guitarBuffer;
      this.guitarSource.playbackRate.value = this.playbackRate;
      this.guitarSource.connect(this.guitarGainNode!);
      
      // Apply current mute state
      this.guitarGainNode!.gain.value = this.guitarMuted ? 0 : 1;
    }
    
    // Start both at exact same time
    const startAt = this.audioContext.currentTime;
    this.mainSource.start(startAt, this.startOffset);
    this.guitarSource?.start(startAt, this.startOffset);
    
    this.isPlaying = true;
    this.startTime = startAt;
    this.notifyStateChange();
  }
  
  pause(): void {
    if (!this.isPlaying) return;
    
    // Calculate current position
    const elapsed = (this.audioContext!.currentTime - this.startTime) * this.playbackRate;
    this.startOffset = this.startOffset + elapsed;
    
    // Stop sources
    this.mainSource?.stop();
    this.guitarSource?.stop();
    
    this.isPlaying = false;
    this.notifyStateChange();
  }
  
  stop(): void {
    this.pause();
    this.startOffset = 0;
    this.notifyStateChange();
  }
  
  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) {
      this.mainSource?.stop();
      this.guitarSource?.stop();
      this.isPlaying = false;
    }
    
    this.startOffset = Math.max(0, Math.min(time, this.getDuration()));
    
    if (wasPlaying) {
      this.play();
    } else {
      this.notifyStateChange();
    }
  }
  
  setPlaybackRate(rate: number): void {
    // Clamp to valid range
    this.playbackRate = Math.max(0.8, Math.min(1.2, rate));
    
    // Apply to active sources
    if (this.mainSource) {
      this.mainSource.playbackRate.setValueAtTime(
        this.playbackRate,
        this.audioContext!.currentTime
      );
    }
    if (this.guitarSource) {
      this.guitarSource.playbackRate.setValueAtTime(
        this.playbackRate,
        this.audioContext!.currentTime
      );
    }
    
    this.notifyStateChange();
  }
  
  setGuitarMuted(muted: boolean): void {
    this.guitarMuted = muted;
    
    if (this.guitarGainNode) {
      // Use setValueAtTime for immediate, glitch-free change
      this.guitarGainNode.gain.setValueAtTime(
        muted ? 0 : 1,
        this.audioContext!.currentTime
      );
    }
  }
  
  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.startOffset;
    }
    
    const elapsed = (this.audioContext!.currentTime - this.startTime) * this.playbackRate;
    return this.startOffset + elapsed;
  }
  
  getDuration(): number {
    return this.mainBuffer?.duration ?? 0;
  }
  
  getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTrackId: null, // Managed by parent component
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      playbackRate: this.playbackRate,
    };
  }
  
  onStateChange(callback: (state: AudioEngineState) => void): void {
    this.stateCallbacks.push(callback);
  }
  
  onTrackEnd(callback: () => void): void {
    this.trackEndCallbacks.push(callback);
  }
  
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateCallbacks.forEach(cb => cb(state));
  }
}
```

## 4. Audio File Structure

### 4.1 For Mutable Tracks (6 tracks)

Each mutable track has **2 separate audio files**:

```
track-name-main.mp3    → Contains: cante + palmas (everything except guitar)
track-name-guitar.mp3  → Contains: guitar only
```

Both files must:
- Be the **exact same duration**
- Be recorded at the **same tempo**
- Start at the **exact same point**

### 4.2 For Non-Mutable Tracks

Single audio file with all instruments mixed:

```
track-name.mp3  → Contains: guitar + cante + palmas (all mixed)
```

### 4.3 Track Data Structure

```typescript
// src/data/playlists.ts

export const playlists: Playlist[] = [
  {
    id: 'sxb',
    name: 'SxB',
    subtitle: 'Tablao',
    fullTitle: 'Tablao, Soleá por Bulería',
    tracks: [
      {
        id: 'sxb-01',
        name: 'Base Soléa por Bulerías x2',
        compases: 2,
        hasMuteableGuitar: false,
        audioFiles: {
          main: '/audio/playlist-1/01-base-solea-x2.mp3',
        },
      },
      {
        id: 'sxb-02',
        name: 'Salida de Cante Soleá por Bulería',
        compases: 5,
        hasMuteableGuitar: true,
        audioFiles: {
          main: '/audio/playlist-1/02-salida-cante-main.mp3',
          guitar: '/audio/playlist-1/02-salida-cante-guitar.mp3',
        },
      },
      // ... more tracks
    ],
  },
  // ... playlist 2
];
```

## 5. Playback Speed

### 5.1 How playbackRate Works

```javascript
source.playbackRate.value = 0.8;  // 80% speed (slower)
source.playbackRate.value = 1.0;  // Normal speed
source.playbackRate.value = 1.2;  // 120% speed (faster)
```

**Important**: Changing `playbackRate` also changes pitch. At 0.8x, audio will sound lower; at 1.2x, higher. This is acceptable for flamenco practice (similar to slowing down a vinyl record).

### 5.2 Maintaining Sync During Speed Change

Both sources must receive the speed change at the **exact same audio time**:

```typescript
const changeTime = audioContext.currentTime;

mainSource.playbackRate.setValueAtTime(newRate, changeTime);
guitarSource.playbackRate.setValueAtTime(newRate, changeTime);
```

Using `setValueAtTime()` instead of direct assignment ensures both changes happen simultaneously.

## 6. iOS Safari Specifics

### 6.1 AudioContext Suspension

iOS Safari suspends AudioContext by default until user interaction:

```typescript
// Check state
if (audioContext.state === 'suspended') {
  // Must call resume() from a user gesture handler
}
```

### 6.2 Solution: Initialize on First Play

```typescript
const handlePlayClick = async () => {
  // Initialize audio context on first user interaction
  if (!audioEngine.isInitialized()) {
    await audioEngine.initialize();
  }
  
  // Now safe to play
  audioEngine.play();
};
```

### 6.3 Background/Interrupted State

When user switches apps or locks screen, AudioContext becomes 'interrupted':

```typescript
audioContext.onstatechange = () => {
  if (audioContext.state === 'interrupted') {
    // Try to resume (will work if app comes back to foreground)
    audioContext.resume();
  }
};
```

## 7. React Integration

### 7.1 Custom Hook

```typescript
// src/hooks/useAudioPlayer.ts

export function useAudioPlayer() {
  const [engine] = useState(() => new AudioEngineImpl());
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTrackId: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
  });
  
  useEffect(() => {
    engine.onStateChange(setState);
    engine.onTrackEnd(() => {
      // Handle auto-advance to next track
    });
    
    // Update currentTime periodically during playback
    let animationId: number;
    const updateTime = () => {
      if (engine.getState().isPlaying) {
        setState(prev => ({
          ...prev,
          currentTime: engine.getCurrentTime(),
        }));
      }
      animationId = requestAnimationFrame(updateTime);
    };
    updateTime();
    
    return () => cancelAnimationFrame(animationId);
  }, [engine]);
  
  return {
    state,
    play: () => engine.play(),
    pause: () => engine.pause(),
    loadTrack: (track: Track) => engine.loadTrack(track),
    setPlaybackRate: (rate: number) => engine.setPlaybackRate(rate),
    setGuitarMuted: (muted: boolean) => engine.setGuitarMuted(muted),
    seek: (time: number) => engine.seek(time),
  };
}
```

## 8. Testing Checklist

### Before Moving to Next Feature

- [ ] Two audio files play in perfect sync
- [ ] Muting guitar doesn't affect sync
- [ ] Speed change doesn't cause audio glitch
- [ ] Speed change applies to both tracks equally
- [ ] Pause/resume maintains correct position
- [ ] Track end triggers callback
- [ ] Works on iOS Safari (test on real device)
- [ ] Works on Android Chrome
- [ ] No audio glitches on speed change
- [ ] No drift after extended playback (test 5+ minutes)

### Testing Tools

For development without actual audio files, create test files:

```bash
# Using ffmpeg to create test tones
ffmpeg -f lavfi -i "sine=frequency=440:duration=60" -ac 2 test-main.mp3
ffmpeg -f lavfi -i "sine=frequency=880:duration=60" -ac 2 test-guitar.mp3
```

This creates 60-second test files with different pitches so you can hear if they're playing together.
