import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Heart, Trash2, Upload, Star } from 'lucide-react'
import type { Game } from '../../types'
import { CONSOLE_INFO } from '../../types'
import { useGameLibrary } from '../../contexts/GameLibraryContext'
import { cn } from '../../lib/utils'

interface GameCardProps {
  game: Game
  viewMode?: 'grid' | 'list'
}

export function GameCard({ game, viewMode = 'grid' }: GameCardProps) {
  const navigate = useNavigate()
  const { favorites, toggleFavorite, removeGame } = useGameLibrary()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [imgError, setImgError] = useState(false)

  const consoleInfo = CONSOLE_INFO[game.console]
  const isFav = favorites.includes(game.id)
  const isDemo = !game.isLocal
  const hasRom = game.isLocal && Boolean(game.romPath)

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDemo) {
      navigate('/upload', { state: { console: game.console } })
    } else {
      navigate(`/play/${game.id}`)
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(game.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showConfirmDelete) {
      removeGame(game.id)
    } else {
      setShowConfirmDelete(true)
      setTimeout(() => setShowConfirmDelete(false), 3000)
    }
  }

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'game-card group flex items-center gap-4 p-4 rounded-xl',
          'bg-card border border-border hover:border-primary/30',
          'cursor-pointer'
        )}
        onClick={() => !isDemo && navigate(`/play/${game.id}`)}
      >
        {/* Thumbnail */}
        <div
          className="w-16 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: `${consoleInfo.color}22` }}
        >
          {game.thumbnailUrl && !imgError ? (
            <img
              src={game.thumbnailUrl}
              alt={game.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl">{consoleInfo.icon}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{game.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="retro-badge text-foreground/70"
              style={{ background: `${consoleInfo.color}22`, border: `1px solid ${consoleInfo.color}44` }}
            >
              {consoleInfo.shortName}
            </span>
            {game.year && <span className="text-xs text-muted-foreground">{game.year}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            className={cn(
              'p-2 rounded-lg transition-all',
              isFav ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
            )}
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>

          {hasRom ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-all btn-retro"
            >
              <Play size={12} fill="currentColor" />
              Play
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm hover:border-primary/30 hover:text-primary transition-all btn-retro"
            >
              <Upload size={12} />
              Upload
            </button>
          )}

          {game.isLocal && (
            <button
              onClick={handleDelete}
              className={cn(
                'p-2 rounded-lg transition-all',
                showConfirmDelete
                  ? 'text-red-400 bg-red-400/20 border border-red-400/40'
                  : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
              )}
              title={showConfirmDelete ? 'Click again to confirm' : 'Delete'}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className={cn(
        'game-card group rounded-xl bg-card border border-border',
        'flex flex-col overflow-hidden'
      )}
      onClick={() => !isDemo && navigate(`/play/${game.id}`)}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${consoleInfo.color}22, ${consoleInfo.color}11)` }}
      >
        {game.thumbnailUrl && !imgError ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl opacity-60">{consoleInfo.icon}</span>
            {isDemo && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-dashed border-muted-foreground/30">
                <Upload size={10} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">Upload ROM</span>
              </div>
            )}
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {hasRom ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg btn-retro"
            >
              <Play size={14} fill="currentColor" />
              PLAY
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted border border-border text-foreground font-heading font-semibold text-sm uppercase tracking-wider hover:border-primary/50 transition-all btn-retro"
            >
              <Upload size={14} />
              Upload ROM
            </button>
          )}
        </div>

        {/* Console badge */}
        <div className="absolute top-2 left-2">
          <span
            className="retro-badge text-[0.45rem] font-bold"
            style={{
              background: `${consoleInfo.color}dd`,
              color: '#fff',
              boxShadow: `0 0 8px ${consoleInfo.color}66`,
            }}
          >
            {consoleInfo.shortName}
          </span>
        </div>

        {/* Favorite button */}
        {!isDemo && (
          <button
            onClick={handleFavorite}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-lg transition-all',
              'opacity-0 group-hover:opacity-100',
              isFav
                ? 'text-red-400 bg-background/80 opacity-100'
                : 'text-foreground/60 bg-background/60 hover:text-red-400'
            )}
          >
            <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Rating stars */}
        {game.rating && game.rating > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-background/70 rounded-md px-1.5 py-0.5">
            <Star size={9} fill="#fbbf24" className="text-yellow-400" />
            <span className="text-xs text-foreground/80 font-mono">{game.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Game info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {game.title}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            {game.year && (
              <span className="text-xs text-muted-foreground font-mono">{game.year}</span>
            )}
            {game.genre && game.genre.length > 0 && (
              <span className="text-xs text-muted-foreground/60">• {game.genre[0]}</span>
            )}
          </div>

          {game.isLocal && (
            <button
              onClick={handleDelete}
              className={cn(
                'p-1 rounded transition-all opacity-0 group-hover:opacity-100',
                showConfirmDelete
                  ? 'text-red-400'
                  : 'text-muted-foreground/40 hover:text-red-400'
              )}
              title={showConfirmDelete ? 'Click again to confirm delete' : 'Delete game'}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
