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
    <div className="mx-[22px] mb-4 bg-white border border-[#E0E0E0] rounded-lg overflow-hidden flex flex-col max-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h2 className="font-semibold text-sm leading-[140%] text-black">
          {title}
        </h2>
      </div>

      {/* Track list - scrollable */}
      <div className="px-4 pb-4 overflow-y-auto track-list-scroll flex-1 min-h-0">
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
