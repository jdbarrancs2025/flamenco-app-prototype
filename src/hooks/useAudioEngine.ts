// src/hooks/useAudioEngine.ts
// Web Audio API engine for synchronized dual-track playback
// With comprehensive iOS Safari fixes

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
 * Helper to check if AudioContext is in a non-running state
 * iOS Safari has a non-standard 'interrupted' state
 */
function isContextNotRunning(ctx: AudioContext): boolean {
  const state = ctx.state as string;
  return state === 'suspended' || state === 'interrupted';
}

/**
 * AudioEngine class - handles all Web Audio API operations
 *
 * Key concepts:
 * - AudioContext: The main audio processing graph
 * - GainNode: Controls volume (used for muting guitar)
 * - AudioBufferSourceNode: Plays audio buffers (single-use, must recreate for each play)
 * - AudioBuffer: Decoded audio data (cached for reuse)
 *
 * iOS Safari quirks handled:
 * - AudioContext starts in 'suspended' state and needs user gesture to resume
 * - resume() is async - must await the Promise before checking state
 * - 'interrupted' state (non-standard) occurs on background/foreground transitions
 * - start() is a no-op if context is not 'running'
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

  // Load versioning (to ignore stale async completions)
  private loadVersion = 0;
  private loadAbortController: AbortController | null = null;

  // Callbacks
  private onTrackEndCallback: (() => void) | null = null;
  private onStateChangeCallback: (() => void) | null = null;

  // iOS detection
  private isIOS: boolean;

  constructor() {
    // Detect iOS (includes iPad, iPhone, iPod, and iOS browsers like Chrome on iOS)
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

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
    // NOTE: Do NOT force sampleRate - let iOS use its native rate to avoid resampling delays
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Resume AudioContext synchronously (must stay in user gesture context)
    // On iOS, this starts the unlock process but may not complete immediately
    if (isContextNotRunning(this.audioContext)) {
      this.audioContext.resume().catch(() => {});
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

    console.log('[AudioEngine.initialize] Completed', {
      isIOS: this.isIOS,
      contextState: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
    });
  }

  /**
   * Handle iOS Safari specific audio context issues
   * - Resume suspended/interrupted context on user interaction
   * - Handle page visibility changes for background/foreground transitions
   */
  private setupiOSHandling(): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Resume on any user interaction (iOS Safari suspends by default)
    // Using { once: false } because iOS can re-suspend the context
    const resumeOnInteraction = () => {
      if (isContextNotRunning(ctx)) {
        console.log('[AudioEngine] User interaction detected, resuming from:', ctx.state);
        ctx.resume().catch(() => {});
      }
    };

    // Add listeners for common user interactions
    // These help re-unlock the context if iOS suspends it
    ['touchstart', 'touchend', 'mousedown', 'click'].forEach(event => {
      document.addEventListener(event, resumeOnInteraction, { passive: true });
    });

    // Handle page visibility changes (iOS background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isContextNotRunning(ctx)) {
        console.log('[AudioEngine] Page visible, resuming AudioContext from:', ctx.state);
        ctx.resume().catch(() => {});
      }
    });

    // Log state changes for debugging (but don't auto-resume here - it causes race conditions)
    ctx.onstatechange = () => {
      console.log('[AudioEngine] AudioContext state changed to:', ctx.state);
    };
  }

  /**
   * Ensure AudioContext is in 'running' state
   * Returns true if context is ready for playback, false otherwise
   *
   * This is the KEY FIX for iOS: properly await the resume() Promise
   */
  private async ensureContextRunning(): Promise<boolean> {
    if (!this.audioContext) return false;

    // Already running - good to go
    if (this.audioContext.state === 'running') {
      return true;
    }

    // Context is suspended or interrupted - try to resume
    if (isContextNotRunning(this.audioContext)) {
      console.log('[AudioEngine.ensureContextRunning] Context not running, attempting resume...', {
        currentState: this.audioContext.state,
      });

      try {
        // CRITICAL: Actually await the resume() Promise!
        await this.audioContext.resume();

        // Small delay for iOS to stabilize (helps with edge cases)
        if (this.isIOS) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log('[AudioEngine.ensureContextRunning] After resume:', {
          newState: this.audioContext.state,
        });
      } catch (error) {
        console.error('[AudioEngine.ensureContextRunning] Resume failed:', error);
        return false;
      }
    }

    // Final check - cast to string to handle all possible states including 'running'
    const currentState = this.audioContext.state as string;
    const isRunning = currentState === 'running';
    if (!isRunning) {
      console.warn('[AudioEngine.ensureContextRunning] Context still not running:', currentState);
    }
    return isRunning;
  }

  /**
   * Load and decode an audio file into a buffer
   * Uses caching to avoid re-fetching the same file
   * Supports AbortController for cancellation
   */
  private async loadBuffer(url: string, signal?: AbortSignal): Promise<AudioBuffer> {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Fetch the audio file with abort signal
    const response = await fetch(url, { signal });
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
   * Uses versioning and AbortController to handle race conditions
   */
  async loadTrack(track: Track): Promise<void> {
    // Increment version to invalidate any in-flight loads
    const thisLoadVersion = ++this.loadVersion;

    console.log('[AudioEngine.loadTrack] Called', {
      trackId: track.id,
      wasPlaying: this._isPlaying,
      currentTrackId: this.currentTrackId,
      loadVersion: thisLoadVersion,
    });

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Abort any pending fetch requests from previous loads
    if (this.loadAbortController) {
      this.loadAbortController.abort();
    }
    this.loadAbortController = new AbortController();
    const signal = this.loadAbortController.signal;

    // Stop any current playback (sets _isPlaying = false FIRST to prevent onended callback)
    if (this._isPlaying) {
      this.stop();
    }

    // Reset position for new track
    this.startOffset = 0;
    this.currentTrackId = track.id;

    try {
      // Load audio files - parallel for dual-track files, single for others
      let mainBuffer: AudioBuffer;
      let guitarBuffer: AudioBuffer | null = null;

      if (track.hasMuteableGuitar && track.audioFiles.guitar) {
        // Parallel loading for dual-track files (~50% faster)
        const [main, guitar] = await Promise.all([
          this.loadBuffer(track.audioFiles.main, signal),
          this.loadBuffer(track.audioFiles.guitar, signal),
        ]);
        mainBuffer = main;
        guitarBuffer = guitar;
      } else {
        // Single file loading
        mainBuffer = await this.loadBuffer(track.audioFiles.main, signal);
      }

      // Check if this load is still current (another loadTrack may have been called)
      if (thisLoadVersion !== this.loadVersion) {
        console.log('[AudioEngine.loadTrack] Stale load ignored', {
          trackId: track.id,
          thisVersion: thisLoadVersion,
          currentVersion: this.loadVersion,
        });
        return;
      }

      // Apply the loaded buffers
      this.mainBuffer = mainBuffer;
      this.guitarBuffer = guitarBuffer;
      this.notifyStateChange();

    } catch (error) {
      // Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[AudioEngine.loadTrack] Load aborted - new track selected', {
          trackId: track.id,
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Prefetch a track's audio files into cache without setting as current
   * Used for preloading upcoming tracks during playback
   */
  async prefetchTrack(track: Track): Promise<void> {
    if (!this.audioContext) return;

    // Skip if already cached
    const mainCached = this.bufferCache.has(track.audioFiles.main);
    const guitarCached = !track.audioFiles.guitar || this.bufferCache.has(track.audioFiles.guitar);

    if (mainCached && guitarCached) return;

    const promises: Promise<AudioBuffer>[] = [];

    if (!mainCached) {
      promises.push(this.loadBuffer(track.audioFiles.main));
    }

    if (track.hasMuteableGuitar && track.audioFiles.guitar && !guitarCached) {
      promises.push(this.loadBuffer(track.audioFiles.guitar));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Internal method to start audio sources
   * Assumes context is running and buffers are ready
   */
  private startPlayback(): boolean {
    if (!this.audioContext || !this.mainBuffer || !this.mainGainNode) {
      console.error('[AudioEngine.startPlayback] Missing required objects');
      return false;
    }

    // Create new source node for main audio (sources are single-use)
    this.mainSource = this.audioContext.createBufferSource();
    this.mainSource.buffer = this.mainBuffer;
    this.mainSource.playbackRate.value = this._playbackRate;
    this.mainSource.connect(this.mainGainNode);

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
    if (this.guitarBuffer && this.guitarGainNode) {
      this.guitarSource = this.audioContext.createBufferSource();
      this.guitarSource.buffer = this.guitarBuffer;
      this.guitarSource.playbackRate.value = this._playbackRate;
      this.guitarSource.connect(this.guitarGainNode);

      // Apply current mute state
      this.guitarGainNode.gain.value = this.guitarMuted ? 0 : 1;
    }

    // START BOTH AT EXACT SAME TIME - This is the key to synchronization!
    const startAt = this.audioContext.currentTime;
    try {
      this.mainSource.start(startAt, this.startOffset);
      this.guitarSource?.start(startAt, this.startOffset);
      console.log('[AudioEngine.startPlayback] Sources started at offset:', this.startOffset);
    } catch (e) {
      console.error('[AudioEngine.startPlayback] Source start FAILED:', e);
      return false;
    }

    this._isPlaying = true;
    this.startTime = startAt;
    this.notifyStateChange();
    return true;
  }

  /**
   * Start playback from current position (SYNCHRONOUS version)
   * Use this when called directly from a user gesture (click/tap handler)
   *
   * For auto-advance (non-user-gesture contexts), use playAsync() instead
   */
  play(): void {
    console.log('[AudioEngine.play] Called (sync)', {
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

    // For synchronous play (user gesture), try to resume synchronously
    // This works because we're in a user gesture context
    if (isContextNotRunning(this.audioContext)) {
      console.log('[AudioEngine.play] Context not running, calling resume()...');
      this.audioContext.resume().catch(() => {});
    }

    // Start playback immediately
    // On desktop/Android, context is usually 'running' by now
    // On iOS, if context isn't ready yet, the sources will be created but may not produce sound
    // That's okay - the async version handles iOS better for auto-advance scenarios
    if (this.audioContext.state === 'running') {
      this.startPlayback();
    } else {
      // iOS Safari: Context might not be running yet
      // Schedule a retry after a short delay
      console.log('[AudioEngine.play] Context not running yet, scheduling retry...');
      setTimeout(() => {
        if (!this._isPlaying && this.audioContext?.state === 'running') {
          console.log('[AudioEngine.play] Retry: context now running');
          this.startPlayback();
        }
      }, 50);
    }
  }

  /**
   * Start playback from current position (ASYNC version)
   * Use this for auto-advance and non-user-gesture contexts
   *
   * This properly awaits resume() and handles iOS edge cases
   */
  async playAsync(): Promise<boolean> {
    console.log('[AudioEngine.playAsync] Called', {
      hasContext: !!this.audioContext,
      hasBuffer: !!this.mainBuffer,
      isPlaying: this._isPlaying,
      contextState: this.audioContext?.state,
    });

    if (!this.audioContext || !this.mainBuffer) {
      console.log('[AudioEngine.playAsync] Early return: missing context or buffer');
      return false;
    }
    if (this._isPlaying) {
      console.log('[AudioEngine.playAsync] Early return: already playing');
      return true;
    }

    // Ensure context is running (with proper async handling)
    const isReady = await this.ensureContextRunning();
    if (!isReady) {
      console.warn('[AudioEngine.playAsync] Context not ready, cannot play');
      return false;
    }

    // Double-check state one more time
    if (this.audioContext.state !== 'running') {
      console.warn('[AudioEngine.playAsync] Context still not running after ensureContextRunning');
      return false;
    }

    // Start playback
    const success = this.startPlayback();
    console.log('[AudioEngine.playAsync] Playback started:', success);
    return success;
  }

  /**
   * Pause playback and save current position
   * Sets _isPlaying = false BEFORE stopping to prevent onended callback from firing
   */
  pause(): void {
    console.log('[AudioEngine.pause] Called', {
      isPlaying: this._isPlaying,
      hasContext: !!this.audioContext,
    });

    if (!this._isPlaying || !this.audioContext) {
      console.log('[AudioEngine.pause] Early return: not playing or no context');
      return;
    }

    // Calculate current position before stopping
    const elapsed = (this.audioContext.currentTime - this.startTime) * this._playbackRate;
    this.startOffset = Math.min(this.startOffset + elapsed, this.getDuration());

    // CRITICAL: Set _isPlaying = false BEFORE stopping sources
    // This prevents the onended callback from triggering auto-advance
    this._isPlaying = false;

    // Clear onended handlers to prevent spurious callbacks during intentional stop
    if (this.mainSource) {
      this.mainSource.onended = null;
    }
    if (this.guitarSource) {
      this.guitarSource.onended = null;
    }

    // Stop sources (they cannot be restarted, must create new ones)
    try {
      this.mainSource?.stop();
      this.guitarSource?.stop();
    } catch {
      // Ignore errors if already stopped
    }

    console.log('[AudioEngine.pause] Playback paused at:', this.startOffset);
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
  async seek(time: number): Promise<void> {
    const wasPlaying = this._isPlaying;

    // Stop current playback
    if (wasPlaying) {
      // CRITICAL: Set _isPlaying = false BEFORE stopping
      this._isPlaying = false;

      // Clear onended handlers to prevent spurious callbacks
      if (this.mainSource) {
        this.mainSource.onended = null;
      }
      if (this.guitarSource) {
        this.guitarSource.onended = null;
      }

      try {
        this.mainSource?.stop();
        this.guitarSource?.stop();
      } catch {
        // Ignore errors if already stopped
      }
    }

    // Update position
    this.startOffset = Math.max(0, Math.min(time, this.getDuration()));

    // Resume playback if was playing
    if (wasPlaying) {
      await this.playAsync();
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
    // Abort any pending loads
    if (this.loadAbortController) {
      this.loadAbortController.abort();
      this.loadAbortController = null;
    }

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
        engineRef.current.initialize();
      }
      await engineRef.current.loadTrack(track);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Prefetch a track (for preloading upcoming tracks)
  const prefetchTrack = useCallback(async (track: Track) => {
    if (!engineRef.current) return;
    // Initialize if not already (needed for AudioContext)
    if (!engineRef.current.getIsInitialized()) {
      engineRef.current.initialize();
    }
    await engineRef.current.prefetchTrack(track);
  }, []);

  // Play (synchronous - for user gestures)
  const play = useCallback(() => {
    engineRef.current?.play();
  }, []);

  // Play (async - for auto-advance and programmatic playback)
  const playAsync = useCallback(async (): Promise<boolean> => {
    if (!engineRef.current) return false;
    return engineRef.current.playAsync();
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
  const seek = useCallback(async (time: number) => {
    await engineRef.current?.seek(time);
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
    prefetchTrack,
    play,
    playAsync,  // NEW: async version for auto-advance
    pause,
    stop,
    seek,
    setPlaybackRate,
    setGuitarMuted,
    onTrackEnd,
  };
}
