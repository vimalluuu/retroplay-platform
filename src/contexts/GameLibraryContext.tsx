import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Game, ConsoleType } from '../types'
import {
  getAllGames,
  saveGame,
  deleteGame,
  saveRom,
} from '../lib/storage'
import { DEMO_GAMES } from '../lib/demo-games'

interface GameLibraryContextType {
  games: Game[]
  favorites: string[]
  isLoading: boolean

  addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Game>
  uploadROM: (file: File, console: ConsoleType, meta?: Partial<Game>) => Promise<Game>
  removeGame: (id: string) => Promise<void>
  toggleFavorite: (id: string) => void
  refreshLibrary: () => Promise<void>

  searchGames: (query: string) => Game[]
  filterByConsole: (console: ConsoleType | 'all') => Game[]
}

const GameLibraryContext = createContext<GameLibraryContextType | null>(null)

const FAVORITES_KEY = 'retroplay_favorites'

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveFavorites(favs: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

export function GameLibraryProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([])
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)
  const [isLoading, setIsLoading] = useState(true)

  const refreshLibrary = useCallback(async () => {
    try {
      const stored = await getAllGames()
      const storedIds = new Set(stored.map(g => g.id))
      const demoFiltered = DEMO_GAMES.filter(d => !storedIds.has(d.id))
      setGames([...stored, ...demoFiltered])
    } catch (err) {
      console.error('Failed to load library:', err)
      setGames(DEMO_GAMES)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshLibrary()
  }, [refreshLibrary])

  const addGame = useCallback(async (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGame = await saveGame(game)
    setGames(prev => {
      const filtered = prev.filter(g => g.id !== `demo-${game.console}-1`)
      return [newGame, ...filtered]
    })
    return newGame
  }, [])

  const uploadROM = useCallback(async (
    file: File,
    consoleType: ConsoleType,
    meta: Partial<Game> = {}
  ): Promise<Game> => {
    const titleFromFile = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // First save game metadata to get the ID
    const game = await saveGame({
      title: meta.title || titleFromFile,
      console: consoleType,
      description: meta.description || '',
      thumbnailUrl: meta.thumbnailUrl || '',
      year: meta.year,
      genre: meta.genre || [],
      players: meta.players || 1,
      rating: meta.rating,
      romFileName: file.name,
      romSize: file.size,
      isLocal: true,
      romPath: '',   // will be updated below
    })

    // Save ROM binary — pass game.id so web IDB uses it as the key
    await saveRom(file, game.id)

    // Update game with the romPath = game.id (IDB key on web, filename on native)
    const updatedGame: Game = { ...game, romPath: game.id }

    setGames(prev => {
      const filtered = prev.filter(g => !(g.id === `demo-${consoleType}-1`))
      return [updatedGame, ...filtered]
    })

    return updatedGame
  }, [])

  const removeGame = useCallback(async (id: string) => {
    await deleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
    setFavorites(prev => {
      const next = prev.filter(fid => fid !== id)
      saveFavorites(next)
      return next
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      saveFavorites(next)
      return next
    })
  }, [])

  const searchGames = useCallback((query: string): Game[] => {
    if (!query.trim()) return games
    const q = query.toLowerCase()
    return games.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.genre?.some(genre => genre.toLowerCase().includes(q))
    )
  }, [games])

  const filterByConsole = useCallback((consoleFilter: ConsoleType | 'all'): Game[] => {
    if (consoleFilter === 'all') return games
    return games.filter(g => g.console === consoleFilter)
  }, [games])

  return (
    <GameLibraryContext.Provider value={{
      games,
      favorites,
      isLoading,
      addGame,
      uploadROM,
      removeGame,
      toggleFavorite,
      refreshLibrary,
      searchGames,
      filterByConsole,
    }}>
      {children}
    </GameLibraryContext.Provider>
  )
}

export function useGameLibrary() {
  const ctx = useContext(GameLibraryContext)
  if (!ctx) throw new Error('useGameLibrary must be used within GameLibraryProvider')
  return ctx
}
