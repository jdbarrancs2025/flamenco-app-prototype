// src/hooks/useAudioEngine.ts
// Web Audio API engine for synchronized dual-track playback

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Track } from '../types';

/**
 * Extended AudioContext type to include webkit prefix for iOS Safari
 */
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * State exposed by the audio engine hook
 */
export interface AudioEngineHookState {
  isPlaying: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentTrackId: string | null;
}

/**
 * AudioEngine class - handles all Web Audio API operations
 *
 * Key concepts:
 * - AudioContext: The main audio processing graph
 * - GainNode: Controls volume (used for muting guitar)
 * - AudioBufferSourceNode: Plays audio buffers (single-use, must recreate for each play)
 * - AudioBuffer: Decoded audio data (cached for reuse)
 */
class AudioEngine {
  // Audio Context
  private audioContext: AudioContext | null = null;

  // Gain Nodes (for volume/mute control)
  private mainGainNode: GainNode | null = null;
  private guitarGainNode: GainNode | null = null;

  // Buffer Source Nodes (single-use, recreated on each play)
  private mainSource: AudioBufferSourceNode | null = null;
  private guitarSource: AudioBufferSourceNode | null = null;

  // Audio Buffers (cached)
  private mainBuffer: AudioBuffer | null = null;
  private guitarBuffer: AudioBuffer | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  // Playback State
  private _isPlaying = false;
  private _isInitialized = false;
  private startTime = 0;        // audioContext.currentTime when started
  private startOffset = 0;      // Position in track when started
  private _playbackRate = 1.0;
  private guitarMuted = false;
  private currentTrackId: string | null = null;

  // Callbacks
  private onTrackEndCallback: (() => void) | null = null;
  private onStateChangeCallback: (() => void) | null = null;

  /**
   * Unlock iOS audio by playing silent audio via HTML5 <audio> element.
   * This tricks iOS into using "playback" mode instead of "ambient" mode,
   * allowing audio to play even when the silent/mute switch is ON.
   */
  private unlockiOSAudio(): void {
    // Create audio element (iOS treats <audio> differently than Web Audio)
    const audio = document.createElement('audio');

    // Tiny silent MP3 data URI
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAANIAAAAgAADSAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxBkAAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

    // Required attributes for iOS
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    // Play silently to unlock "playback" mode
    audio.volume = 0.001;
    audio.play().catch(() => {
      // Ignore errors - this is a best-effort unlock
    });
  }

  /**
   * Initialize the AudioContext and gain nodes
   * Must be called SYNCHRONOUSLY during a user gesture on iOS
   */
  initialize(): void {
    if (this._isInitialized) return;

    // Unlock iOS audio first (switches to "playback" mode for silent switch bypass)
    this.unlockiOSAudio();

    // Create AudioContext (with webkit prefix for older iOS Safari)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Resume AudioContext synchronously (must stay in user gesture context)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();  // No await - must be synchronous!
    }

    // Create gain nodes for independent volume control
    this.mainGainNode = this.audioContext.createGain();
    this.guitarGainNode = this.audioContext.createGain();

    // Connect gain nodes to destination (speakers)
    this.mainGainNode.connect(this.audioContext.destination);
    this.guitarGainNode.connect(this.audioContext.destination);

    // Setup iOS Safari handling for future interactions
    this.setupiOSHandling();

