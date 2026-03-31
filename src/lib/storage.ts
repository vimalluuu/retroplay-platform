/**
 * Local ROM & game data storage using IndexedDB (via idb).
 * Works on both web and Capacitor (iOS/Android).
 */

import { openDB, type IDBPDatabase } from 'idb'
import { v4 as uuidv4 } from 'uuid'
import type { Game, SaveState, RecentlyPlayed, LocalROM, ConsoleType } from '../types'

const DB_NAME = 'retroplay-db'
const DB_VERSION = 1

interface RetroPlayDB {
  games: {
    key: string
    value: Game
    indexes: { 'by-console': string; 'by-title': string }
  }
  roms: {
    key: string
    value: LocalROM & { fileData?: ArrayBuffer }
    indexes: { 'by-console': string }
  }
  saveStates: {
    key: string
    value: SaveState
    indexes: { 'by-game': string }
  }
  recentlyPlayed: {
    key: string
    value: RecentlyPlayed
    indexes: { 'by-date': string }
  }
  favorites: {
    key: string
    value: { gameId: string }
  }
  settings: {
    key: string
    value: unknown
  }
}

let dbPromise: Promise<IDBPDatabase<RetroPlayDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RetroPlayDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Games store
        if (!db.objectStoreNames.contains('games')) {
          const gameStore = db.createObjectStore('games', { keyPath: 'id' })
          gameStore.createIndex('by-console', 'console')
          gameStore.createIndex('by-title', 'title')
        }

        // ROMs store (with binary data)
        if (!db.objectStoreNames.contains('roms')) {
          const romStore = db.createObjectStore('roms', { keyPath: 'id' })
          romStore.createIndex('by-console', 'console')
        }

        // Save states
        if (!db.objectStoreNames.contains('saveStates')) {
          const saveStore = db.createObjectStore('saveStates', { keyPath: 'id' })
          saveStore.createIndex('by-game', 'gameId')
        }

        // Recently played
        if (!db.objectStoreNames.contains('recentlyPlayed')) {
          const recentStore = db.createObjectStore('recentlyPlayed', { keyPath: 'gameId' })
          recentStore.createIndex('by-date', 'playedAt')
        }

        // Favorites
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'gameId' })
        }

        // Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })
  }
  return dbPromise
}

// ── Game CRUD ────────────────────────────────────────────────────────────────

export async function getAllGames(): Promise<Game[]> {
  const db = await getDB()
  return db.getAll('games')
}

export async function getGamesByConsole(console: ConsoleType): Promise<Game[]> {
  const db = await getDB()
  return db.getAllFromIndex('games', 'by-console', console)
}

export async function getGame(id: string): Promise<Game | undefined> {
  const db = await getDB()
  return db.get('games', id)
}

export async function saveGame(game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> {
  const db = await getDB()
  const now = new Date().toISOString()
  const newGame: Game = {
    ...game,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }
  await db.put('games', newGame)
  return newGame
}

export async function updateGame(id: string, updates: Partial<Game>): Promise<Game | null> {
  const db = await getDB()
  const existing = await db.get('games', id)
  if (!existing) return null
  const updated: Game = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  await db.put('games', updated)
  return updated
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('games', id)
  // Also delete associated ROM
  await db.delete('roms', id)
  // Delete save states
  const saves = await db.getAllFromIndex('saveStates', 'by-game', id)
  for (const save of saves) {
    await db.delete('saveStates', save.id)
  }
}

// ── ROM Storage ──────────────────────────────────────────────────────────────

export async function saveROM(
  file: File,
  console: ConsoleType,
  gameId?: string
): Promise<{ rom: LocalROM; blobUrl: string }> {
  const db = await getDB()
  const buffer = await file.arrayBuffer()
  const id = gameId || uuidv4()

  const rom: LocalROM = {
    id,
    fileName: file.name,
    fileSize: file.size,
    console,
    uploadedAt: new Date().toISOString(),
  }

  // Store binary data in IDB
  await db.put('roms', { ...rom, fileData: buffer })

  // Create object URL for immediate use
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const blobUrl = URL.createObjectURL(blob)
  rom.blobUrl = blobUrl

  return { rom, blobUrl }
}

export async function getROMBlobUrl(id: string): Promise<string | null> {
  const db = await getDB()
  const romRecord = await db.get('roms', id)
  if (!romRecord?.fileData) return null

  const blob = new Blob([romRecord.fileData], { type: 'application/octet-stream' })
  return URL.createObjectURL(blob)
}

export async function deleteROM(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('roms', id)
}

export async function getROMInfo(id: string): Promise<LocalROM | undefined> {
  const db = await getDB()
  const record = await db.get('roms', id)
  if (!record) return undefined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fileData: _fd, ...rom } = record
  return rom
}

// ── Save States ──────────────────────────────────────────────────────────────

export async function getSaveStates(gameId: string): Promise<SaveState[]> {
  const db = await getDB()
  return db.getAllFromIndex('saveStates', 'by-game', gameId)
}

export async function saveSaveState(state: Omit<SaveState, 'id' | 'createdAt'>): Promise<SaveState> {
  const db = await getDB()
  const newState: SaveState = {
    ...state,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  await db.put('saveStates', newState)
  return newState
}

export async function deleteSaveState(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('saveStates', id)
}

// ── Recently Played ──────────────────────────────────────────────────────────

export async function getRecentlyPlayed(limit = 20): Promise<RecentlyPlayed[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('recentlyPlayed', 'by-date')
  return all.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()).slice(0, limit)
}

export async function recordPlay(gameId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('recentlyPlayed', gameId)
  await db.put('recentlyPlayed', {
    gameId,
    playedAt: new Date().toISOString(),
    duration: (existing?.duration || 0),
  })
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<string[]> {
  const db = await getDB()
  const all = await db.getAll('favorites')
  return all.map(f => f.gameId)
}

export async function toggleFavorite(gameId: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('favorites', gameId)
  if (existing) {
    await db.delete('favorites', gameId)
    return false
  } else {
    await db.put('favorites', { gameId })
    return true
  }
}

export async function isFavorite(gameId: string): Promise<boolean> {
  const db = await getDB()
  return Boolean(await db.get('favorites', gameId))
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB()
  const value = await db.get('settings', key)
  return (value as T) ?? defaultValue
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('settings', value, key)
}
