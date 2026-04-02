import { openDB, type IDBPDatabase } from 'idb'
import { v4 as uuidv4 } from 'uuid'
import { Filesystem, Directory } from '@capacitor/filesystem'
import type { Game, SaveState, ConsoleType } from '../types'

const DB_NAME = 'retroplay-db'
const DB_VERSION = 1

interface RetroPlayDB {
  games: {
    key: string
    value: Game
    indexes: { 'by-console': string; 'by-title': string }
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
  if (game && game.romFileName) {
    try {
      await Filesystem.deleteFile({
        path: `roms/${game.romFileName}`,
        directory: Directory.Data
      })
    } catch(err) {
      console.warn("Failed deleting rom file: ", err)
    }
  }
  await db.delete('games', id)
}

// ── Local ROM saving directly to Capacitor Filesystem ───────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // The result is a data URL: "data:application/octet-stream;base64,......."
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function saveRom(file: File): Promise<string> {
  const base64 = await fileToBase64(file)
  
  // ensure directory exists
  try {
    await Filesystem.mkdir({ path: 'roms', directory: Directory.Data, recursive: true })
  } catch (e) {
    // ignores if exists
  }

  await Filesystem.writeFile({
    path: `roms/${file.name}`,
    data: base64,
    directory: Directory.Data
  })

  return file.name
}
