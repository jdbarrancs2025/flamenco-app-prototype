import { TrackItem } from './TrackItem';
import type { Track } from '../../types';

interface TrackListProps {
  title: string;
  tracks: Track[];
  currentTrackIndex: number;
  mutedTrackIds?: Set<string>;
  onSelectTrack: (index: number) => void;
  onToggleMute?: (trackId: string) => void;
}

export function TrackList({
  title,
  tracks,
  currentTrackIndex,
  mutedTrackIds = new Set(),
  onSelectTrack,
  onToggleMute,
}: TrackListProps) {
  return (
    <div
      className="bg-white overflow-hidden flex flex-col"
      style={{
        margin: '0 22px 16px 22px',
        border: '1px solid #E0E0E0',
        borderRadius: '8px',
        maxHeight: '406px'
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0" style={{ padding: '16px 16px 8px 16px' }}>
        <h2
          className="font-semibold text-black"
          style={{ fontSize: '14px', lineHeight: '1.4' }}
        >
          {title}
        </h2>
      </div>

      {/* Track list - scrollable */}
      <div
        className="overflow-y-auto flex-1 min-h-0"
        style={{ padding: '0 16px 16px 16px' }}
      >
        {tracks.map((track, index) => (
          <TrackItem
            key={track.id}
            track={track}
            index={index}
            isActive={index === currentTrackIndex}
            isGuitarMuted={mutedTrackIds.has(track.id)}
            onSelect={() => onSelectTrack(index)}
            onToggleMute={() => onToggleMute?.(track.id)}
          />
        ))}
      </div>
    </div>
  );
}
