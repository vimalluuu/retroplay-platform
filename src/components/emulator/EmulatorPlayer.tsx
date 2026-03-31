/**
 * EmulatorJS integration component.
 * Dynamically loads EmulatorJS from CDN and initializes with game ROM.
 *
 * EmulatorJS config docs: https://emulatorjs.org/docs/
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Maximize2, Minimize2, Volume2, VolumeX, Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'
import type { Game } from '../../types'
import { CONSOLE_INFO } from '../../types'
import { cn } from '../../lib/utils'

interface EmulatorPlayerProps {
  game: Game
  romUrl: string
  onSaveState?: (slot: number) => void
  className?: string
}

type EmulatorState = 'idle' | 'loading' | 'ready' | 'error'

declare global {
  interface Window {
    EJS_player: string
    EJS_core: string
    EJS_gameUrl: string
    EJS_pathtodata: string
    EJS_startOnLoaded: boolean
    EJS_DEBUG_XX: boolean
    EJS_language: string
    EJS_gameID: number
    EJS_volume: number
    EJS_color: string
    EJS_Buttons: Record<string, boolean>
    EJS_onGameStart: () => void
    EJS_onLoadError: () => void
    EJS_emulator: {
      saveState: () => void
      loadState: () => void
      screenshot: () => string
    }
  }
}

// EmulatorJS CDN paths
const EMULATORJS_CDN = 'https://cdn.emulatorjs.org/stable/data'

export function EmulatorPlayer({ game, romUrl, onSaveState, className }: EmulatorPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<EmulatorState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const consoleInfo = CONSOLE_INFO[game.console]

  const cleanup = useCallback(() => {
    // Remove injected script
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }

    // Clear progress interval
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }

    // Remove any EJS-created elements inside container
    if (containerRef.current) {
      const ejsElements = containerRef.current.querySelectorAll('[id^="emulator"], canvas, #emulator')
      ejsElements.forEach(el => el.remove())
    }

    // Clean global EJS vars
    delete (window as Partial<Window>).EJS_emulator
  }, [])

  const initEmulator = useCallback(() => {
    if (!containerRef.current || !romUrl) return

    cleanup()
    setState('loading')
    setLoadProgress(0)
    setErrorMsg('')

    // Simulate loading progress
    let prog = 0
    progressRef.current = setInterval(() => {
      prog += Math.random() * 8
      if (prog >= 90) {
        if (progressRef.current) clearInterval(progressRef.current)
        setLoadProgress(90)
      } else {
        setLoadProgress(Math.round(prog))
      }
    }, 200)

    // Create the emulator div inside our container
    const emulatorDiv = document.createElement('div')
    emulatorDiv.id = 'game'
    emulatorDiv.style.cssText = 'width:100%;height:100%;'
    containerRef.current.appendChild(emulatorDiv)

    // Configure EmulatorJS globals (must be set before loader.js is loaded)
    window.EJS_player = '#game'
    window.EJS_core = consoleInfo.core
    window.EJS_gameUrl = romUrl
    window.EJS_pathtodata = `${EMULATORJS_CDN}/`
    window.EJS_startOnLoaded = true
    window.EJS_DEBUG_XX = false
    window.EJS_language = 'en-US'
    window.EJS_gameID = 0
    window.EJS_volume = isMuted ? 0 : 0.8
    window.EJS_color = '#39d353'  // neon green to match theme

    // Hide default EJS UI buttons we manage ourselves
    window.EJS_Buttons = {
      settings: false,
      loadState: false,
      saveState: false,
      screenRecord: false,
      gamepad: true,
      mute: false,
      fullscreen: false,
    }

    // Callbacks
    window.EJS_onGameStart = () => {
      if (progressRef.current) clearInterval(progressRef.current)
      setLoadProgress(100)
      setTimeout(() => setState('ready'), 300)
    }

    window.EJS_onLoadError = () => {
      cleanup()
      setState('error')
      setErrorMsg('Failed to load the emulator core. The ROM file may be unsupported or corrupted.')
    }

    // Load EmulatorJS loader script
    const script = document.createElement('script')
    script.src = `${EMULATORJS_CDN}/loader.js`
    script.async = true
    script.onerror = () => {
      cleanup()
      setState('error')
      setErrorMsg('Failed to load EmulatorJS. Please check your internet connection.')
    }
    document.body.appendChild(script)
    scriptRef.current = script
  }, [romUrl, consoleInfo.core, isMuted, cleanup])

  useEffect(() => {
    initEmulator()
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [romUrl])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (window.EJS_emulator) {
        // EJS doesn't expose volume directly, this is a workaround
        window.EJS_volume = newMuted ? 0 : 0.8
      }
      return newMuted
    })
  }, [])

  const handleSaveState = useCallback((slot = 0) => {
    if (window.EJS_emulator?.saveState) {
      window.EJS_emulator.saveState()
      onSaveState?.(slot)
    }
  }, [onSaveState])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Emulator window */}
      <div
        ref={containerRef}
        id="emulator-container"
        className={cn(
          'relative rounded-xl overflow-hidden border border-border/60',
          'bg-black aspect-video w-full max-w-4xl mx-auto',
          'scanlines',
          state === 'ready' && 'border-primary/30',
          isFullscreen && 'rounded-none border-0'
        )}
        style={{
          boxShadow: state === 'ready'
            ? '0 0 40px hsl(142 76% 52% / 0.15), 0 20px 60px hsl(0 0% 0% / 0.6)'
            : '0 20px 60px hsl(0 0% 0% / 0.4)',
        }}
      >
        {/* Loading overlay */}
        {state === 'loading' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-6">
            {/* Console icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border animate-pulse-glow"
              style={{
                background: `${consoleInfo.color}22`,
                borderColor: `${consoleInfo.color}44`,
              }}
            >
              {consoleInfo.icon}
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-sm font-heading tracking-wider text-foreground/80">
                LOADING {consoleInfo.shortName.toUpperCase()}
              </div>
              <div className="font-pixel text-xs text-primary">{game.title}</div>
            </div>

            {/* Progress bar */}
            <div className="w-64">
              <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${loadProgress}%`,
                    boxShadow: '0 0 8px hsl(142 76% 52% / 0.8)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground font-mono">Loading emulator core...</span>
                <span className="text-xs text-primary font-mono">{loadProgress}%</span>
              </div>
            </div>

            <Loader2 size={16} className="text-primary animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 gap-4 px-6">
            <AlertTriangle size={40} className="text-red-400" />
            <div className="text-center">
              <div className="font-heading text-red-400 text-sm uppercase tracking-wider mb-2">Emulator Error</div>
              <p className="text-muted-foreground text-sm max-w-sm">{errorMsg}</p>
            </div>
            <button
              onClick={initEmulator}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-all btn-retro"
            >
              <RotateCcw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* Idle state */}
        {state === 'idle' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
            <div className="text-muted-foreground text-sm font-mono">Ready to start...</div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground/70">
            {consoleInfo.icon} {consoleInfo.shortName}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{game.title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className={cn(
              'p-2 rounded-lg border text-sm transition-all',
              isMuted
                ? 'bg-muted/50 border-border text-muted-foreground'
                : 'bg-muted/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={() => handleSaveState(0)}
            disabled={state !== 'ready'}
            className="p-2 rounded-lg border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Save State (Slot 0)"
          >
            <Save size={14} />
          </button>

          <button
            onClick={initEmulator}
            className="p-2 rounded-lg border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Restart"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Keyboard controls hint */}
      {state === 'ready' && (
        <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
          {[
            { key: 'Arrow Keys', desc: 'D-pad' },
            { key: 'Z / A', desc: 'B / A' },
            { key: 'X / S', desc: 'Select / Start' },
            { key: 'F11', desc: 'Fullscreen' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">{key}</kbd>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
