import { openDB, type IDBPDatabase } from 'idb'
import { v4 as uuidv4 } from 'uuid'
import type { Game, SaveState, ConsoleType } from '../types'

const DB_NAME = 'retroplay-db'
const DB_VERSION = 1

// Detect if running inside Capacitor (native Android/iOS)
function isCapacitorNative(): boolean {
  return typeof window !== 'undefined' &&
    'Capacitor' in window &&
    (window as Window & { Capacitor: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true
}

interface RetroPlayDB {
  games: {
    key: string
    value: Game
    indexes: { 'by-console': string; 'by-title': string }
  }
  roms: {
    key: string
    value: { id: string; data: ArrayBuffer; fileName: string }
  }
}

let dbPromise: Promise<IDBPDatabase<RetroPlayDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RetroPlayDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('games')) {
          const gameStore = db.createObjectStore('games', { keyPath: 'id' })
          gameStore.createIndex('by-console', 'console')
          gameStore.createIndex('by-title', 'title')
        }
        if (!db.objectStoreNames.contains('roms')) {
          db.createObjectStore('roms', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// ── Game Metadata CRUD ───────────────────────────────────────────────────────

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
  const game = await db.get('games', id)

  if (game?.romFileName) {
    if (isCapacitorNative()) {
      // On native: delete via Capacitor Filesystem
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        await Filesystem.deleteFile({
          path: `roms/${game.romFileName}`,
          directory: Directory.Data,
        })
      } catch (err) {
        console.warn('Failed deleting native ROM file:', err)
      }
    } else {
      // On web: delete from IndexedDB ROM store
      try {
        await db.delete('roms', game.id)
      } catch (err) {
        console.warn('Failed deleting IDB ROM:', err)
      }
    }
  }

  await db.delete('games', id)
}

// ── ROM Storage (platform-aware) ─────────────────────────────────────────────

/**
 * Save ROM file. Returns the romFileName (native) or game ID (web IDB).
 */
export async function saveRom(file: File, gameId?: string): Promise<string> {
  if (isCapacitorNative()) {
    return saveRomNative(file)
  }
  return saveRomWeb(file, gameId)
}

/** Native (Android/iOS): write base64 to Capacitor Filesystem */
async function saveRomNative(file: File): Promise<string> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const base64 = await fileToBase64(file)

  try {
    await Filesystem.mkdir({ path: 'roms', directory: Directory.Data, recursive: true })
  } catch {
    // directory may already exist
  }

  await Filesystem.writeFile({
    path: `roms/${file.name}`,
    data: base64,
    directory: Directory.Data,
  })

  return file.name
}

/** Web: store ArrayBuffer in IndexedDB, returns gameId as the key */
async function saveRomWeb(file: File, gameId?: string): Promise<string> {
  const db = await getDB()
  const buffer = await file.arrayBuffer()
  const id = gameId || uuidv4()

  await db.put('roms', { id, data: buffer, fileName: file.name })
  return id  // we store by id, not filename, on web
}

/**
 * Get a usable blob URL for the ROM (web).
 * Returns null on native (caller should use Filesystem URI instead).
 */
export async function getRomBlobUrl(gameId: string): Promise<string | null> {
  if (isCapacitorNative()) return null

  const db = await getDB()
  const record = await db.get('roms', gameId)
  if (!record?.data) return null

  const blob = new Blob([record.data], { type: 'application/octet-stream' })
  return URL.createObjectURL(blob)
}

/**
 * Get ROM as base64 string for native Capacitor reading.
 * On web, reads from IDB; on native reads from Filesystem.
 */
export async function getRomBase64(game: Game): Promise<string> {
  if (isCapacitorNative()) {
    // On native: read from Capacitor Filesystem
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const file = await Filesystem.readFile({
      path: `roms/${game.romFileName}`,
      directory: Directory.Data,
    })
    return file.data as string
  } else {
    // On web: read from IDB and convert ArrayBuffer → base64
    const db = await getDB()
    // Try by game.id first (web storage key), then by romFileName match
    const record = await db.get('roms', game.id)
    if (!record?.data) {
      throw new Error(`ROM not found in storage for game "${game.title}". Please re-upload.`)
    }
    return arrayBufferToBase64(record.data)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

// ── Save States (web only, IDB) ───────────────────────────────────────────────

export async function getSaveStates(_gameId: string): Promise<SaveState[]> {
  // TODO: implement save state storage
  return []
}
