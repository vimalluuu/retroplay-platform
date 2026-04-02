import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Upload, Gamepad2, Sparkles } from 'lucide-react'
import { GameCard } from '../components/game/GameCard'
import { ConsoleFilter } from '../components/game/ConsoleFilter'
import { Navbar } from '../components/layout/Navbar'
import { useGameLibrary } from '../contexts/GameLibraryContext'
import { CONSOLE_INFO, type ConsoleType } from '../types'
import { cn } from '../lib/utils'

type ViewMode = 'grid' | 'list'
type SortMode = 'title' | 'console'

export function LibraryPage() {
  const { games, isLoading, searchGames } = useGameLibrary()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConsole, setSelectedConsole] = useState<ConsoleType | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortMode, setSortMode] = useState<SortMode>('title')

  // Count games per console
  const gameCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    games.forEach(g => {
      counts[g.console] = (counts[g.console] || 0) + 1
    })
    return counts
  }, [games])

  // Filter & sort
  const filteredGames = useMemo(() => {
    let list = searchQuery ? searchGames(searchQuery) : games

    // Console filter
    if (selectedConsole !== 'all') {
      list = list.filter(g => g.console === selectedConsole)
    }

    // Sort
    switch (sortMode) {
      case 'title':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'console':
        list = [...list].sort((a, b) => a.console.localeCompare(b.console))
        break
    }

    return list
  }, [games, searchQuery, selectedConsole, sortMode, searchGames])

  const localGames = games.filter(g => g.isLocal)

  return (
    <div className="min-h-screen bg-background grid-scanlines">
      <Navbar onSearchChange={setSearchQuery} searchValue={searchQuery} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* Hero section */}
        {localGames.length === 0 && (
          <div className="mb-10 rounded-2xl border border-border/50 bg-card/50 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading tracking-widest uppercase mb-6">
                <Sparkles size={12} />
                Welcome to RetroPlay
              </div>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-4">
                Your Retro Gaming
                <span className="block neon-text-green animate-flicker">Arcade</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Upload your own ROM files and play classic games from NES, SNES, Game Boy, Sega Genesis and more — all directly from your device storage.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Link
                  to="/upload"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all btn-retro shadow-[0_0_30px_hsl(142_76%_52%/0.4)]"
                >
                  <Upload size={15} />
                  Upload Your First ROM
                </Link>
                <a
                  href="https://emulatorjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted/50 border border-border text-muted-foreground font-medium text-sm hover:text-foreground hover:border-primary/30 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Library section */}
        <section>
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-primary" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground/80">
                Game Library
              </h2>
              <span className="text-xs text-muted-foreground font-mono">({filteredGames.length})</span>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              {/* Sort */}
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
                className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground/80 focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="title">Title A-Z</option>
                <option value="console">Console</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-all',
                    viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-all',
                    viewMode === 'list' ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Console filter */}
          <div className="mb-5">
            <ConsoleFilter
              selected={selectedConsole}
              onChange={setSelectedConsole}
              gameCounts={gameCounts}
            />
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4'
                : 'flex flex-col gap-2'
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl bg-muted/30 border border-border/50 animate-pulse',
                    viewMode === 'grid' ? 'aspect-[4/3]' : 'h-16'
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Gamepad2 size={24} className="text-muted-foreground/40" />
              </div>
              <div>
                <div className="font-medium text-foreground/60 mb-1">
                  {searchQuery
                    ? `No games found for "${searchQuery}"`
                    : selectedConsole !== 'all'
                      ? `No ${CONSOLE_INFO[selectedConsole].shortName} games yet`
                      : 'No games in your library'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'Upload a ROM to get started'}
                </div>
              </div>
              {!searchQuery && (
                <Link
                  to="/upload"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-heading font-semibold uppercase tracking-wider hover:bg-primary/20 transition-all btn-retro"
                >
                  <Upload size={13} />
                  Upload ROM
                </Link>
              )}
            </div>
          ) : (
            // Game grid / list
            <div className={cn(
              'stagger-children',
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                : 'flex flex-col gap-2'
            )}>
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} viewMode={viewMode} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
