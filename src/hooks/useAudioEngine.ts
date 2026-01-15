// src/hooks/useAudioEngine.ts
// Web Audio API engine for synchronized dual-track playback
// With comprehensive iOS Safari fixes and debug logging

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Track } from '../types';
import { debugLog } from '../utils/debugLogger';

const TAG = 'AudioEngine';

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
  private startTime = 0;
  private startOffset = 0;
  private _playbackRate = 1.0;
  private guitarMuted = false;
  private currentTrackId: string | null = null;

  // Load versioning
  private loadVersion = 0;
  private loadAbortController: AbortController | null = null;

  // Callbacks
  private onTrackEndCallback: (() => void) | null = null;
  private onStateChangeCallback: (() => void) | null = null;

  // iOS detection
  private isIOS: boolean;
  private userAgent: string;

  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    this.isIOS = /iPad|iPhone|iPod/.test(this.userAgent) ||
      (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    debugLog.info(TAG, 'Constructor called', {
      isIOS: this.isIOS,
      userAgent: this.userAgent.substring(0, 100),
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
    });
  }

  /**
   * Unlock iOS audio via HTML5 audio element
   */
  private unlockiOSAudio(): void {
    debugLog.debug(TAG, 'unlockiOSAudio: Starting');
    const audio = document.createElement('audio');
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAANIAAAAgAADSAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxBkAAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.volume = 0.001;

    audio.play()
      .then(() => {
        debugLog.info(TAG, 'unlockiOSAudio: Silent audio played successfully');
      })
      .catch((err) => {
        debugLog.warn(TAG, 'unlockiOSAudio: Silent audio play failed', err?.message);
      });
  }

  /**
   * Initialize the AudioContext and gain nodes
   */
  initialize(): void {
    debugLog.info(TAG, 'initialize: Called', { alreadyInitialized: this._isInitialized });

    if (this._isInitialized) {
      debugLog.debug(TAG, 'initialize: Already initialized, skipping');
      return;
    }

    // Unlock iOS audio first
    this.unlockiOSAudio();

    // Create AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    debugLog.debug(TAG, 'initialize: Creating AudioContext', {
      hasWebkitAudioContext: !!window.webkitAudioContext,
      hasAudioContext: !!window.AudioContext,
    });

    this.audioContext = new AudioContextClass();

    debugLog.info(TAG, 'initialize: AudioContext created', {
      state: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
      baseLatency: (this.audioContext as any).baseLatency,
      outputLatency: (this.audioContext as any).outputLatency,
    });

    // Resume if needed
    if (isContextNotRunning(this.audioContext)) {
      debugLog.info(TAG, 'initialize: Context not running, calling resume()');
      this.audioContext.resume()
        .then(() => {
          debugLog.info(TAG, 'initialize: resume() resolved', { state: this.audioContext?.state });
        })
        .catch((err) => {
          debugLog.error(TAG, 'initialize: resume() failed', err?.message);
        });
    }

    // Create gain nodes
    this.mainGainNode = this.audioContext.createGain();
    this.guitarGainNode = this.audioContext.createGain();
    this.mainGainNode.connect(this.audioContext.destination);
    this.guitarGainNode.connect(this.audioContext.destination);

    // Setup iOS handling
    this.setupiOSHandling();

    this._isInitialized = true;
    this.notifyStateChange();

    debugLog.info(TAG, 'initialize: Completed', {
      contextState: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
    });
  }

  /**
   * Handle iOS Safari specific audio context issues
   */
  private setupiOSHandling(): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    debugLog.debug(TAG, 'setupiOSHandling: Setting up event listeners');

    // Resume on user interaction
    const resumeOnInteraction = (event: Event) => {
      if (isContextNotRunning(ctx)) {
        debugLog.info(TAG, `setupiOSHandling: User interaction (${event.type}), resuming from ${ctx.state}`);
        ctx.resume()
          .then(() => {
            debugLog.info(TAG, 'setupiOSHandling: resume() after interaction resolved', { state: ctx.state });
          })
          .catch((err) => {
            debugLog.error(TAG, 'setupiOSHandling: resume() after interaction failed', err?.message);
          });
      }
    };

    ['touchstart', 'touchend', 'mousedown', 'click'].forEach(event => {
      document.addEventListener(event, resumeOnInteraction, { passive: true });
    });

    // Page visibility handler
    document.addEventListener('visibilitychange', () => {
      debugLog.info(TAG, 'setupiOSHandling: visibilitychange', {
        visibilityState: document.visibilityState,
        contextState: ctx.state,
      });
      if (document.visibilityState === 'visible' && isContextNotRunning(ctx)) {
        debugLog.info(TAG, 'setupiOSHandling: Page visible, resuming');
        ctx.resume().catch((err) => {
          debugLog.error(TAG, 'setupiOSHandling: resume() on visible failed', err?.message);
        });
      }
    });

    // State change handler
    ctx.onstatechange = () => {
      debugLog.info(TAG, 'setupiOSHandling: AudioContext state changed', { newState: ctx.state });
    };
  }

  /**
   * Ensure AudioContext is running
   */
  private async ensureContextRunning(): Promise<boolean> {
    debugLog.info(TAG, 'ensureContextRunning: Called', {
      hasContext: !!this.audioContext,
      state: this.audioContext?.state,
    });

    if (!this.audioContext) {
      debugLog.error(TAG, 'ensureContextRunning: No AudioContext');
      return false;
    }

    if (this.audioContext.state === 'running') {
      debugLog.debug(TAG, 'ensureContextRunning: Already running');
      return true;
    }

    if (isContextNotRunning(this.audioContext)) {
      debugLog.info(TAG, 'ensureContextRunning: Context not running, calling resume()', {
        currentState: this.audioContext.state,
      });

      const startTime = Date.now();

      try {
        await this.audioContext.resume();
        const elapsed = Date.now() - startTime;
        debugLog.info(TAG, 'ensureContextRunning: resume() completed', {
          elapsed: `${elapsed}ms`,
          newState: this.audioContext.state,
        });

        // Small delay for iOS
        if (this.isIOS) {
          debugLog.debug(TAG, 'ensureContextRunning: iOS delay (10ms)');
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        debugLog.error(TAG, 'ensureContextRunning: resume() threw', (error as Error)?.message);
        return false;
      }
    }

    const currentState = this.audioContext.state as string;
    const isRunning = currentState === 'running';
    debugLog.info(TAG, 'ensureContextRunning: Final check', { currentState, isRunning });
    return isRunning;
  }

  /**
   * Load audio buffer from URL
   */
  private async loadBuffer(url: string, signal?: AbortSignal): Promise<AudioBuffer> {
    const shortUrl = url.split('/').pop() || url;
    debugLog.debug(TAG, 'loadBuffer: Starting', { url: shortUrl });

    if (this.bufferCache.has(url)) {
      debugLog.debug(TAG, 'loadBuffer: Cache hit', { url: shortUrl });
      return this.bufferCache.get(url)!;
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const startTime = Date.now();
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fetchTime = Date.now() - startTime;
    debugLog.debug(TAG, 'loadBuffer: Fetched', { url: shortUrl, fetchTime: `${fetchTime}ms`, bytes: arrayBuffer.byteLength });

    const decodeStart = Date.now();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    const decodeTime = Date.now() - decodeStart;

    debugLog.info(TAG, 'loadBuffer: Decoded', {
      url: shortUrl,
      fetchTime: `${fetchTime}ms`,
      decodeTime: `${decodeTime}ms`,
      duration: `${audioBuffer.duration.toFixed(2)}s`,
      sampleRate: audioBuffer.sampleRate,
    });

    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  /**
   * Load a track
   */
  async loadTrack(track: Track): Promise<void> {
    const thisLoadVersion = ++this.loadVersion;
    debugLog.info(TAG, 'loadTrack: Called', {
      trackId: track.id,
      trackName: track.name,
      loadVersion: thisLoadVersion,
      wasPlaying: this._isPlaying,
    });

    if (!this.audioContext) {
      debugLog.error(TAG, 'loadTrack: AudioContext not initialized');
      throw new Error('AudioContext not initialized');
    }

    if (this.loadAbortController) {
      debugLog.debug(TAG, 'loadTrack: Aborting previous load');
      this.loadAbortController.abort();
    }
    this.loadAbortController = new AbortController();
    const signal = this.loadAbortController.signal;

    if (this._isPlaying) {
      debugLog.debug(TAG, 'loadTrack: Stopping current playback');
      this.stop();
    }

    this.startOffset = 0;
    this.currentTrackId = track.id;

    try {
      const startTime = Date.now();
      let mainBuffer: AudioBuffer;
      let guitarBuffer: AudioBuffer | null = null;

      if (track.hasMuteableGuitar && track.audioFiles.guitar) {
        debugLog.debug(TAG, 'loadTrack: Loading dual-track (parallel)');
        const [main, guitar] = await Promise.all([
          this.loadBuffer(track.audioFiles.main, signal),
          this.loadBuffer(track.audioFiles.guitar, signal),
        ]);
        mainBuffer = main;
        guitarBuffer = guitar;
      } else {
        debugLog.debug(TAG, 'loadTrack: Loading single track');
        mainBuffer = await this.loadBuffer(track.audioFiles.main, signal);
      }

      if (thisLoadVersion !== this.loadVersion) {
        debugLog.warn(TAG, 'loadTrack: Stale load, ignoring', { thisVersion: thisLoadVersion, currentVersion: this.loadVersion });
        return;
      }

      this.mainBuffer = mainBuffer;
      this.guitarBuffer = guitarBuffer;

      const totalTime = Date.now() - startTime;
      debugLog.info(TAG, 'loadTrack: Completed', {
        trackId: track.id,
        totalTime: `${totalTime}ms`,
        duration: `${mainBuffer.duration.toFixed(2)}s`,
      });

      this.notifyStateChange();
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        debugLog.info(TAG, 'loadTrack: Aborted');
        return;
      }
      debugLog.error(TAG, 'loadTrack: Failed', (error as Error)?.message);
      throw error;
    }
  }

  /**
   * Prefetch a track
   */
  async prefetchTrack(track: Track): Promise<void> {
    debugLog.debug(TAG, 'prefetchTrack: Called', { trackId: track.id });
    if (!this.audioContext) return;

    const mainCached = this.bufferCache.has(track.audioFiles.main);
    const guitarCached = !track.audioFiles.guitar || this.bufferCache.has(track.audioFiles.guitar);

    if (mainCached && guitarCached) {
      debugLog.debug(TAG, 'prefetchTrack: Already cached');
      return;
    }

    const promises: Promise<AudioBuffer>[] = [];
    if (!mainCached) promises.push(this.loadBuffer(track.audioFiles.main));
    if (track.hasMuteableGuitar && track.audioFiles.guitar && !guitarCached) {
      promises.push(this.loadBuffer(track.audioFiles.guitar));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      debugLog.debug(TAG, 'prefetchTrack: Completed', { trackId: track.id });
    }
  }

  /**
   * Internal playback start
   */
  private startPlayback(): boolean {
    debugLog.info(TAG, 'startPlayback: Called', {
      hasContext: !!this.audioContext,
      hasBuffer: !!this.mainBuffer,
      contextState: this.audioContext?.state,
      startOffset: this.startOffset,
    });

    if (!this.audioContext || !this.mainBuffer || !this.mainGainNode) {
      debugLog.error(TAG, 'startPlayback: Missing required objects');
      return false;
    }

    // Double-check context state
    if (this.audioContext.state !== 'running') {
      debugLog.error(TAG, 'startPlayback: Context not running!', { state: this.audioContext.state });
      return false;
    }

    // Create main source
    this.mainSource = this.audioContext.createBufferSource();
    this.mainSource.buffer = this.mainBuffer;
    this.mainSource.playbackRate.value = this._playbackRate;
    this.mainSource.connect(this.mainGainNode);

    // Setup onended
    this.mainSource.onended = () => {
      debugLog.info(TAG, 'onended: Fired', {
        wasPlaying: this._isPlaying,
        trackId: this.currentTrackId,
      });
      if (this._isPlaying) {
        this._isPlaying = false;
        this.startOffset = 0;
        this.notifyStateChange();
        debugLog.info(TAG, 'onended: Calling onTrackEndCallback');
        this.onTrackEndCallback?.();
      } else {
        debugLog.debug(TAG, 'onended: Skipped (was not playing)');
      }
    };

    // Create guitar source if needed
    this.guitarSource = null;
    if (this.guitarBuffer && this.guitarGainNode) {
      this.guitarSource = this.audioContext.createBufferSource();
      this.guitarSource.buffer = this.guitarBuffer;
      this.guitarSource.playbackRate.value = this._playbackRate;
      this.guitarSource.connect(this.guitarGainNode);
      this.guitarGainNode.gain.value = this.guitarMuted ? 0 : 1;
    }

    // Start both at same time
    const startAt = this.audioContext.currentTime;
    try {
      this.mainSource.start(startAt, this.startOffset);
      this.guitarSource?.start(startAt, this.startOffset);
      debugLog.info(TAG, 'startPlayback: Sources started', {
        startAt,
        offset: this.startOffset,
        hasGuitar: !!this.guitarSource,
      });
    } catch (e) {
      debugLog.error(TAG, 'startPlayback: start() failed', (e as Error)?.message);
      return false;
    }

    this._isPlaying = true;
    this.startTime = startAt;
    this.notifyStateChange();

    debugLog.info(TAG, 'startPlayback: SUCCESS', {
      isPlaying: this._isPlaying,
      contextState: this.audioContext.state,
    });
    return true;
  }

  /**
   * Synchronous play (for user gestures)
   */
  play(): void {
    debugLog.info(TAG, 'play: Called (sync)', {
      hasContext: !!this.audioContext,
      hasBuffer: !!this.mainBuffer,
      isPlaying: this._isPlaying,
      contextState: this.audioContext?.state,
    });

    if (!this.audioContext || !this.mainBuffer) {
      debugLog.warn(TAG, 'play: Missing context or buffer');
      return;
    }
    if (this._isPlaying) {
      debugLog.debug(TAG, 'play: Already playing');
      return;
    }

    if (isContextNotRunning(this.audioContext)) {
      debugLog.info(TAG, 'play: Context not running, calling resume()');
      this.audioContext.resume()
        .then(() => debugLog.info(TAG, 'play: resume() resolved', { state: this.audioContext?.state }))
        .catch((err) => debugLog.error(TAG, 'play: resume() failed', err?.message));
    }

    if (this.audioContext.state === 'running') {
      debugLog.info(TAG, 'play: Context running, starting playback');
      this.startPlayback();
    } else {
      debugLog.warn(TAG, 'play: Context not running, scheduling retry', { state: this.audioContext.state });
      setTimeout(() => {
        debugLog.info(TAG, 'play: Retry check', {
          isPlaying: this._isPlaying,
          contextState: this.audioContext?.state,
        });
        if (!this._isPlaying && this.audioContext?.state === 'running') {
          debugLog.info(TAG, 'play: Retry - starting playback');
          this.startPlayback();
        } else {
          debugLog.warn(TAG, 'play: Retry - conditions not met');
        }
      }, 50);
    }
  }

  /**
   * Async play (for auto-advance)
   */
  async playAsync(): Promise<boolean> {
    debugLog.info(TAG, 'playAsync: Called', {
      hasContext: !!this.audioContext,
      hasBuffer: !!this.mainBuffer,
      isPlaying: this._isPlaying,
      contextState: this.audioContext?.state,
    });

    if (!this.audioContext || !this.mainBuffer) {
      debugLog.warn(TAG, 'playAsync: Missing context or buffer');
      return false;
    }
    if (this._isPlaying) {
      debugLog.debug(TAG, 'playAsync: Already playing');
      return true;
    }

    debugLog.info(TAG, 'playAsync: Ensuring context running...');
    const isReady = await this.ensureContextRunning();
    debugLog.info(TAG, 'playAsync: ensureContextRunning result', { isReady });

    if (!isReady) {
      debugLog.error(TAG, 'playAsync: Context not ready');
      return false;
    }

    if (this.audioContext.state !== 'running') {
      debugLog.error(TAG, 'playAsync: Context still not running', { state: this.audioContext.state });
      return false;
    }

    debugLog.info(TAG, 'playAsync: Starting playback');
    const success = this.startPlayback();
    debugLog.info(TAG, 'playAsync: Result', { success });
    return success;
  }

  /**
   * Pause playback
   */
  pause(): void {
    debugLog.info(TAG, 'pause: Called', { isPlaying: this._isPlaying });

    if (!this._isPlaying || !this.audioContext) {
      debugLog.debug(TAG, 'pause: Not playing or no context');
      return;
    }

    const elapsed = (this.audioContext.currentTime - this.startTime) * this._playbackRate;
    this.startOffset = Math.min(this.startOffset + elapsed, this.getDuration());

    this._isPlaying = false;

    if (this.mainSource) this.mainSource.onended = null;
    if (this.guitarSource) this.guitarSource.onended = null;

    try {
      this.mainSource?.stop();
      this.guitarSource?.stop();
    } catch {
      // Ignore
    }

    debugLog.info(TAG, 'pause: Completed', { offset: this.startOffset });
    this.notifyStateChange();
  }

  /**
   * Stop playback
   */
  stop(): void {
    debugLog.info(TAG, 'stop: Called');
    this.pause();
    this.startOffset = 0;
    this.notifyStateChange();
  }

  /**
   * Seek to position
   */
  async seek(time: number): Promise<void> {
    debugLog.info(TAG, 'seek: Called', { time, wasPlaying: this._isPlaying });
    const wasPlaying = this._isPlaying;

    if (wasPlaying) {
      this._isPlaying = false;
      if (this.mainSource) this.mainSource.onended = null;
      if (this.guitarSource) this.guitarSource.onended = null;
      try {
        this.mainSource?.stop();
        this.guitarSource?.stop();
      } catch {
        // Ignore
      }
    }

    this.startOffset = Math.max(0, Math.min(time, this.getDuration()));

    if (wasPlaying) {
      await this.playAsync();
    } else {
      this.notifyStateChange();
    }
  }

  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.8, Math.min(1.2, rate));
    debugLog.debug(TAG, 'setPlaybackRate', { rate: this._playbackRate });

    if (this.audioContext && this._isPlaying) {
      const changeTime = this.audioContext.currentTime;
      if (this.mainSource) this.mainSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
      if (this.guitarSource) this.guitarSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
    }

    this.notifyStateChange();
  }

  setGuitarMuted(muted: boolean): void {
    this.guitarMuted = muted;
    debugLog.debug(TAG, 'setGuitarMuted', { muted });

    if (this.guitarGainNode && this.audioContext) {
      this.guitarGainNode.gain.setValueAtTime(muted ? 0 : 1, this.audioContext.currentTime);
    }
  }

  getCurrentTime(): number {
    if (!this._isPlaying || !this.audioContext) return this.startOffset;
    const elapsed = (this.audioContext.currentTime - this.startTime) * this._playbackRate;
    return Math.min(this.startOffset + elapsed, this.getDuration());
  }

  getDuration(): number {
    return this.mainBuffer?.duration ?? 0;
  }

  getPlaybackRate(): number {
    return this._playbackRate;
  }

  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  getIsInitialized(): boolean {
    return this._isInitialized;
  }

  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  onTrackEnd(callback: () => void): void {
    debugLog.debug(TAG, 'onTrackEnd: Callback registered');
    this.onTrackEndCallback = callback;
  }

  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback;
  }

  private notifyStateChange(): void {
    this.onStateChangeCallback?.();
  }

  destroy(): void {
    debugLog.info(TAG, 'destroy: Called');
    if (this.loadAbortController) {
      this.loadAbortController.abort();
      this.loadAbortController = null;
    }

    this.stop();
    this.mainGainNode?.disconnect();
    this.guitarGainNode?.disconnect();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.bufferCache.clear();
  }
}

