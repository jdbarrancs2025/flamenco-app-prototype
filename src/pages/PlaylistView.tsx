import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { Pills } from '../components/layout/Pills';
import { TabBar } from '../components/layout/TabBar';
import { SpeedSlider } from '../components/player/SpeedSlider';
import { PlayerControls } from '../components/player/PlayerControls';
import { TrackList } from '../components/player/TrackList';
import { getPlaylistById } from '../data/playlists';
import { useAudioEngine } from '../hooks/useAudioEngine';
import type { Track } from '../types';

export function PlaylistView() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const playlist = playlistId ? getPlaylistById(playlistId) : undefined;

  // Audio engine hook
  const {
    state: audioState,
    initialize,
    loadTrack,
    prefetchTrack,
    play,
    playAsync,  // NEW: async version for auto-advance (iOS fix)
    pause,
    stop,
    setPlaybackRate: setEnginePlaybackRate,
    setGuitarMuted,
    onTrackEnd,
  } = useAudioEngine();

  // Player state
  const [prevPlaylistId, setPrevPlaylistId] = useState<string | undefined>(
    undefined
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const wasPlayingRef = useRef(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [mutedTrackIds, setMutedTrackIds] = useState<Set<string>>(new Set());
  const mutedTrackIdsRef = useRef(mutedTrackIds);
  const isLoadingTrackRef = useRef(false);  // Prevent concurrent track loads
  const currentTrackIndexRef = useRef(currentTrackIndex);
  const isLoopingRef = useRef(isLooping);
  const [tracks, setTracks] = useState<Track[]>(() =>
    playlist?.tracks ? [...playlist.tracks] : []
  );
  const tracksRef = useRef(tracks);

  // Reset state when playlist changes (React-recommended pattern)
  if (playlistId !== prevPlaylistId) {
    setPrevPlaylistId(playlistId);
    stop();
    if (playlist) {
      setTracks([...playlist.tracks]);
      setCurrentTrackIndex(0);
      setMutedTrackIds(new Set());
    }
  }

  // Redirect if playlist not found
  useEffect(() => {
    if (playlistId && !playlist) {
      navigate('/');
    }
  }, [playlistId, playlist, navigate]);

  // Keep mutedTrackIds ref in sync (avoids triggering track reload on mute toggle)
  useEffect(() => {
    mutedTrackIdsRef.current = mutedTrackIds;
  }, [mutedTrackIds]);

  // Keep other refs in sync for stable onTrackEnd callback
  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Load track when selection changes (NOT when mute state changes!)
  useEffect(() => {
    const track = tracks[currentTrackIndex];
    // Only load if track is different from what's already loaded
    // This prevents re-loading during playback if tracks array reference changes
    if (track && audioState.currentTrackId !== track.id) {
      loadTrack(track)
        .then(() => {
          // Use ref to get per-track mute state (each track remembers its own mute)
          setGuitarMuted(mutedTrackIdsRef.current.has(track.id));
        })
        .catch((error) => {
          console.error('[PlaylistView] Failed to load track:', error);
          // Graceful fallback - don't crash, user can try selecting again
        });
    }
  }, [currentTrackIndex, tracks, audioState.currentTrackId, loadTrack, setGuitarMuted]);

  // Auto-advance on track end - register callback ONCE with stable refs
  // KEY iOS FIX: Use playAsync() instead of relying on wasPlayingRef + effect
  useEffect(() => {
    onTrackEnd(async () => {
      // Read FRESH values from refs (not stale closure captures)
      const currentIndex = currentTrackIndexRef.current;
      const looping = isLoopingRef.current;
      const currentTracks = tracksRef.current;

      console.log('[PlaylistView.onTrackEnd] Callback fired', {
        currentIndex,
        looping,
        tracksLength: currentTracks.length,
      });

      if (looping) {
        // Replay current track - load it again to reset position
        if (isLoadingTrackRef.current) return;  // Prevent concurrent loads
        const track = currentTracks[currentIndex];
        if (track) {
          isLoadingTrackRef.current = true;
          try {
            await loadTrack(track);
            // Use per-track mute state (persists when looping same track)
            setGuitarMuted(mutedTrackIdsRef.current.has(track.id));
            // iOS FIX: Use playAsync to properly await context resume
            console.log('[PlaylistView.onTrackEnd] Loop: calling playAsync()');
            await playAsync();
          } catch (error) {
            console.error('[PlaylistView.onTrackEnd] Loop failed:', error);
          } finally {
            isLoadingTrackRef.current = false;
          }
        }
      } else {
        // Advance to next (or loop playlist)
        const nextIndex = (currentIndex + 1) % currentTracks.length;
        const nextTrack = currentTracks[nextIndex];

        console.log('[PlaylistView.onTrackEnd] Advancing to next track', {
          nextIndex,
          nextTrackId: nextTrack?.id,
        });

        if (nextTrack) {
          if (isLoadingTrackRef.current) return;  // Prevent concurrent loads
          isLoadingTrackRef.current = true;
          try {
            // Update the track index first
            setCurrentTrackIndex(nextIndex);
            currentTrackIndexRef.current = nextIndex;  // Update ref immediately

            // Load the next track
            await loadTrack(nextTrack);
            // Apply mute state for the new track
            setGuitarMuted(mutedTrackIdsRef.current.has(nextTrack.id));
            // iOS FIX: Use playAsync to properly await context resume
            console.log('[PlaylistView.onTrackEnd] Advance: calling playAsync()');
            const success = await playAsync();
            console.log('[PlaylistView.onTrackEnd] Advance playAsync result:', success);
          } catch (error) {
            console.error('[PlaylistView.onTrackEnd] Advance failed:', error);
          } finally {
            isLoadingTrackRef.current = false;
          }
        }
      }
    });
  }, [onTrackEnd, loadTrack, setGuitarMuted, playAsync]);

  // Auto-play when track changes (if was playing) - for track selection scenarios
  // This effect handles when user clicks on a different track while playing
  useEffect(() => {
    const currentTrack = tracks[currentTrackIndex];

    // Only auto-play when:
    // 1. We were playing before (user selected a different track while playing)
    // 2. Not currently loading
    // 3. Track has duration
    // 4. The LOADED track matches the SELECTED track (prevents playing old buffer)
    if (wasPlayingRef.current &&
        !audioState.isLoading &&
        audioState.duration > 0 &&
        audioState.currentTrackId === currentTrack?.id) {
      console.log('[PlaylistView.autoPlay] Track selection auto-play, calling playAsync()');
      wasPlayingRef.current = false;  // Reset FIRST to prevent double-call

      // iOS FIX: Use playAsync for proper async handling
      playAsync().then(success => {
        console.log('[PlaylistView.autoPlay] playAsync result:', success);
      });
    }
  }, [audioState.isLoading, audioState.duration, audioState.currentTrackId, currentTrackIndex, tracks, playAsync]);

  // Prefetch next track when playback starts (for faster transitions)
  useEffect(() => {
    if (audioState.isPlaying && tracks.length > 1) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      const nextTrack = tracks[nextIndex];

      // Prefetch in background (don't await, ignore errors)
      prefetchTrack(nextTrack).catch(() => {
        // Ignore prefetch errors - it's just an optimization
      });
    }
  }, [audioState.isPlaying, currentTrackIndex, tracks, prefetchTrack]);

  if (!playlist) {
    return null;
  }

  const currentTrack = tracks[currentTrackIndex];
  const canMuteGuitar = currentTrack?.hasMuteableGuitar ?? false;
  const isGuitarMuted = currentTrack ? mutedTrackIds.has(currentTrack.id) : false;

  const handlePlayPause = () => {
    if (audioState.isPlaying) {
      pause();
    } else {
      // Initialize AudioContext synchronously on user gesture (iOS requirement)
      // Must NOT use await - gesture context expires if async
      initialize();
      // Use synchronous play() here - we're in a user gesture context
      play();
    }
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleToggleMute = (trackId?: string) => {
    const id = trackId ?? currentTrack?.id;
    if (!id) return;

    setMutedTrackIds((prev) => {
      const next = new Set(prev);
      const newMuted = !next.has(id);

      if (newMuted) {
        next.add(id);
      } else {
        next.delete(id);
      }

      // Apply to audio engine if this is the current track
      if (id === currentTrack?.id) {
        setGuitarMuted(newMuted);
      }

      return next;
    });
  };

  const handleDelete = () => {
    // Prevent deleting last track
    if (tracks.length <= 1) return;

    // Guard against concurrent track loads
    if (isLoadingTrackRef.current) return;

    const deletedTrackId = tracks[currentTrackIndex]?.id;
    const wasPlaying = audioState.isPlaying;

    // Stop playback if currently playing
    if (wasPlaying) {
      stop();
    }

    // Clean up mute state for deleted track
    if (deletedTrackId && mutedTrackIds.has(deletedTrackId)) {
      setMutedTrackIds(prev => {
        const next = new Set(prev);
        next.delete(deletedTrackId);
        return next;
      });
    }

    // Remove track from list
    const newTracks = tracks.filter((_, index) => index !== currentTrackIndex);

    // Update ref BEFORE state (prevents stale reads in callbacks)
    tracksRef.current = newTracks;
    setTracks(newTracks);

    // Calculate new index
    let newIndex = currentTrackIndex;
    if (currentTrackIndex >= newTracks.length) {
      newIndex = Math.max(0, newTracks.length - 1);
    }

    // Do NOT auto-play after deletion - just load the next track
    wasPlayingRef.current = false;

    setCurrentTrackIndex(newIndex);
  };

  const handleSelectTrack = (index: number) => {
    // Remember if we were playing (to auto-resume after track loads)
    wasPlayingRef.current = audioState.isPlaying;
    stop();
    setCurrentTrackIndex(index);
  };

  const handleReorderTracks = (oldIndex: number, newIndex: number) => {
    // Get current track ID before reorder
    const currentTrackId = tracks[currentTrackIndex]?.id;

    // Reorder tracks array using splice
    const newTracks = [...tracks];
    const [removed] = newTracks.splice(oldIndex, 1);
    newTracks.splice(newIndex, 0, removed);
    setTracks(newTracks);

    // Update currentTrackIndex to follow the currently playing track
    if (currentTrackId) {
      const newCurrentIndex = newTracks.findIndex(t => t.id === currentTrackId);
      if (newCurrentIndex !== -1 && newCurrentIndex !== currentTrackIndex) {
        setCurrentTrackIndex(newCurrentIndex);
      }
    }

    // Update tracksRef immediately for audio callbacks
    tracksRef.current = newTracks;
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);           // Local state for UI
    setEnginePlaybackRate(rate);     // Audio engine
  };

  return (
    <div className="app-container flex flex-col">
      <Header title="Nivel Intermedio" />
      <Pills activeTab="mixer" />

      {/* Speed Slider - 52px below pills (164px - 112px in Figma) */}
      <div style={{ marginTop: '20px' }}>
        <SpeedSlider value={playbackRate} onChange={handleSpeedChange} />
      </div>

      {/* Player Controls */}
      <PlayerControls
        isPlaying={audioState.isPlaying}
        isLooping={isLooping}
        isGuitarMuted={isGuitarMuted}
        canMuteGuitar={canMuteGuitar}
        canDelete={tracks.length > 1}
        onPlayPause={handlePlayPause}
        onToggleLoop={handleToggleLoop}
        onToggleMute={() => handleToggleMute()}
        onDelete={handleDelete}
      />

      {/* Track List - fixed height container */}
      <div style={{ marginTop: '8px' }}>
        <TrackList
          title={`Reproductor: ${playlist.fullTitle}.`}
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          mutedTrackIds={mutedTrackIds}
          onSelectTrack={handleSelectTrack}
          onToggleMute={handleToggleMute}
          onReorder={handleReorderTracks}
        />
      </div>

      {/* Spacer to push tab bar down */}
      <div className="flex-1" />

      <TabBar />
    </div>
  );
}
