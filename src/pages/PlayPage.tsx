import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Star, Info, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { EmulatorPlayer } from '../components/emulator/EmulatorPlayer'
import { Navbar } from '../components/layout/Navbar'
import { useGameLibrary } from '../contexts/GameLibraryContext'
import { CONSOLE_INFO } from '../types'
import { getRomBase64, getRomBlobUrl } from '../lib/storage'
import { cn } from '../lib/utils'

// Detect Capacitor native
function isNative(): boolean {
  return typeof window !== 'undefined' &&
    'Capacitor' in window &&
    (window as Window & { Capacitor: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true
}

export function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { games, favorites, toggleFavorite } = useGameLibrary()

  // We pass blob URL (web) or base64 (native) to the emulator
  const [romSource, setRomSource] = useState<{ type: 'url'; url: string } | { type: 'base64'; data: string } | null>(null)
  const [romError, setRomError] = useState<string | null>(null)
  const [isLoadingRom, setIsLoadingRom] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  const game = games.find(g => g.id === id)
  const isFav = favorites?.includes(id || '') ?? false
  const consoleInfo = game ? CONSOLE_INFO[game.console] : null

  useEffect(() => {
    if (!game) {
      if (!games.length) return
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
        if (isNative()) {
          // Native Android/iOS: read base64 from Capacitor Filesystem
          const base64 = await getRomBase64(game)
          setRomSource({ type: 'base64', data: base64 })
        } else {
          // Web: get blob URL from IndexedDB
          const blobUrl = await getRomBlobUrl(game.id)
          if (!blobUrl) {
            throw new Error('ROM not found in local storage. Please re-upload your ROM file.')
          }
          setRomSource({ type: 'url', url: blobUrl })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load ROM file.'
        setRomError(msg)
        console.error('[PlayPage] ROM load error:', err)
      } finally {
        setIsLoadingRom(false)
      }
    }

    loadRom()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, games.length])

  // Build the ROM URL for the emulator (blob URL or data URL)
  const romUrl = romSource
    ? romSource.type === 'url'
      ? romSource.url
      : `data:application/octet-stream;base64,${romSource.data}`
    : null

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hide navbar on mobile to maximise screen space */}
      <div className="hidden sm:block">
        <Navbar />
      </div>

      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        {game && consoleInfo && (
          <>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-base shrink-0"
              style={{ background: `${consoleInfo.color}22` }}
            >
              {consoleInfo.icon}
            </div>
            <h1 className="font-heading font-bold text-foreground text-sm truncate flex-1">{game.title}</h1>
            {toggleFavorite && (
              <button
                onClick={() => toggleFavorite(game.id)}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  isFav ? 'text-red-400' : 'text-muted-foreground'
                )}
              >
                <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            )}
          </>
        )}
      </div>

      <main className={cn(
        'flex-1 flex flex-col',
        'sm:max-w-5xl sm:mx-auto sm:w-full sm:px-6 sm:py-6'
      )}>

        {/* Desktop back + header */}
        <div className="hidden sm:flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={18} />
          </button>

          {game && consoleInfo && (
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
              {toggleFavorite && (
                <button
                  onClick={() => toggleFavorite(game.id)}
                  className={cn(
                    'ml-auto p-2 rounded-lg border transition-all',
                    isFav
                      ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-muted-foreground border-border hover:text-red-400 hover:border-red-400/30'
                  )}
                >
                  <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ROM error */}
        {romError && (
          <div className="mx-3 sm:mx-0 mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <span className="text-lg leading-none">⚠️</span>
            <div>
              <div className="font-medium mb-0.5">ROM Error</div>
              <div className="text-red-400/80 text-xs leading-relaxed">{romError}</div>
              <Link to="/upload" className="text-primary hover:underline text-xs mt-1 block">Re-upload ROM →</Link>
            </div>
          </div>
        )}

        {/* Emulator area */}
        {isLoadingRom ? (
          <div className={cn(
            'bg-muted/20 border border-border flex items-center justify-center',
            'mx-0 sm:mx-0 sm:rounded-xl',
            'aspect-video w-full'
          )}>
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

        {/* Game info — desktop only below emulator */}
        {game && !isLoadingRom && romUrl && (
          <div className="hidden sm:block mt-5 border border-border rounded-xl overflow-hidden">
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
      </main>
    </div>
  )
}
