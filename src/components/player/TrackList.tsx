import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTrackItem } from './SortableTrackItem';
import type { Track } from '../../types';

interface TrackListProps {
  title: string;
  tracks: Track[];
  currentTrackIndex: number;
  isGuitarMuted?: boolean;
  onSelectTrack: (index: number) => void;
  onToggleMute?: () => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

export function TrackList({
  title,
  tracks,
  currentTrackIndex,
  isGuitarMuted = false,
  onSelectTrack,
  onToggleMute,
  onReorder,
}: TrackListProps) {
  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 10px movement before activating (prevents accidental drags)
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms with 5px tolerance (distinguishes tap from drag)
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder?.(oldIndex, newIndex);
      }
    }
  };

  // Get track IDs for SortableContext
  const trackIds = tracks.map((t) => t.id);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
            {tracks.map((track, index) => (
              <SortableTrackItem
                key={track.id}
                track={track}
                index={index}
                isActive={index === currentTrackIndex}
                isGuitarMuted={isGuitarMuted}
                onSelect={() => onSelectTrack(index)}
                onToggleMute={() => onToggleMute?.()}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
