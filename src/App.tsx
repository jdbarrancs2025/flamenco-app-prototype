import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { PlaylistView } from './pages/PlaylistView';
import { DebugPanel } from './components/debug/DebugPanel';
import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playlist/:playlistId" element={<PlaylistView />} />
      </Routes>
      <DebugPanel />
    </>
  );
}

export default App;
