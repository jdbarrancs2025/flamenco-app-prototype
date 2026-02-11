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

  constructor() {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
      (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Unlock iOS audio via HTML5 audio element
   */
  private unlockiOSAudio(): void {
    const audio = document.createElement('audio');
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAANIAAAAgAADSAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxBkAAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.volume = 0.001;

    audio.play()
      .catch((err) => {
        console.warn('[AudioEngine] unlockiOSAudio: Silent audio play failed', err?.message);
      });
  }

  /**
   * Initialize the AudioContext and gain nodes
   */
  initialize(): void {
    if (this._isInitialized) return;

    // Unlock iOS audio first
    this.unlockiOSAudio();

    // Create AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Resume if needed
    if (isContextNotRunning(this.audioContext)) {
      this.audioContext.resume()
        .catch((err) => {
          console.error('[AudioEngine] initialize: resume() failed', err?.message);
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
  }

  /**
   * Handle iOS Safari specific audio context issues
   */
  private setupiOSHandling(): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Resume on user interaction
    const resumeOnInteraction = () => {
      if (isContextNotRunning(ctx)) {
        ctx.resume()
          .catch((err) => {
            console.error('[AudioEngine] setupiOSHandling: resume() after interaction failed', err?.message);
          });
      }
    };

    ['touchstart', 'touchend', 'mousedown', 'click'].forEach(event => {
      document.addEventListener(event, resumeOnInteraction, { passive: true });
    });

    // Page visibility handler
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isContextNotRunning(ctx)) {
        ctx.resume().catch((err) => {
          console.error('[AudioEngine] setupiOSHandling: resume() on visible failed', err?.message);
        });
      }
    });
  }

  /**
   * Ensure AudioContext is running
   */
  private async ensureContextRunning(): Promise<boolean> {
    if (!this.audioContext) {
      console.error('[AudioEngine] ensureContextRunning: No AudioContext');
      return false;
    }

    if (this.audioContext.state === 'running') {
      return true;
    }

    if (isContextNotRunning(this.audioContext)) {
      try {
        await this.audioContext.resume();

        // Small delay for iOS
        if (this.isIOS) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error('[AudioEngine] ensureContextRunning: resume() threw', (error as Error)?.message);
        return false;
      }
    }

    return (this.audioContext.state as string) === 'running';
  }

  /**
   * Load audio buffer from URL
   */
  private async loadBuffer(url: string, signal?: AbortSignal): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  /**
   * Load a track
   */
  async loadTrack(track: Track): Promise<void> {
    const thisLoadVersion = ++this.loadVersion;

    if (!this.audioContext) {
      console.error('[AudioEngine] loadTrack: AudioContext not initialized');
      throw new Error('AudioContext not initialized');
    }

    if (this.loadAbortController) {
      this.loadAbortController.abort();
    }
    this.loadAbortController = new AbortController();
    const signal = this.loadAbortController.signal;

    if (this._isPlaying) {
      this.stop();
    }

    this.startOffset = 0;
    this.currentTrackId = track.id;

    try {
      let mainBuffer: AudioBuffer;
      let guitarBuffer: AudioBuffer | null = null;

      if (track.hasMuteableGuitar && track.audioFiles.guitar) {
        const [main, guitar] = await Promise.all([
          this.loadBuffer(track.audioFiles.main, signal),
          this.loadBuffer(track.audioFiles.guitar, signal),
        ]);
        mainBuffer = main;
        guitarBuffer = guitar;
      } else {
        mainBuffer = await this.loadBuffer(track.audioFiles.main, signal);
      }

      if (thisLoadVersion !== this.loadVersion) {
        console.warn('[AudioEngine] loadTrack: Stale load, ignoring', { thisVersion: thisLoadVersion, currentVersion: this.loadVersion });
        return;
      }

      this.mainBuffer = mainBuffer;
      this.guitarBuffer = guitarBuffer;

      this.notifyStateChange();
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }
      console.error('[AudioEngine] loadTrack: Failed', (error as Error)?.message);
      throw error;
    }
  }

  /**
   * Prefetch a track
   */
  async prefetchTrack(track: Track): Promise<void> {
    if (!this.audioContext) return;

    const mainCached = this.bufferCache.has(track.audioFiles.main);
    const guitarCached = !track.audioFiles.guitar || this.bufferCache.has(track.audioFiles.guitar);

    if (mainCached && guitarCached) return;

    const promises: Promise<AudioBuffer>[] = [];
    if (!mainCached) promises.push(this.loadBuffer(track.audioFiles.main));
    if (track.hasMuteableGuitar && track.audioFiles.guitar && !guitarCached) {
      promises.push(this.loadBuffer(track.audioFiles.guitar));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Internal playback start
   */
  private startPlayback(): boolean {
    if (!this.audioContext || !this.mainBuffer || !this.mainGainNode) {
      console.error('[AudioEngine] startPlayback: Missing required objects');
      return false;
    }

    // Double-check context state
    if (this.audioContext.state !== 'running') {
      console.error('[AudioEngine] startPlayback: Context not running!', { state: this.audioContext.state });
      return false;
    }

    // Create main source
    this.mainSource = this.audioContext.createBufferSource();
    this.mainSource.buffer = this.mainBuffer;
    this.mainSource.playbackRate.value = this._playbackRate;
    this.mainSource.connect(this.mainGainNode);

    // Setup onended
    this.mainSource.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this.startOffset = 0;
        this.notifyStateChange();
        this.onTrackEndCallback?.();
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
    } catch (e) {
      console.error('[AudioEngine] startPlayback: start() failed', (e as Error)?.message);
      return false;
    }

    this._isPlaying = true;
    this.startTime = startAt;
    this.notifyStateChange();

    return true;
  }

  /**
   * Synchronous play (for user gestures)
   */
  play(): void {
    if (!this.audioContext || !this.mainBuffer) {
      console.warn('[AudioEngine] play: Missing context or buffer');
      return;
    }
    if (this._isPlaying) return;

    if (isContextNotRunning(this.audioContext)) {
      this.audioContext.resume()
        .catch((err) => console.error('[AudioEngine] play: resume() failed', err?.message));
    }

    if (this.audioContext.state === 'running') {
      this.startPlayback();
    } else {
      console.warn('[AudioEngine] play: Context not running, scheduling retry', { state: this.audioContext.state });
      setTimeout(() => {
        if (!this._isPlaying && this.audioContext?.state === 'running') {
          this.startPlayback();
        } else {
          console.warn('[AudioEngine] play: Retry - conditions not met');
        }
      }, 50);
    }
  }

  /**
   * Async play (for auto-advance)
   */
  async playAsync(): Promise<boolean> {
    if (!this.audioContext || !this.mainBuffer) {
      console.warn('[AudioEngine] playAsync: Missing context or buffer');
      return false;
    }
    if (this._isPlaying) return true;

    const isReady = await this.ensureContextRunning();

    if (!isReady) {
      console.error('[AudioEngine] playAsync: Context not ready');
      return false;
    }

    if (this.audioContext.state !== 'running') {
      console.error('[AudioEngine] playAsync: Context still not running', { state: this.audioContext.state });
      return false;
    }

    return this.startPlayback();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this._isPlaying || !this.audioContext) return;

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

    this.notifyStateChange();
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.pause();
    this.startOffset = 0;
    this.notifyStateChange();
  }

  /**
   * Seek to position
   */
  async seek(time: number): Promise<void> {
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

    if (this.audioContext && this._isPlaying) {
      const changeTime = this.audioContext.currentTime;
      if (this.mainSource) this.mainSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
      if (this.guitarSource) this.guitarSource.playbackRate.setValueAtTime(this._playbackRate, changeTime);
    }

    this.notifyStateChange();
  }

  setGuitarMuted(muted: boolean): void {
    this.guitarMuted = muted;

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
    this.onTrackEndCallback = callback;
  }

  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback;
  }

  private notifyStateChange(): void {
    this.onStateChangeCallback?.();
  }

  destroy(): void {
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
    engineRef.current?.initialize();
  }, []);

  const loadTrack = useCallback(async (track: Track) => {
    if (!engineRef.current) return;
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
    engineRef.current?.play();
  }, []);

  const playAsync = useCallback(async (): Promise<boolean> => {
    if (!engineRef.current) return false;
    return engineRef.current.playAsync();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
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
