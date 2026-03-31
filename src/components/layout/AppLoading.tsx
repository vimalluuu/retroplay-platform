import { Gamepad2 } from 'lucide-react'

export function AppLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse-glow">
            <Gamepad2 size={28} className="text-primary" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="font-heading font-800 text-xl tracking-wider neon-text-green">RETRO</span>
          <span className="font-heading font-800 text-xl tracking-wider text-foreground/70">PLAY</span>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{
            width: '60%',
            animation: 'loading-bar 1.5s ease-in-out infinite',
            boxShadow: '0 0 8px hsl(142 76% 52% / 0.8)',
          }}
        />
      </div>

      <div className="font-mono text-xs text-muted-foreground tracking-widest animate-pulse">
        LOADING...
      </div>
    </div>
  )
}
