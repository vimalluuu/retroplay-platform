import { Heart, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { GameCard } from '../components/game/GameCard'
import { useGameLibrary } from '../contexts/GameLibraryContext'

export function FavoritesPage() {
  const { games, favorites } = useGameLibrary()
  const favGames = games.filter(g => favorites.includes(g.id))

  return (
    <div className="min-h-screen bg-background grid-scanlines">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <Heart size={16} className="text-red-400" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">Favorites</h1>
            <p className="text-xs text-muted-foreground">{favGames.length} game{favGames.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {favGames.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Heart size={24} className="text-muted-foreground/40" />
            </div>
            <div>
              <div className="font-medium text-foreground/60 mb-1">No favorites yet</div>
              <div className="text-sm text-muted-foreground">Mark games as favorites by clicking the ❤️ on any game card</div>
            </div>
            <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-heading font-semibold uppercase tracking-wider hover:bg-primary/20 transition-all btn-retro">
              Browse Library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-children">
            {favGames.map(game => (
              <GameCard key={game.id} game={game} viewMode="grid" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
