import { useNavigate } from 'react-router-dom';
import type { Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="flex flex-col bg-white cursor-pointer text-left transition-colors overflow-hidden"
      style={{
        padding: '16px',
        gap: '8px',
        width: '171px',
        minHeight: '92px',
        border: '1px solid #E0E0E0',
        borderRadius: '8px'
      }}
    >
      <span
        className="font-semibold text-black"
        style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.02em' }}
      >
        {playlist.name}
      </span>
      <span
        className="font-medium"
        style={{ fontSize: '12px', lineHeight: '1.5', color: '#828282' }}
      >
        {playlist.subtitle}
      </span>
    </button>
  );
}
