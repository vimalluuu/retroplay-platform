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
  isLoading: boolean

  addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Game>
  uploadROM: (file: File, console: ConsoleType, meta?: Partial<Game>) => Promise<Game>
  removeGame: (id: string) => Promise<void>
  refreshLibrary: () => Promise<void>

  searchGames: (query: string) => Game[]
  filterByConsole: (console: ConsoleType | 'all') => Game[]
}

const GameLibraryContext = createContext<GameLibraryContextType | null>(null)

export function GameLibraryProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([])
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
      const filtered = prev.filter(g => g.id !== `demo-${game.console}-1` || !g.isLocal === false)
      return [newGame, ...filtered]
    })
    return newGame
  }, [])

  const uploadROM = useCallback(async (
    file: File,
    consoleType: ConsoleType,
    meta: Partial<Game> = {}
  ): Promise<Game> => {
    // 1. Save ROM to local filesystem via Capacitor
    const romFileName = await saveRom(file)

    const titleFromFile = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 2. Save game metadata locally
    const game = await saveGame({
      title: meta.title || titleFromFile,
      console: consoleType,
      description: meta.description || '',
      thumbnailUrl: meta.thumbnailUrl || '',
      year: meta.year,
      genre: meta.genre || [],
      players: meta.players || 1,
      rating: meta.rating,
      romFileName: romFileName,
      romSize: file.size,
      isLocal: true,
      romPath: romFileName // Keeping it for compatibility
    })

    setGames(prev => {
      const filtered = prev.filter(g => !(g.id === `demo-${consoleType}-1`))
      return [game, ...filtered]
    })

    return game
  }, [])

  const removeGame = useCallback(async (id: string) => {
    await deleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
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
      isLoading,
      addGame,
      uploadROM,
      removeGame,
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
