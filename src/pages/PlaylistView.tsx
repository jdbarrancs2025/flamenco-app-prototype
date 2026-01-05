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
    play,
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
  const tracksRef = useRef(tracks);
  const [tracks, setTracks] = useState<Track[]>(() =>
    playlist?.tracks ? [...playlist.tracks] : []
  );

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
    if (track) {
      loadTrack(track).then(() => {
        // Use ref to get current mute state without adding to deps
        setGuitarMuted(mutedTrackIdsRef.current.has(track.id));
      });
    }
  }, [currentTrackIndex, tracks, loadTrack, setGuitarMuted]);

  // Auto-advance on track end - register callback ONCE with stable refs
  useEffect(() => {
    onTrackEnd(() => {
      // Always set wasPlayingRef to trigger auto-play after track loads
      wasPlayingRef.current = true;

      // Read FRESH values from refs (not stale closure captures)
      const currentIndex = currentTrackIndexRef.current;
      const looping = isLoopingRef.current;
      const currentTracks = tracksRef.current;

      if (looping) {
        // Replay current track - load it again to reset position
        if (isLoadingTrackRef.current) return;  // Prevent concurrent loads
        const track = currentTracks[currentIndex];
        if (track) {
          isLoadingTrackRef.current = true;
          loadTrack(track).then(() => {
            setGuitarMuted(mutedTrackIdsRef.current.has(track.id));
            isLoadingTrackRef.current = false;
            // Auto-play effect will call play() when loading completes
          }).catch(() => {
            isLoadingTrackRef.current = false;
          });
        }
      } else {
        // Advance to next (or loop playlist)
        const nextIndex = (currentIndex + 1) % currentTracks.length;
        setCurrentTrackIndex(nextIndex);
      }
    });
  }, [onTrackEnd, loadTrack, setGuitarMuted]);  // Only stable function dependencies

  // Auto-play when track changes (if was playing)
  useEffect(() => {
    if (wasPlayingRef.current && !audioState.isLoading && audioState.duration > 0) {
      wasPlayingRef.current = false;  // Reset FIRST to prevent double-call in race conditions
      play();
    }
  }, [audioState.isLoading, audioState.duration, play]);

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
    if (tracks.length <= 1) return;

    const newTracks = tracks.filter((_, index) => index !== currentTrackIndex);
    setTracks(newTracks);

    // Adjust current track index
    if (currentTrackIndex >= newTracks.length) {
      setCurrentTrackIndex(Math.max(0, newTracks.length - 1));
    }
  };

  const handleSelectTrack = (index: number) => {
    wasPlayingRef.current = audioState.isPlaying;
    stop();
    setCurrentTrackIndex(index);
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
        />
      </div>

      {/* Spacer to push tab bar down */}
      <div className="flex-1" />

      <TabBar />
    </div>
  );
}