    this._isInitialized = true;
    this.notifyStateChange();
  }

  /**
   * Handle iOS Safari specific audio context issues
   * - Resume suspended context on user interaction
   * - Handle interrupted state when app goes to background
   */
  private setupiOSHandling(): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Resume on user interaction (iOS Safari suspends by default)
    const resume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };

    // Add listeners for common user interactions
    ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
      document.body.addEventListener(event, resume, { once: true });
    });

    // Handle interrupted state (iOS background/foreground transitions)
    ctx.onstatechange = () => {
      if (ctx.state === 'interrupted') {
        ctx.resume();
      }
    };
  }

  /**
   * Load and decode an audio file into a buffer
   * Uses caching to avoid re-fetching the same file
   */
  private async loadBuffer(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Fetch the audio file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${url}`);
    }

    // Decode the audio data
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Cache for reuse
    this.bufferCache.set(url, audioBuffer);

    return audioBuffer;
  }

  /**
   * Load a track's audio files into buffers
   * For mutable tracks, loads both main and guitar files
   */
  async loadTrack(track: Track): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Stop any current playback
    if (this._isPlaying) {
      this.stop();
    }

    // Reset position for new track
    this.startOffset = 0;
    this.currentTrackId = track.id;

    // Load main audio (always required)
    this.mainBuffer = await this.loadBuffer(track.audioFiles.main);

    // Load guitar audio (only for mutable tracks)
    if (track.hasMuteableGuitar && track.audioFiles.guitar) {
      this.guitarBuffer = await this.loadBuffer(track.audioFiles.guitar);
    } else {
      this.guitarBuffer = null;
    }

    this.notifyStateChange();
  }

  /**
   * Start playback from current position
   * Creates new source nodes and starts them at the exact same time
   */
  play(): void {
    console.log('[AudioEngine.play] Called', {
      hasContext: !!this.audioContext,
      hasBuffer: !!this.mainBuffer,
      isPlaying: this._isPlaying,
      contextState: this.audioContext?.state,
    });

    if (!this.audioContext || !this.mainBuffer) {
      console.log('[AudioEngine.play] Early return: missing context or buffer');
      return;
    }
    if (this._isPlaying) {
      console.log('[AudioEngine.play] Early return: already playing');
      return;
    }

    // Resume audio context if suspended (iOS Safari)
    if (this.audioContext.state === 'suspended') {
      console.log('[AudioEngine.play] AudioContext suspended, attempting resume...');
      this.audioContext.resume();
      // If still suspended after sync resume attempt, we can't auto-play
      if (this.audioContext.state === 'suspended') {
        console.warn('[AudioEngine.play] AudioContext still suspended, cannot auto-play');
        return;
      }
    }
    console.log('[AudioEngine.play] AudioContext state:', this.audioContext.state);

    // Create new source node for main audio (sources are single-use)
    this.mainSource = this.audioContext.createBufferSource();
    this.mainSource.buffer = this.mainBuffer;
    this.mainSource.playbackRate.value = this._playbackRate;
    this.mainSource.connect(this.mainGainNode!);

    // Handle track end
    this.mainSource.onended = () => {
      console.log('[AudioEngine.onended] Track ended', {
        wasPlaying: this._isPlaying,
        trackId: this.currentTrackId,
      });
      if (this._isPlaying) {
        this._isPlaying = false;
        this.startOffset = 0;
        this.notifyStateChange();
        console.log('[AudioEngine.onended] Calling onTrackEndCallback...');
        this.onTrackEndCallback?.();
      } else {
        console.log('[AudioEngine.onended] Skipping callback - was not playing');
      }
    };

    // Clear old guitar source (prevents reusing already-started nodes)
    this.guitarSource = null;

    // Create guitar source if track has separate guitar
    if (this.guitarBuffer) {
      this.guitarSource = this.audioContext.createBufferSource();
      this.guitarSource.buffer = this.guitarBuffer;
      this.guitarSource.playbackRate.value = this._playbackRate;
      this.guitarSource.connect(this.guitarGainNode!);

      // Apply current mute state
      this.guitarGainNode!.gain.value = this.guitarMuted ? 0 : 1;
    }

    // START BOTH AT EXACT SAME TIME - This is the key to synchronization!
    const startAt = this.audioContext.currentTime;
    try {
      this.mainSource.start(startAt, this.startOffset);
      this.guitarSource?.start(startAt, this.startOffset);
      console.log('[AudioEngine.play] Sources started successfully');
    } catch (e) {
      // Safety net: if start fails (e.g., race condition), don't crash the app
      console.error('[AudioEngine.play] Source start FAILED:', e);
      this._isPlaying = false;
      return;
    }

    // Verify AudioContext is actually running
    if (this.audioContext.state !== 'running') {
      console.warn('[AudioEngine.play] AudioContext not running after start, state:', this.audioContext.state);
      this._isPlaying = false;
      this.notifyStateChange();
      return;
    }

    this._isPlaying = true;
    this.startTime = startAt;
    console.log('[AudioEngine.play] Playback started, _isPlaying =', this._isPlaying);
    this.notifyStateChange();
  }

  /**
   * Pause playback and save current position
   */
  pause(): void {
    if (!this._isPlaying || !this.audioContext) return;

    // Calculate current position before stopping
    const elapsed = (this.audioContext.currentTime - this.startTime) * this._playbackRate;
    this.startOffset = Math.min(this.startOffset + elapsed, this.getDuration());

    // Stop sources (they cannot be restarted, must create new ones)
    try {
      this.mainSource?.stop();
      this.guitarSource?.stop();
    } catch {
      // Ignore errors if already stopped
    }

    this._isPlaying = false;
    this.notifyStateChange();
  }

  /**
   * Stop playback and reset position to beginning
   */
  stop(): void {
    this.pause();
    this.startOffset = 0;
    this.notifyStateChange();
  }

  /**
   * Seek to a specific position in the track
   */
  seek(time: number): void {
    const wasPlaying = this._isPlaying;

    // Stop current playback
    if (wasPlaying) {
      try {
        this.mainSource?.stop();
        this.guitarSource?.stop();
      } catch {
        // Ignore errors if already stopped
      }
      this._isPlaying = false;
    }

    // Update position
    this.startOffset = Math.max(0, Math.min(time, this.getDuration()));

    // Resume playback if was playing
    if (wasPlaying) {
      this.play();
    } else {
      this.notifyStateChange();
    }
  }

  /**
   * Set playback speed (0.8 - 1.2)
   * Applies to both main and guitar sources simultaneously
   */
  setPlaybackRate(rate: number): void {
    // Clamp to valid range
    this._playbackRate = Math.max(0.8, Math.min(1.2, rate));

    // Apply to active sources using setValueAtTime for glitch-free change
    if (this.audioContext && this._isPlaying) {
      const changeTime = this.audioContext.currentTime;

      if (this.mainSource) {
        this.mainSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
      }
      if (this.guitarSource) {
        this.guitarSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
      }
    }

    this.notifyStateChange();
  }

  /**
   * Mute or unmute the guitar track
   * Uses gain node for instant, glitch-free muting
   */
  setGuitarMuted(muted: boolean): void {
    this.guitarMuted = muted;

    if (this.guitarGainNode && this.audioContext) {
      // Use setValueAtTime for immediate, glitch-free change
      this.guitarGainNode.gain.setValueAtTime(
        muted ? 0 : 1,
        this.audioContext.currentTime
      );
    }
  }

  /**
   * Get current playback position in seconds
   */
  getCurrentTime(): number {
    if (!this._isPlaying || !this.audioContext) {
      return this.startOffset;
    }

    const elapsed = (this.audioContext.currentTime - this.startTime) * this._playbackRate;
    return Math.min(this.startOffset + elapsed, this.getDuration());
  }

  /**
   * Get total duration of current track in seconds
   */
  getDuration(): number {
    return this.mainBuffer?.duration ?? 0;
  }

  /**
   * Get current playback rate
   */
  getPlaybackRate(): number {
    return this._playbackRate;
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Check if audio context is initialized
   */
  getIsInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get current track ID
   */
  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  /**
   * Register callback for track end event
   */
  onTrackEnd(callback: () => void): void {
    this.onTrackEndCallback = callback;
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Notify listeners of state change
   */
  private notifyStateChange(): void {
    this.onStateChangeCallback?.();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();

    // Disconnect gain nodes
    this.mainGainNode?.disconnect();
    this.guitarGainNode?.disconnect();

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    // Clear cache
    this.bufferCache.clear();
  }
}

/**
 * React hook for using the audio engine
 * Provides state and methods for audio playback control
 */
export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<AudioEngineHookState>({
    isPlaying: false,
    isInitialized: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    currentTrackId: null,
  });

  // Initialize engine on mount
  useEffect(() => {
    engineRef.current = new AudioEngine();

    // Register state change callback
    engineRef.current.onStateChange(() => {
      if (engineRef.current) {
        setState(prev => ({
          ...prev,
          isPlaying: engineRef.current!.getIsPlaying(),
          isInitialized: engineRef.current!.getIsInitialized(),
          duration: engineRef.current!.getDuration(),
          playbackRate: engineRef.current!.getPlaybackRate(),
          currentTrackId: engineRef.current!.getCurrentTrackId(),
        }));
      }
    });

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Update currentTime during playback using requestAnimationFrame
  useEffect(() => {
    let animationId: number;

    const update = () => {
      if (engineRef.current) {
        const currentTime = engineRef.current.getCurrentTime();
        setState(prev => {
          // Only update if time has changed (avoid unnecessary re-renders)
          if (Math.abs(prev.currentTime - currentTime) > 0.01) {
            return { ...prev, currentTime };
          }
          return prev;
        });
      }
      animationId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Update isLoading state
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading }));
  }, [isLoading]);

  // Initialize audio context (must be called SYNCHRONOUSLY on user interaction)
  const initialize = useCallback(() => {
    engineRef.current?.initialize();
  }, []);

  // Load a track
  const loadTrack = useCallback(async (track: Track) => {
    if (!engineRef.current) return;

    setIsLoading(true);
    try {
      // Initialize if not already
      if (!engineRef.current.getIsInitialized()) {
        await engineRef.current.initialize();
      }
      await engineRef.current.loadTrack(track);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Play
  const play = useCallback(() => {
    engineRef.current?.play();
  }, []);

  // Pause
  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  // Stop
  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  // Seek
  const seek = useCallback((time: number) => {
    engineRef.current?.seek(time);
  }, []);

  // Set playback rate
  const setPlaybackRate = useCallback((rate: number) => {
    engineRef.current?.setPlaybackRate(rate);
  }, []);

  // Set guitar muted
  const setGuitarMuted = useCallback((muted: boolean) => {
    engineRef.current?.setGuitarMuted(muted);
  }, []);

  // Register track end callback
  const onTrackEnd = useCallback((callback: () => void) => {
    engineRef.current?.onTrackEnd(callback);
  }, []);

  return {
    state,
    initialize,
    loadTrack,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setGuitarMuted,
    onTrackEnd,
  };
}
