import { useState, useEffect } from 'react'
import { Settings, Database, Cpu, Info, ExternalLink, Trash2, CheckCircle } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { useGameLibrary } from '../contexts/GameLibraryContext'
import { useAuth } from '../contexts/AuthContext'
import { getSetting, setSetting } from '../lib/storage'
import { cn } from '../lib/utils'

export function SettingsPage() {
  const { games, refreshLibrary } = useGameLibrary()
  const { user, signOut, isSupabaseReady } = useAuth()

  const [volume, setVolume] = useState(80)
  const [pixelFilter, setPixelFilter] = useState(true)
  const [showFps, setShowFps] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const localGames = games.filter(g => g.isLocal)
  const totalRomSize = localGames.reduce((acc, g) => acc + (g.romSize || 0), 0)

  useEffect(() => {
    const loadSettings = async () => {
      const v = await getSetting<number>('volume', 80)
      const p = await getSetting<boolean>('pixelFilter', true)
      const f = await getSetting<boolean>('showFps', false)
      setVolume(v)
      setPixelFilter(p)
      setShowFps(f)
    }
    loadSettings()
  }, [])

  const saveSettings = async () => {
    await Promise.all([
      setSetting('volume', volume),
      setSetting('pixelFilter', pixelFilter),
      setSetting('showFps', showFps),
    ])
    setSaveMessage('Settings saved!')
    setTimeout(() => setSaveMessage(''), 2500)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen bg-background grid-scanlines">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
            <Settings size={16} className="text-muted-foreground" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Settings</h1>
        </div>

        <div className="space-y-5">

          {/* Emulator Settings */}
          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Cpu size={15} className="text-primary" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground/80">
                Emulator
              </h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Default Volume</label>
                  <span className="text-sm font-mono text-primary">{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
                />
              </div>

              {/* Pixel filter */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Pixel Filter</div>
                  <div className="text-xs text-muted-foreground">Use image-rendering: pixelated for crisp pixels</div>
                </div>
                <button
                  onClick={() => setPixelFilter(!pixelFilter)}
                  className={cn(
                    'relative w-11 h-6 rounded-full border transition-all',
                    pixelFilter ? 'bg-primary/20 border-primary/40' : 'bg-muted border-border'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full transition-all',
                    pixelFilter ? 'left-[calc(100%-1.375rem)] bg-primary' : 'left-0.5 bg-muted-foreground/40'
                  )} />
                </button>
              </div>

              {/* Show FPS */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Show FPS Counter</div>
                  <div className="text-xs text-muted-foreground">Display frame rate during gameplay</div>
                </div>
                <button
                  onClick={() => setShowFps(!showFps)}
                  className={cn(
                    'relative w-11 h-6 rounded-full border transition-all',
                    showFps ? 'bg-primary/20 border-primary/40' : 'bg-muted border-border'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full transition-all',
                    showFps ? 'left-[calc(100%-1.375rem)] bg-primary' : 'left-0.5 bg-muted-foreground/40'
                  )} />
                </button>
              </div>
            </div>
          </section>

          {/* Storage info */}
          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Database size={15} className="text-accent" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground/80">
                Storage
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Games in library</span>
                <span className="text-foreground font-mono">{localGames.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total ROM storage</span>
                <span className="text-foreground font-mono">{formatSize(totalRomSize)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage type</span>
                <span className="text-foreground font-mono">IndexedDB (Local)</span>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-3">
                  All data is stored locally in your browser. Clearing browser data will remove your library.
                </div>
                <button
                  onClick={() => {
                    if (confirm('This will delete all local ROMs and game data. This cannot be undone. Continue?')) {
                      indexedDB.deleteDatabase('retroplay-db')
                      window.location.reload()
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/15 transition-all"
                >
                  <Trash2 size={13} />
                  Clear All Data
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Info size={15} className="text-muted-foreground" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground/80">
                Account & Sync
              </h2>
            </div>
            <div className="p-5">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{user.email}</span>
                  </div>
                  {user.username && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Username</span>
                      <span className="text-foreground">{user.username}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={signOut}
                      className="px-4 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {isSupabaseReady
                      ? 'Sign in to sync your library across devices.'
                      : 'Configure Supabase to enable cloud sync and cross-device support.'
                    }
                  </div>
                  {isSupabaseReady ? (
                    <a
                      href="/auth"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-all btn-retro"
                    >
                      Sign In
                    </a>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 font-mono">
                      Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* About */}
          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Info size={15} className="text-muted-foreground" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground/80">
                About
              </h2>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground font-mono">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Emulation</span>
                <a
                  href="https://emulatorjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  EmulatorJS
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">License</span>
                <span className="text-foreground">MIT</span>
              </div>
            </div>
          </section>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all btn-retro"
            >
              Save Settings
            </button>
            {saveMessage && (
              <div className="flex items-center gap-1.5 text-sm text-primary animate-fade-in">
                <CheckCircle size={14} />
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
