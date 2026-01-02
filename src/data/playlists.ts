// src/data/playlists.ts
// Reference file - Copy to your project

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
      main: '/audio/playlist-1/01-base-solea-x2.mp3',
    },
  },
  {
    id: 'sxb-02',
    name: 'Salida de Cante Soleá por Bulería',
    compases: 5,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/02-salida-cante-main.mp3',
      guitar: '/audio/playlist-1/02-salida-cante-guitar.mp3',
    },
  },
  {
    id: 'sxb-03',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/03-base-solea.mp3',
    },
  },
  {
    id: 'sxb-04',
    name: 'Dios te había dado sabiduría',
    compases: 7,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/04-dios-te-habia-main.mp3',
      guitar: '/audio/playlist-1/04-dios-te-habia-guitar.mp3',
    },
  },
  {
    id: 'sxb-05',
    name: 'Falseta 1 Soleá por Bulería',
    compases: 3,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/05-falseta-1.mp3',
    },
  },
  {
    id: 'sxb-06',
    name: 'Cuando tú me eches de menos',
    compases: 12,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/06-cuando-tu-main.mp3',
      guitar: '/audio/playlist-1/06-cuando-tu-guitar.mp3',
    },
  },
  {
    id: 'sxb-07',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/07-base-solea.mp3',
    },
  },
  {
    id: 'sxb-08',
    name: 'A pasar fatiga doble',
    compases: 6,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/08-a-pasar-fatiga-main.mp3',
      guitar: '/audio/playlist-1/08-a-pasar-fatiga-guitar.mp3',
    },
  },
  {
    id: 'sxb-09',
    name: 'Cierre Final Guitarra Soleá por Bulería',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/09-cierre-final.mp3',
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
      main: '/audio/playlist-2/01-compases-base.mp3',
    },
  },
  {
    id: 'bulerias-02',
    name: 'Águilas que vais volando + Sitio dónde te hablé',
    compases: 24,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/02-aguilas-main.mp3',
      guitar: '/audio/playlist-2/02-aguilas-guitar.mp3',
    },
  },
  {
    id: 'bulerias-03',
    name: 'Base por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/03-base-bulerias.mp3',
    },
  },
  {
    id: 'bulerias-04',
    name: 'Tiro piedras por la calle + Coletilla final',
    compases: 17,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/04-tiro-piedras-main.mp3',
      guitar: '/audio/playlist-2/04-tiro-piedras-guitar.mp3',
    },
  },
  {
    id: 'bulerias-05',
    name: 'Cierre Guitarra Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/05-cierre-guitarra.mp3',
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
