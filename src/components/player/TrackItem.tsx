import type { Track } from '../../types';

// Custom waveform icon component
function WaveformIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 19"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9.5h3" />
      <path d="M8 4v11" />
      <path d="M14 1v17" />
      <path d="M20 4v11" />
      <path d="M26 6v7" />
      <path d="M32 9.5h-3" />
    </svg>
  );
}

interface TrackItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isGuitarMuted?: boolean;
  onSelect: () => void;
  onToggleMute?: () => void;
}

export function TrackItem({
  track,
  isActive,
  isGuitarMuted = false,
  onSelect,
  onToggleMute,
}: TrackItemProps) {
  const compasesText = track.compases === 1 ? '1 compás' : `${track.compases} compases`;

  return (
    <div
      className="flex items-center py-2 gap-3 cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <span
          className={`font-medium text-sm leading-[140%] truncate ${
            isActive ? 'text-primary' : 'text-black'
          }`}
        >
          {track.name}
        </span>
        <span className="font-normal text-xs leading-[150%] text-gray-500">
          {compasesText}
        </span>
      </div>

      {track.hasMuteableGuitar && (
        <button
          className={`w-[34px] h-[19px] flex items-center justify-center flex-shrink-0 ${
            isGuitarMuted ? 'text-primary' : 'text-black'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute?.();
          }}
          aria-label="Silenciar guitarra"
        >
          <WaveformIcon size={34} />
        </button>
      )}
    </div>
  );
}
