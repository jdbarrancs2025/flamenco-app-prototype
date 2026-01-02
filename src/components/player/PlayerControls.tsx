import { Trash2, Play, Pause, Repeat } from 'lucide-react';

// Custom waveform icon component
function WaveformIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 5v14" />
      <path d="M14 8v8" />
      <path d="M18 10v4" />
      <path d="M22 12h-2" />
    </svg>
  );
}

// Custom shuffle icon with strikethrough
function ShuffleDisabledIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Shuffle arrows */}
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
      {/* Strikethrough line */}
      <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

interface PlayerControlsProps {
  isPlaying?: boolean;
  isLooping?: boolean;
  isGuitarMuted?: boolean;
  canMuteGuitar?: boolean;
  onPlayPause?: () => void;
  onToggleLoop?: () => void;
  onToggleMute?: () => void;
  onDelete?: () => void;
}

export function PlayerControls({
  isPlaying = false,
  isLooping = false,
  isGuitarMuted = false,
  canMuteGuitar = false,
  onPlayPause,
  onToggleLoop,
  onToggleMute,
  onDelete,
}: PlayerControlsProps) {
  return (
    <div className="flex justify-around items-center px-[30px] h-16">
      {/* Delete */}
      <button
        className="w-12 h-12 flex items-center justify-center"
        onClick={onDelete}
        aria-label="Eliminar pista"
      >
        <Trash2 size={28} className="text-black" />
      </button>

      {/* Mute Guitar */}
      <button
        className={`w-12 h-12 flex items-center justify-center ${
          !canMuteGuitar ? 'opacity-30' : ''
        } ${isGuitarMuted ? 'text-primary' : 'text-black'}`}
        onClick={onToggleMute}
        disabled={!canMuteGuitar}
        aria-label="Silenciar guitarra"
      >
        <WaveformIcon size={34} />
      </button>

      {/* Play/Pause */}
      <button
        className="w-[61px] h-16 flex items-center justify-center"
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying ? (
          <Pause size={48} className="text-black" fill="black" />
        ) : (
          <Play size={48} className="text-black" fill="black" />
        )}
      </button>

      {/* Shuffle (disabled) */}
      <button
        className="w-12 h-12 flex items-center justify-center opacity-50 cursor-not-allowed"
        disabled
        aria-label="Aleatorio (deshabilitado)"
      >
        <ShuffleDisabledIcon size={28} />
      </button>

      {/* Repeat/Loop */}
      <button
        className={`w-12 h-12 flex items-center justify-center ${
          isLooping ? 'text-primary' : 'text-black'
        }`}
        onClick={onToggleLoop}
        aria-label={isLooping ? 'Desactivar repetición' : 'Activar repetición'}
      >
        <Repeat size={28} />
      </button>
    </div>
  );
}
