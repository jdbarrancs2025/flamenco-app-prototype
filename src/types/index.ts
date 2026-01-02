// src/types/index.ts

/**
 * Represents a single audio track in a playlist
 */
export interface Track {
  /** Unique identifier for the track */
  id: string;
  
  /** Display name of the track (in Spanish) */
  name: string;
  
  /** Number of compases (flamenco rhythm measures) */
  compases: number;
  
  /** Whether this track has a separate guitar file that can be muted */
  hasMuteableGuitar: boolean;
  
  /** URLs to audio files */
  audioFiles: {
    /** Main audio file (or cante+palmas for mutable tracks) */
    main: string;
    /** Guitar-only audio file (only present if hasMuteableGuitar is true) */
    guitar?: string;
  };
}

/**
 * Represents a playlist containing multiple tracks
 */
export interface Playlist {
  /** Unique identifier for the playlist */
  id: string;
  
  /** Short name displayed on card (e.g., "SxB") */
  name: string;
  
  /** Subtitle displayed on card (e.g., "Tablao") */
  subtitle: string;
  
  /** Full title displayed in player (e.g., "Tablao, Soleá por Bulería") */
  fullTitle: string;
  
  /** Array of tracks in this playlist */
  tracks: Track[];
}

/**
 * State of the audio player
 */
export interface PlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  
  /** Index of currently playing track in the playlist */
  currentTrackIndex: number;
  
  /** Current playback position in seconds */
  currentTime: number;
  
  /** Total duration of current track in seconds */
  duration: number;
  
  /** Current playback rate (0.8 to 1.2) */
  playbackRate: number;
  
  /** Whether single track loop is enabled */
  isLooping: boolean;
  
  /** Set of track IDs that have guitar muted */
  mutedTrackIds: Set<string>;
}

/**
 * State of a playlist in the current session
 */
export interface PlaylistSessionState {
  /** The active playlist being viewed/played */
  playlist: Playlist;
  
  /** Current track order (can be modified by drag & drop) */
  trackOrder: string[];
  
  /** Set of track IDs that have been deleted this session */
  deletedTrackIds: Set<string>;
}

/**
 * Audio engine state (internal)
 */
export interface AudioEngineState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  
  /** ID of currently loaded track */
  currentTrackId: string | null;
  
  /** Current playback position in seconds */
  currentTime: number;
  
  /** Total duration of current track in seconds */
  duration: number;
  
  /** Current playback rate */
  playbackRate: number;
  
  /** Whether audio context is initialized */
  isInitialized: boolean;
}

/**
 * Props for track item component
 */
export interface TrackItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isGuitarMuted: boolean;
  onSelect: () => void;
  onToggleMute: () => void;
  onDelete: () => void;
}

/**
 * Props for player controls component
 */
export interface PlayerControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  isGuitarMuted: boolean;
  canMuteGuitar: boolean;
  onPlayPause: () => void;
  onToggleLoop: () => void;
  onToggleMute: () => void;
  onDelete: () => void;
}

/**
 * Props for speed slider component
 */
export interface SpeedSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/**
 * Props for playlist card component
 */
export interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}
