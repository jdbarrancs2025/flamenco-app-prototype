import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { PlaylistView } from './pages/PlaylistView';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/playlist/:playlistId" element={<PlaylistView />} />
    </Routes>
  );
}

export default App;
