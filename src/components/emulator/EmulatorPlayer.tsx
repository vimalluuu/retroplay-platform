/**
 * EmulatorJS integration component.
 * Uses the public CDN for all cores (local cores folder is empty stubs).
 *
 * Key globals set before loader.js:
 *   EJS_player, EJS_core, EJS_gameUrl, EJS_pathtodata
 *
 * Mobile gamepad is enabled automatically on touch devices.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Maximize2, Minimize2, Volume2, VolumeX,
  Save, RotateCcw, Loader2, AlertTriangle
} from 'lucide-react'
import type { Game } from '../../types'
import { CONSOLE_INFO } from '../../types'
import { cn } from '../../lib/utils'

interface EmulatorPlayerProps {
  game: Game
  /** Blob URL (web) or data: URL (base64) for the ROM */
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
    EJS_mobileControls: boolean
    EJS_onGameStart: () => void
    EJS_onLoadError: () => void
    EJS_emulator: {
      saveState: () => void
      loadState: () => void
      screenshot: () => string
    }
  }
}

// Always use CDN — local /emulatorjs/data/cores folder has no actual core files
const EJS_CDN = 'https://cdn.emulatorjs.org/stable/data'

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

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
  const touchDevice = isTouchDevice()

  const cleanup = useCallback(() => {
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
    // Remove emulator DOM nodes injected by EJS
    if (containerRef.current) {
      containerRef.current.querySelectorAll('[id^="emulator"], canvas, #emulator, #game')
        .forEach(el => el.remove())
    }
    // Revoke any previous blob URLs on cleanup
    delete (window as Partial<Window>).EJS_emulator
  }, [])

  const initEmulator = useCallback(() => {
    if (!containerRef.current || !romUrl) return

    cleanup()
    setState('loading')
    setLoadProgress(0)
    setErrorMsg('')

    // Animate progress up to 85% while EJS loads; EJS_onGameStart pushes to 100%
    let prog = 0
    progressRef.current = setInterval(() => {
      prog += Math.random() * 5 + 1
      if (prog >= 85) {
        clearInterval(progressRef.current!)
        progressRef.current = null
        setLoadProgress(85)
      } else {
        setLoadProgress(Math.round(prog))
      }
    }, 300)

    // Mount point for EmulatorJS
    const gameDiv = document.createElement('div')
    gameDiv.id = 'game'
    gameDiv.style.cssText = 'width:100%;height:100%;'
    containerRef.current.appendChild(gameDiv)

    // ── Set all EJS globals before injecting loader.js ──────────────────────
    window.EJS_player        = '#game'
    window.EJS_core          = consoleInfo.core
    window.EJS_gameUrl       = romUrl
    window.EJS_pathtodata    = `${EJS_CDN}/`   // CDN — contains real core .wasm files
    window.EJS_startOnLoaded = true
    window.EJS_DEBUG_XX      = false
    window.EJS_language      = 'en-US'
    window.EJS_gameID        = 0
    window.EJS_volume        = isMuted ? 0 : 0.8
    window.EJS_color         = '#39d353'

    // Enable virtual gamepad on touch / mobile devices
    window.EJS_mobileControls = touchDevice

    // Keep EJS built-in controls minimal — we expose mute/save/fullscreen ourselves
    window.EJS_Buttons = {
      settings:     true,
      loadState:    true,
      saveState:    true,
      screenRecord: false,
      gamepad:      true,
      mute:         false,
      fullscreen:   false,
    }

    // ── Callbacks ────────────────────────────────────────────────────────────
    window.EJS_onGameStart = () => {
      if (progressRef.current) {
        clearInterval(progressRef.current)
        progressRef.current = null
      }
      setLoadProgress(100)
      setTimeout(() => setState('ready'), 400)
    }

    window.EJS_onLoadError = () => {
      cleanup()
      setState('error')
      setErrorMsg(
        'Failed to load the emulator core. ' +
        'This may be a network issue — EmulatorJS needs internet access to download the ' +
        `${consoleInfo.shortName} core on first load. Check your connection and try again.`
      )
    }

    // ── Inject loader.js from CDN ────────────────────────────────────────────
    const script = document.createElement('script')
    script.src   = `${EJS_CDN}/loader.js`
    script.async = true
    script.onerror = () => {
      cleanup()
      setState('error')
      setErrorMsg(
        'Could not reach EmulatorJS CDN. ' +
        'Please check your internet connection and try again.'
      )
    }
    document.body.appendChild(script)
    scriptRef.current = script
  }, [romUrl, consoleInfo, isMuted, touchDevice, cleanup])

  // Init when romUrl changes
  useEffect(() => {
    if (romUrl) initEmulator()
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [romUrl])

  // Fullscreen handler
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
    // EJS volume — best-effort
    if (window.EJS_emulator) {
      window.EJS_volume = isMuted ? 0.8 : 0
    }
  }, [isMuted])

  const handleSaveState = useCallback(() => {
    window.EJS_emulator?.saveState?.()
    onSaveState?.(0)
  }, [onSaveState])

  return (
    <div className={cn('flex flex-col', className)}>
      {/* ── Emulator viewport ────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        id="emulator-container"
        className={cn(
          'relative overflow-hidden bg-black w-full',
          // On mobile: take full width with no border/radius; on desktop: boxed
          'sm:rounded-xl sm:border sm:border-border/60',
          // Maintain 4:3 on desktop, but on phones let EJS define height
          'aspect-video',
          state === 'ready' && 'sm:border-primary/30',
          isFullscreen && '!rounded-none !border-0'
        )}
        style={{
          boxShadow: state === 'ready'
            ? '0 0 40px hsl(142 76% 52% / 0.12), 0 16px 48px hsl(0 0% 0% / 0.6)'
            : undefined,
        }}
      >
        {/* Loading overlay */}
        {state === 'loading' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 gap-5 px-6">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border-2 animate-pulse-glow"
              style={{
                background: `${consoleInfo.color}22`,
                borderColor: `${consoleInfo.color}55`,
              }}
            >
              {consoleInfo.icon}
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <div className="text-xs sm:text-sm font-heading tracking-widest text-foreground/80 uppercase">
                Loading {consoleInfo.shortName}
              </div>
              <div className="font-pixel text-[0.55rem] sm:text-xs text-primary truncate max-w-[240px]">
                {game.title}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-56 sm:w-64">
              <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${loadProgress}%`,
                    background: 'hsl(142 76% 52%)',
                    boxShadow: '0 0 10px hsl(142 76% 52% / 0.8)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[0.65rem] text-muted-foreground font-mono">
                  {loadProgress < 85 ? 'Fetching core from CDN...' : 'Starting emulator...'}
                </span>
                <span className="text-[0.65rem] text-primary font-mono font-bold">{loadProgress}%</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground/60 font-mono">
              <Loader2 size={12} className="animate-spin text-primary" />
              Requires internet for first-time core download
            </div>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 gap-4 px-6 text-center">
            <AlertTriangle size={36} className="text-red-400 shrink-0" />
            <div>
              <div className="font-heading text-red-400 text-sm uppercase tracking-wider mb-2">
                Emulator Error
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xs leading-relaxed">{errorMsg}</p>
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

        {/* Idle */}
        {state === 'idle' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
            <div className="text-muted-foreground text-xs font-mono">Initialising...</div>
          </div>
        )}
      </div>

      {/* ── Controls bar (below emulator) ────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-1 py-2 sm:py-1.5">
        {/* Game info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{consoleInfo.icon}</span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {consoleInfo.shortName}
          </span>
          <span className="text-muted-foreground/30 hidden sm:inline">•</span>
          <span className="text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">
            {game.title}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleMute}
            className={cn(
              'p-2 rounded-lg transition-all',
              isMuted
                ? 'text-muted-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={handleSaveState}
            disabled={state !== 'ready'}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Save State"
          >
            <Save size={15} />
          </button>

          <button
            onClick={initEmulator}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Restart"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ── Keyboard hint (desktop only, shown when ready) ────────────────── */}
      {state === 'ready' && !touchDevice && (
        <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-1 justify-center px-1 pb-1 animate-fade-in">
          {[
            { key: '← → ↑ ↓', desc: 'D-pad' },
            { key: 'Z', desc: 'B' },
            { key: 'X', desc: 'A' },
            { key: 'Enter', desc: 'Start' },
            { key: 'Shift', desc: 'Select' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">{key}</kbd>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Mobile gamepad notice ─────────────────────────────────────────── */}
      {state === 'ready' && touchDevice && (
        <div className="sm:hidden text-center py-1 animate-fade-in">
          <span className="text-xs text-muted-foreground/60 font-mono">
            Virtual gamepad active • Tap fullscreen for best experience
          </span>
        </div>
      )}
    </div>
  )
}
