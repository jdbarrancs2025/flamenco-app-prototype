import type { Track } from '../../types';

// Custom waveform icon component matching Figma exactly
function WaveformIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="34"
      height="19"
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
      className="flex items-center cursor-pointer"
      style={{ padding: '8px 0' }}
      onClick={onSelect}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <span
          className="font-medium"
          style={{
            fontSize: '14px',
            lineHeight: '1.4',
            color: isActive ? '#6750A4' : '#000000'
          }}
        >
          {track.name}
        </span>
        <span
          className="font-normal"
          style={{ fontSize: '12px', lineHeight: '1.5', color: '#828282' }}
        >
          {compasesText}
        </span>
      </div>

      {track.hasMuteableGuitar && (
        <button
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '34px',
            height: '19px',
            marginLeft: '12px',
            color: isGuitarMuted ? '#6750A4' : '#000000'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute?.();
          }}
          aria-label="Silenciar guitarra"
        >
          <WaveformIcon />
        </button>
      )}
    </div>
  );
}
