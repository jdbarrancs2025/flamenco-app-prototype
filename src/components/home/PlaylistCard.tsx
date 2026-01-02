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
      className="flex flex-col p-4 gap-2 w-[171px] h-[92px] bg-white border border-[#E0E0E0] rounded-lg cursor-pointer text-left hover:border-[#BDBDBD] transition-colors"
    >
      <span className="font-semibold text-[28px] leading-[120%] tracking-[-0.02em] text-black">
        {playlist.name}
      </span>
      <span className="font-medium text-xs leading-[150%] text-[#828282]">
        {playlist.subtitle}
      </span>
    </button>
  );
}
