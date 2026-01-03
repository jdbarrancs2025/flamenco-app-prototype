// src/data/playlists.ts
// Audio file paths use URL-safe names (lowercase, hyphens, no accents)

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
      main: '/audio/playlist-1/tablao-sxb/base-solea-por-bulerias-x2.wav',
    },
  },
  {
    id: 'sxb-02',
    name: 'Salida de Cante Soleá por Bulería',
    compases: 5,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/salida-sxb/salida-cante-solea-por-buleria.wav',
      guitar: '/audio/playlist-1/tablao-sxb/salida-sxb/salida-cante-solea-por-buleria-solo-guitarra.wav',
    },
  },
  {
    id: 'sxb-03',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/base-solea-por-bulerias.wav',
    },
  },
  {
    id: 'sxb-04',
    name: 'Dios te había dado sabiduría',
    compases: 7,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/dios-te-habia-dado-sabiduria/dios-te-habia-dado.wav',
      guitar: '/audio/playlist-1/tablao-sxb/dios-te-habia-dado-sabiduria/dios-te-habia-dado-solo-guitarra.wav',
    },
  },
  {
    id: 'sxb-05',
    name: 'Falseta 1 Soleá por Bulería',
    compases: 3,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/falseta-1.wav',
    },
  },
  {
    id: 'sxb-06',
    name: 'Cuando tú me eches de menos',
    compases: 12,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/cuando-tu-me-eches-de-menos/cuando-tu.wav',
      guitar: '/audio/playlist-1/tablao-sxb/cuando-tu-me-eches-de-menos/cuando-tu-solo-guitarra.wav',
    },
  },
  {
    id: 'sxb-07',
    name: 'Base Soleá por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/base-solea-por-bulerias.wav',
    },
  },
  {
    id: 'sxb-08',
    name: 'A pasar fatiga doble',
    compases: 6,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/a-pasar-fatiga/a-pasar-fatiga.wav',
      guitar: '/audio/playlist-1/tablao-sxb/a-pasar-fatiga/a-pasar-fatiga-solo-guitarra.wav',
    },
  },
  {
    id: 'sxb-09',
    name: 'Cierre Final Guitarra Soleá por Bulería',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-1/tablao-sxb/cierre-final-guitarra.wav',
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
      main: '/audio/playlist-2/fiesta-bulerias/base-por-bulerias-x2.wav',
    },
  },
  {
    id: 'bulerias-02',
    name: 'Águilas que vais volando + Sitio dónde te hablé',
    compases: 24,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/fiesta-bulerias/aguilas-que-vais-volando/aguilas-que-vais-volando-cante-y-percu.wav',
      guitar: '/audio/playlist-2/fiesta-bulerias/aguilas-que-vais-volando/aguilas-que-vais-volando-solo-guitarra.wav',
    },
  },
  {
    id: 'bulerias-03',
    name: 'Base por Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/fiesta-bulerias/base-por-bulerias.wav',
    },
  },
  {
    id: 'bulerias-04',
    name: 'Tiro piedras por la calle + Coletilla final',
    compases: 17,
    hasMuteableGuitar: true,
    audioFiles: {
      main: '/audio/playlist-2/fiesta-bulerias/tiro-piedras-por-la-calle/tiro-piedras-por-la-calle-cante-y-percu.wav',
      guitar: '/audio/playlist-2/fiesta-bulerias/tiro-piedras-por-la-calle/tiro-piedras-por-la-calle-solo-guitarra.wav',
    },
  },
  {
    id: 'bulerias-05',
    name: 'Cierre Guitarra Bulerías',
    compases: 1,
    hasMuteableGuitar: false,
    audioFiles: {
      main: '/audio/playlist-2/fiesta-bulerias/cierre-guitarra-bulerias.wav',
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
