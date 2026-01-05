import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrackItem } from './TrackItem';
import type { Track } from '../../types';

// Drag handle icon (grip/hamburger)
function GripIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 5h10" />
      <path d="M3 8h10" />
      <path d="M3 11h10" />
    </svg>
  );
}

interface SortableTrackItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isGuitarMuted?: boolean;
  onSelect: () => void;
  onToggleMute?: () => void;
}

export function SortableTrackItem({
  track,
  index,
  isActive,
  isGuitarMuted,
  onSelect,
  onToggleMute,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {/* Drag handle - only this triggers drag */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab p-1 flex-shrink-0"
        style={{ color: '#828282', marginRight: '8px' }}
        aria-label="Arrastrar para reordenar"
      >
        <GripIcon />
      </button>

      {/* Track content - clicking selects track */}
      <div className="flex-1 min-w-0">
        <TrackItem
          track={track}
          index={index}
          isActive={isActive}
          isGuitarMuted={isGuitarMuted}
          onSelect={onSelect}
          onToggleMute={onToggleMute}
        />
      </div>
    </div>
  );
}
