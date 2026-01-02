import { Header } from '../components/layout/Header';
import { Pills } from '../components/layout/Pills';
import { TabBar } from '../components/layout/TabBar';
import { PlaylistCard } from '../components/home/PlaylistCard';
import { playlists } from '../data/playlists';

export function Home() {
  return (
    <div className="app-container flex flex-col">
      <Header title="Menú de Inicio" />
      <Pills activeTab="mixer" />

      {/* Playlist Cards - 56px gap from pills (168px - 112px in Figma) */}
      <div className="flex" style={{ gap: '12px', paddingLeft: '16px', paddingRight: '10px', marginTop: '24px' }}>
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>

      {/* Flex spacer pushes tab bar to bottom */}
      <div className="flex-1" />

      <TabBar />
    </div>
  );
}
