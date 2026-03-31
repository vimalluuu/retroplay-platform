// ── Core Game Types ──────────────────────────────────────────────────────────

export type ConsoleType = 'nes' | 'snes' | 'sega-genesis' | 'gameboy' | 'gameboy-color' | 'gameboy-advance' | 'n64' | 'ps1' | 'arcade'

export interface Game {
  id: string
  title: string
  console: ConsoleType
  description?: string
  thumbnailUrl?: string
  year?: number
  genre?: string[]
  players?: number
  rating?: number
  romPath?: string        // local path (Capacitor) or blob URL
  romFileName?: string    // original filename
  romSize?: number        // bytes
  isLocal: boolean        // user-uploaded vs demo
  createdAt: string
  updatedAt: string
}

export interface SaveState {
  id: string
  gameId: string
  slot: number
  thumbnail?: string      // base64 screenshot
  data?: string           // base64 save data
  createdAt: string
}

export interface RecentlyPlayed {
  gameId: string
  playedAt: string
  duration?: number       // seconds played
}

export interface GameLibraryState {
  games: Game[]
  favorites: string[]     // game IDs
  recentlyPlayed: RecentlyPlayed[]
  saveStates: SaveState[]
}

// ── Console metadata ─────────────────────────────────────────────────────────

export interface ConsoleInfo {
  id: ConsoleType
  name: string
  shortName: string
  core: string            // EmulatorJS core name
  extensions: string[]    // valid ROM extensions
  color: string
  icon: string
  year: string
}

export const CONSOLE_INFO: Record<ConsoleType, ConsoleInfo> = {
  'nes': {
    id: 'nes',
    name: 'Nintendo Entertainment System',
    shortName: 'NES',
    core: 'nes',
    extensions: ['.nes'],
    color: '#e60012',
    icon: '🎮',
    year: '1983',
  },
  'snes': {
    id: 'snes',
    name: 'Super Nintendo Entertainment System',
    shortName: 'SNES',
    core: 'snes',
    extensions: ['.sfc', '.smc'],
    color: '#512aaa',
    icon: '🕹️',
    year: '1990',
  },
  'sega-genesis': {
    id: 'sega-genesis',
    name: 'Sega Genesis / Mega Drive',
    shortName: 'Sega Genesis',
    core: 'segaMD',
    extensions: ['.md', '.bin', '.gen'],
    color: '#1a6fa1',
    icon: '🦔',
    year: '1988',
  },
  'gameboy': {
    id: 'gameboy',
    name: 'Game Boy',
    shortName: 'Game Boy',
    core: 'gb',
    extensions: ['.gb'],
    color: '#9bbc0f',
    icon: '📱',
    year: '1989',
  },
  'gameboy-color': {
    id: 'gameboy-color',
    name: 'Game Boy Color',
    shortName: 'GBC',
    core: 'gbc',
    extensions: ['.gbc'],
    color: '#6b3fa0',
    icon: '🌈',
    year: '1998',
  },
  'gameboy-advance': {
    id: 'gameboy-advance',
    name: 'Game Boy Advance',
    shortName: 'GBA',
    core: 'gba',
    extensions: ['.gba'],
    color: '#8b1a8b',
    icon: '🎯',
    year: '2001',
  },
  'n64': {
    id: 'n64',
    name: 'Nintendo 64',
    shortName: 'N64',
    core: 'n64',
    extensions: ['.n64', '.z64', '.v64'],
    color: '#e60012',
    icon: '🎲',
    year: '1996',
  },
  'ps1': {
    id: 'ps1',
    name: 'PlayStation 1',
    shortName: 'PS1',
    core: 'psx',
    extensions: ['.bin', '.cue', '.iso'],
    color: '#003791',
    icon: '🔷',
    year: '1994',
  },
  'arcade': {
    id: 'arcade',
    name: 'Arcade',
    shortName: 'Arcade',
    core: 'mame2003',
    extensions: ['.zip'],
    color: '#ff6b00',
    icon: '🕹️',
    year: '1970s+',
  },
}

export const ALL_CONSOLES = Object.values(CONSOLE_INFO)

// ── User / Auth types ────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  username?: string
  avatarUrl?: string
  createdAt: string
}

// ── ROM Storage types ────────────────────────────────────────────────────────

export interface LocalROM {
  id: string
  fileName: string
  fileSize: number
  console: ConsoleType
  blobUrl?: string         // web: Object URL
  localPath?: string       // Capacitor: file path
  uploadedAt: string
}
