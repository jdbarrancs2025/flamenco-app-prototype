// src/data/playlists.ts
// Audio file paths match actual structure in /public/audio/

import type { Playlist, Track } from '../types';

/**
 * Playlist 1: Tablao, Soleá por Bulería (SxB)
 * 9 tracks, 4 with mutable guitar
 */
const playlist1Tracks: Track[] = [
  {
    id: 'sxb-01',
    name: 'Base Soléa por Bulerías x2',
    compases: 2,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Base Soleá por Bulerías x2.wav',
    },
  },
  {
    id: 'sxb-02',
    name: 'Salida de Cante Soleá por Bulería',
    compases: 5,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Salida SxB/Salida Cante Soleá por Bulería.wav',
      guitar: '/audio/playlist-1/Tablao, SxB/Salida SxB/Salida Cante Soleá por Bulería, Solo Guitarra.wav',
    },
  },
  {
    id: 'sxb-03',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Base Soleá por Bulerías.wav',
    },
  },
  {
    id: 'sxb-04',
    name: 'Dios te había dado sabiduría',
    compases: 7,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Dios te había dado sabiduría/Dios te había dado.wav',
      guitar: '/audio/playlist-1/Tablao, SxB/Dios te había dado sabiduría/Dios te había dado, Solo Guitarra.wav',
    },
  },
  {
    id: 'sxb-05',
    name: 'Falseta 1 Soleá por Bulería',
    compases: 3,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Falseta 1.wav',
    },
  },
  {
    id: 'sxb-06',
    name: 'Cuando tú me eches de menos',
    compases: 12,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Cuando tú me eches de menos/Cuando tú.wav',
      guitar: '/audio/playlist-1/Tablao, SxB/Cuando tú me eches de menos/Cuando tú, Solo Guitarra.wav',
    },
  },
  {
    id: 'sxb-07',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Base Soleá por Bulerías.wav',
    },
  },
  {
    id: 'sxb-08',
    name: 'A pasar fatiga doble',
    compases: 6,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/A pasar Fatiga/A pasar Fatiga.wav',
      guitar: '/audio/playlist-1/Tablao, SxB/A pasar Fatiga/A pasar Fatiga, Solo Guitarra.wav',
    },
  },
  {
    id: 'sxb-09',
    name: 'Cierre Final Guitarra Soleá por Bulería',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/Tablao, SxB/Cierre Final Guitarra.wav',
    },
  },
];

/**
 * Playlist 2: Fiesta, Bulerías
 * 5 tracks, 2 with mutable guitar
 */
const playlist2Tracks: Track[] = [
  {
    id: 'bulerias-01',
    name: 'Compases Base por Bulerías',
    compases: 2,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/Fiesta, Bulerías/Base por Bulerías x2.wav',
    },
  },
  {
    id: 'bulerias-02',
    name: 'Águilas que vais volando + Sitio dónde te hablé',
    compases: 24,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/Fiesta, Bulerías/Aguilas que vais Volando/Aguilas que vais volando, Cante y Percu.wav',
      guitar: '/audio/playlist-2/Fiesta, Bulerías/Aguilas que vais Volando/Aguilas que vais volando, Solo Guitarra.wav',
    },
  },
  {
    id: 'bulerias-03',
    name: 'Base por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/Fiesta, Bulerías/Base por Bulerías.wav',
    },
  },
  {
    id: 'bulerias-04',
    name: 'Tiro piedras por la calle + Coletilla final',
    compases: 17,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/Fiesta, Bulerías/Tiro piedras por la calle/Tiro piedras por la calle, Cante y Percu.wav',
      guitar: '/audio/playlist-2/Fiesta, Bulerías/Tiro piedras por la calle/Tiro piedras por la calle, Solo Guitarra.wav',
    },
  },
  {
    id: 'bulerias-05',
    name: 'Cierre Guitarra Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/Fiesta, Bulerías/Cierre Guitarra Bulerías.wav',
    },
  },
];

/**
 * All playlists
 */
export const playlists: Playlist[] = [
  {
    id: 'sxb',
    name: 'SxB',
    subtitle: 'Tablao',
    fullTitle: 'Tablao, Soleá por Bulería',
    tracks: playlist1Tracks,
  },
  {
    id: 'bulerias',
    name: 'Bulerías',
    subtitle: 'Fiesta',
    fullTitle: 'Fiesta, Bulerías',
    tracks: playlist2Tracks,
  },
];

/**
 * Helper to get playlist by ID
 */
export function getPlaylistById(id: string): Playlist | undefined {
  return playlists.find(p => p.id === id);
}

/**
 * List of track IDs that have mutable guitar
 * For reference/validation
 */
export const muteableTrackIds = [
  'sxb-02',      // Salida de Cante Soleá por Bulería
  'sxb-04',      // Dios te había dado sabiduría
  'sxb-06',      // Cuando tú me eches de menos
  'sxb-08',      // A pasar fatiga doble
  'bulerias-02', // Águilas que vais volando + Sitio dónde te hablé
  'bulerias-04', // Tiro piedras por la calle + Coletilla final
];