/**
 * React hook for using the audio engine
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

  useEffect(() => {
    debugLog.info('Hook', 'useAudioEngine: Mounting');
    engineRef.current = new AudioEngine();

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
      debugLog.info('Hook', 'useAudioEngine: Unmounting');
      engineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    let animationId: number;
    const update = () => {
      if (engineRef.current) {
        const currentTime = engineRef.current.getCurrentTime();
        setState(prev => {
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

  useEffect(() => {
    setState(prev => ({ ...prev, isLoading }));
  }, [isLoading]);

  const initialize = useCallback(() => {
    debugLog.info('Hook', 'initialize called');
    engineRef.current?.initialize();
  }, []);

  const loadTrack = useCallback(async (track: Track) => {
    if (!engineRef.current) return;
    debugLog.info('Hook', 'loadTrack called', { trackId: track.id });
    setIsLoading(true);
    try {
      if (!engineRef.current.getIsInitialized()) {
        engineRef.current.initialize();
      }
      await engineRef.current.loadTrack(track);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const prefetchTrack = useCallback(async (track: Track) => {
    if (!engineRef.current) return;
    if (!engineRef.current.getIsInitialized()) {
      engineRef.current.initialize();
    }
    await engineRef.current.prefetchTrack(track);
  }, []);

  const play = useCallback(() => {
    debugLog.info('Hook', 'play called (sync)');
    engineRef.current?.play();
  }, []);

  const playAsync = useCallback(async (): Promise<boolean> => {
    debugLog.info('Hook', 'playAsync called');
    if (!engineRef.current) return false;
    return engineRef.current.playAsync();
  }, []);

  const pause = useCallback(() => {
    debugLog.info('Hook', 'pause called');
    engineRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    debugLog.info('Hook', 'stop called');
    engineRef.current?.stop();
  }, []);

  const seek = useCallback(async (time: number) => {
    await engineRef.current?.seek(time);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    engineRef.current?.setPlaybackRate(rate);
  }, []);

  const setGuitarMuted = useCallback((muted: boolean) => {
    engineRef.current?.setGuitarMuted(muted);
  }, []);

  const onTrackEnd = useCallback((callback: () => void) => {
    engineRef.current?.onTrackEnd(callback);
  }, []);

  return {
    state,
    initialize,
    loadTrack,
    prefetchTrack,
    play,
    playAsync,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setGuitarMuted,
    onTrackEnd,
  };
}
