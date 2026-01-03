import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Pills } from '../components/layout/Pills';
import { TabBar } from '../components/layout/TabBar';
import { SpeedSlider } from '../components/player/SpeedSlider';
import { PlayerControls } from '../components/player/PlayerControls';
import { TrackList } from '../components/player/TrackList';
import { getPlaylistById } from '../data/playlists';
import type { Track } from '../types';

export function PlaylistView() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const playlist = playlistId ? getPlaylistById(playlistId) : undefined;

  // Player state (visual only for Milestone 1)
  const [prevPlaylistId, setPrevPlaylistId] = useState<string | undefined>(
    undefined
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [mutedTrackIds, setMutedTrackIds] = useState<Set<string>>(new Set());
  const [tracks, setTracks] = useState<Track[]>(() =>
    playlist?.tracks ? [...playlist.tracks] : []
  );

  // Reset state when playlist changes (React-recommended pattern)
  if (playlistId !== prevPlaylistId) {
    setPrevPlaylistId(playlistId);
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

  if (!playlist) {
    return null;
  }

  const currentTrack = tracks[currentTrackIndex];
  const canMuteGuitar = currentTrack?.hasMuteableGuitar ?? false;
  const isGuitarMuted = currentTrack ? mutedTrackIds.has(currentTrack.id) : false;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleToggleMute = (trackId?: string) => {
    const id = trackId ?? currentTrack?.id;
    if (!id) return;

    setMutedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
    setCurrentTrackIndex(index);
  };

  return (
    <div className="app-container flex flex-col">
      <Header title="Nivel Intermedio" />
      <Pills activeTab="mixer" />

      {/* Speed Slider - 52px below pills (164px - 112px in Figma) */}
      <div style={{ marginTop: '20px' }}>
        <SpeedSlider value={playbackRate} onChange={setPlaybackRate} />
      </div>

      {/* Player Controls */}
      <PlayerControls
        isPlaying={isPlaying}
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
