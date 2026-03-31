import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Game, ConsoleType } from '../types'
import {
  getAllGames,
  saveGame,
  updateGame,
  deleteGame,
  saveROM,
  getROMBlobUrl,
  getFavorites,
  toggleFavorite as toggleFavoriteDB,
  getRecentlyPlayed,
  recordPlay,
} from '../lib/storage'
import { DEMO_GAMES } from '../lib/demo-games'

interface GameLibraryContextType {
  games: Game[]
  favorites: string[]
  recentlyPlayed: string[]
  isLoading: boolean

  addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Game>
  uploadROM: (file: File, console: ConsoleType, meta?: Partial<Game>) => Promise<Game>
  removeGame: (id: string) => Promise<void>
  getGameRomUrl: (id: string) => Promise<string | null>
  toggleFavorite: (id: string) => Promise<void>
  markPlayed: (id: string) => Promise<void>
  refreshLibrary: () => Promise<void>

  searchGames: (query: string) => Game[]
  filterByConsole: (console: ConsoleType | 'all') => Game[]
}

const GameLibraryContext = createContext<GameLibraryContextType | null>(null)

export function GameLibraryProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshLibrary = useCallback(async () => {
    try {
      const [stored, favs, recent] = await Promise.all([
        getAllGames(),
        getFavorites(),
        getRecentlyPlayed(),
      ])

      // Merge stored games with demo placeholders
      const storedIds = new Set(stored.map(g => g.id))
      const demoFiltered = DEMO_GAMES.filter(d => !storedIds.has(d.id))
      setGames([...stored, ...demoFiltered])
      setFavorites(favs)
      setRecentlyPlayed(recent.map(r => r.gameId))
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
      // Replace demo placeholder if same console
      const filtered = prev.filter(g => g.id !== `demo-${game.console}-1` || !g.isLocal === false)
      return [newGame, ...filtered]
    })
    return newGame
  }, [])

  const uploadROM = useCallback(async (
    file: File,
    console: ConsoleType,
    meta: Partial<Game> = {}
  ): Promise<Game> => {
    // Save ROM binary to IDB
    const { rom, blobUrl } = await saveROM(file, console)

    // Detect title from filename
    const titleFromFile = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Save game metadata
    const game = await saveGame({
      title: meta.title || titleFromFile,
      console,
      description: meta.description || '',
      thumbnailUrl: meta.thumbnailUrl || '',
      year: meta.year,
      genre: meta.genre || [],
      players: meta.players || 1,
      rating: meta.rating,
      romPath: rom.id,
      romFileName: file.name,
      romSize: file.size,
      isLocal: true,
    })

    // Update rom record with game ID
    await saveROM(file, console, game.id)

    const gameWithUrl: Game = { ...game, romPath: blobUrl }
    setGames(prev => {
      // Remove demo placeholder for this console
      const filtered = prev.filter(g => !(g.id === `demo-${console}-1`))
      return [gameWithUrl, ...filtered]
    })

    return gameWithUrl
  }, [])

  const removeGame = useCallback(async (id: string) => {
    await deleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
    setFavorites(prev => prev.filter(fid => fid !== id))
  }, [])

  const getGameRomUrl = useCallback(async (id: string): Promise<string | null> => {
    const game = games.find(g => g.id === id)
    if (!game) return null

    // If romPath is already a blob URL or HTTP URL, return it directly
    if (game.romPath?.startsWith('blob:') || game.romPath?.startsWith('http')) {
      return game.romPath
    }

    // Otherwise look up in IDB by game ID
    return getROMBlobUrl(id)
  }, [games])

  const toggleFavorite = useCallback(async (id: string) => {
    const isFav = await toggleFavoriteDB(id)
    setFavorites(prev =>
      isFav ? [...prev, id] : prev.filter(fid => fid !== id)
    )
  }, [])

  const markPlayed = useCallback(async (id: string) => {
    await recordPlay(id)
    setRecentlyPlayed(prev => [id, ...prev.filter(gid => gid !== id)].slice(0, 20))
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

  const filterByConsole = useCallback((console: ConsoleType | 'all'): Game[] => {
    if (console === 'all') return games
    return games.filter(g => g.console === console)
  }, [games])

  return (
    <GameLibraryContext.Provider value={{
      games,
      favorites,
      recentlyPlayed,
      isLoading,
      addGame,
      uploadROM,
      removeGame,
      getGameRomUrl,
      toggleFavorite,
      markPlayed,
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
