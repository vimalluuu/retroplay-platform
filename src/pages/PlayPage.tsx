import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Star, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { EmulatorPlayer } from '../components/emulator/EmulatorPlayer'
import { Navbar } from '../components/layout/Navbar'
import { useGameLibrary } from '../contexts/GameLibraryContext'
import { CONSOLE_INFO } from '../types'
import { cn } from '../lib/utils'

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { games, favorites, toggleFavorite, getGameRomUrl, markPlayed } = useGameLibrary()

  const [romUrl, setRomUrl] = useState<string | null>(null)
  const [romError, setRomError] = useState<string | null>(null)
  const [isLoadingRom, setIsLoadingRom] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  const game = games.find(g => g.id === id)
  const isFav = favorites.includes(id || '')
  const consoleInfo = game ? CONSOLE_INFO[game.console] : null

  useEffect(() => {
    if (!game) {
      if (!games.length) return // Still loading
      navigate('/', { replace: true })
      return
    }

    if (!game.isLocal) {
      navigate('/upload', { state: { console: game.console }, replace: true })
      return
    }

    const loadRom = async () => {
      setIsLoadingRom(true)
      setRomError(null)
      try {
        const url = await getGameRomUrl(game.id)
        if (!url) {
          setRomError('ROM file not found. It may have been deleted. Please re-upload.')
        } else {
          setRomUrl(url)
          // Record play
          await markPlayed(game.id)
        }
      } catch (err) {
        setRomError('Failed to load ROM file.')
        console.error(err)
      } finally {
        setIsLoadingRom(false)
      }
    }

    loadRom()
  }, [game, games.length, id, navigate, getGameRomUrl, markPlayed])

  if (!game && !isLoadingRom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <div className="font-heading text-foreground/60">Game not found</div>
          <Link to="/" className="text-primary text-sm mt-2 block hover:underline">Back to Library</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={18} />
          </button>

          {game && consoleInfo ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ background: `${consoleInfo.color}22` }}
              >
                {consoleInfo.icon}
              </div>
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-foreground text-lg truncate">{game.title}</h1>
                <div className="flex items-center gap-2">
                  <span
                    className="retro-badge"
                    style={{ background: `${consoleInfo.color}22`, color: consoleInfo.color, border: `1px solid ${consoleInfo.color}44` }}
                  >
                    {consoleInfo.shortName}
                  </span>
                  {game.year && <span className="text-xs text-muted-foreground font-mono">{game.year}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => toggleFavorite(game.id)}
                  className={cn(
                    'p-2 rounded-lg border transition-all',
                    isFav
                      ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-muted-foreground border-border hover:text-red-400 hover:border-red-400/30'
                  )}
                >
                  <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-8 bg-muted/30 rounded-lg flex-1 animate-pulse" />
          )}
        </div>

        {/* ROM error */}
        {romError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-medium mb-0.5">ROM Error</div>
              <div className="text-red-400/80">{romError}</div>
              <Link to="/upload" className="text-primary hover:underline text-xs mt-1 block">Re-upload ROM →</Link>
            </div>
          </div>
        )}

        {/* Loading ROM */}
        {isLoadingRom ? (
          <div className="aspect-video w-full bg-muted/20 rounded-xl border border-border flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm font-mono">Loading ROM...</span>
            </div>
          </div>
        ) : romUrl && game ? (
          <EmulatorPlayer
            game={game}
            romUrl={romUrl}
            onSaveState={(slot) => console.log(`Save state slot ${slot}`)}
          />
        ) : null}

        {/* Game info accordion */}
        {game && (
          <div className="mt-6 border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Info size={14} className="text-muted-foreground" />
                Game Information
              </div>
              {showInfo ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>

            {showInfo && (
              <div className="p-4 pt-0 border-t border-border animate-fade-in">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {game.year && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Year</span>
                        <span className="text-foreground font-mono">{game.year}</span>
                      </div>
                    )}
                    {game.players && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Players</span>
                        <span className="text-foreground font-mono">{game.players}</span>
                      </div>
                    )}
                    {game.genre && game.genre.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Genre</span>
                        <span className="text-foreground">{game.genre.join(', ')}</span>
                      </div>
                    )}
                    {game.rating && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating</span>
                        <span className="flex items-center gap-1 text-foreground">
                          <Star size={11} fill="#fbbf24" className="text-yellow-400" />
                          {game.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {game.romFileName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ROM File</span>
                        <span className="text-foreground font-mono text-xs truncate max-w-[160px]">{game.romFileName}</span>
                      </div>
                    )}
                    {game.romSize && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">File Size</span>
                        <span className="text-foreground font-mono text-xs">
                          {(game.romSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>

                  {game.description && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description</div>
                      <p className="text-sm text-foreground/70 leading-relaxed">{game.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls reference */}
        <div className="mt-4 p-4 rounded-xl bg-muted/20 border border-border/50">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Default Keyboard Controls
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { keys: ['↑', '↓', '←', '→'], desc: 'D-Pad / Move' },
              { keys: ['Z'], desc: 'Button B (NES) / ○ (PS)' },
              { keys: ['X'], desc: 'Button A (NES) / × (PS)' },
              { keys: ['A'], desc: 'Button Y / □' },
              { keys: ['S'], desc: 'Button X / △' },
              { keys: ['Enter'], desc: 'Start' },
              { keys: ['Shift'], desc: 'Select' },
              { keys: ['Q', 'W'], desc: 'L / R Shoulder' },
              { keys: ['F11'], desc: 'Fullscreen' },
            ].map(({ keys, desc }) => (
              <div key={desc} className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {keys.map(k => (
                    <kbd key={k} className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs text-foreground/80">
                      {k}
                    </kbd>
                  ))}
                </div>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground/50">
            Controls can be customized in the emulator settings (gear icon inside emulator).
          </div>
        </div>
      </main>
    </div>
  )
}
