import { cn } from '../../lib/utils'
import { ALL_CONSOLES, type ConsoleType } from '../../types'

interface ConsoleFilterProps {
  selected: ConsoleType | 'all'
  onChange: (console: ConsoleType | 'all') => void
  gameCounts?: Record<string, number>
}

export function ConsoleFilter({ selected, onChange, gameCounts = {} }: ConsoleFilterProps) {
  const allCount = Object.values(gameCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* All */}
      <button
        onClick={() => onChange('all')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all shrink-0',
          selected === 'all'
            ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_10px_hsl(142_76%_52%/0.2)]'
            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
        )}
      >
        🎮
        <span>All</span>
        {allCount > 0 && (
          <span className={cn(
            'text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center font-mono',
            selected === 'all' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {allCount}
          </span>
        )}
      </button>

      {ALL_CONSOLES.map(console => {
        const count = gameCounts[console.id] || 0
        const isSelected = selected === console.id

        return (
          <button
            key={console.id}
            onClick={() => onChange(console.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all shrink-0',
              isSelected
                ? 'border-[var(--console-color)] text-[var(--console-color)] bg-[var(--console-bg)]'
                : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
            )}
            style={isSelected ? {
              '--console-color': console.color,
              '--console-bg': `${console.color}18`,
              boxShadow: `0 0 10px ${console.color}33`,
            } as React.CSSProperties : {}}
          >
            <span>{console.icon}</span>
            <span>{console.shortName}</span>
            {count > 0 && (
              <span
                className="text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center font-mono"
                style={isSelected
                  ? { background: `${console.color}25`, color: console.color }
                  : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                }
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
