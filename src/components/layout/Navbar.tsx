import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Gamepad2, Search, Upload, Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavbarProps {
  onSearchChange?: (q: string) => void
  searchValue?: string
}

export function Navbar({ onSearchChange, searchValue = '' }: NavbarProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Library', icon: Gamepad2 },
    { to: '/upload', label: 'Upload ROM', icon: Upload },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
      {/* Top scanline decoration */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-all group-hover:shadow-[0_0_12px_hsl(142_76%_52%/0.4)]">
              <Gamepad2 size={18} className="text-primary" />
            </div>
            <div>
              <span className="font-heading font-800 text-sm tracking-wider neon-text-green">RETRO</span>
              <span className="font-heading font-800 text-sm tracking-wider text-foreground/80">PLAY</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  location.pathname === to
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          {onSearchChange && (
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchValue}
                  onChange={e => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/80 transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* User area */}
          <div className="flex items-center gap-2">
            <Link
              to="/upload"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all btn-retro"
            >
              <Upload size={13} />
              Upload ROM
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile search */}
            {onSearchChange && (
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchValue}
                  onChange={e => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            )}
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  location.pathname === to
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
