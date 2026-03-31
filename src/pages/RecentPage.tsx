import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { GameCard } from '../components/game/GameCard'
import { useGameLibrary } from '../contexts/GameLibraryContext'

export function RecentPage() {
  const { games, recentlyPlayed } = useGameLibrary()
  const recentGames = recentlyPlayed
    .map(id => games.find(g => g.id === id))
    .filter(Boolean) as typeof games

  return (
    <div className="min-h-screen bg-background grid-scanlines">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Clock size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">Recently Played</h1>
            <p className="text-xs text-muted-foreground">{recentGames.length} game{recentGames.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {recentGames.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Clock size={24} className="text-muted-foreground/40" />
            </div>
            <div>
              <div className="font-medium text-foreground/60 mb-1">No recent games</div>
              <div className="text-sm text-muted-foreground">Start playing to see your history here</div>
            </div>
            <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-heading font-semibold uppercase tracking-wider hover:bg-primary/20 transition-all btn-retro">
              Browse Library
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 stagger-children">
            {recentGames.map((game, idx) => (
              <div key={game.id} className="flex items-center gap-3">
                <div className="w-7 text-xs font-mono text-muted-foreground/50 text-right shrink-0">
                  #{idx + 1}
                </div>
                <GameCard game={game} viewMode="list" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
