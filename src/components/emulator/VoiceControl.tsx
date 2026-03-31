/**
 * VoiceControl — Placeholder for voice command gameplay.
 *
 * Future implementation:
 * - Use Web Speech API (SpeechRecognition) to listen for commands
 * - Map speech to gamepad button presses
 * - Commands: "jump", "fire", "pause", "save", "load", "start"
 *
 * This component scaffolds the UI and event hook, but does not
 * yet send actual button presses to EmulatorJS.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface VoiceCommand {
  phrase: string
  action: string
  key?: string
}

const VOICE_COMMANDS: VoiceCommand[] = [
  { phrase: 'jump', action: 'Press A/B button', key: 'z' },
  { phrase: 'fire', action: 'Press A button', key: 'x' },
  { phrase: 'pause', action: 'Press Start', key: 'Enter' },
  { phrase: 'save', action: 'Save state', key: 'F5' },
  { phrase: 'load', action: 'Load state', key: 'F7' },
  { phrase: 'left', action: 'Move left', key: 'ArrowLeft' },
  { phrase: 'right', action: 'Move right', key: 'ArrowRight' },
  { phrase: 'up', action: 'Move up', key: 'ArrowUp' },
  { phrase: 'down', action: 'Move down', key: 'ArrowDown' },
  { phrase: 'start', action: 'Press Start', key: 'Enter' },
  { phrase: 'select', action: 'Press Select', key: 'Shift' },
]

interface VoiceControlProps {
  enabled?: boolean
  onCommand?: (command: VoiceCommand) => void
}

export function VoiceControl({ enabled = false, onCommand }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [showCommands, setShowCommands] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setIsSupported(supported)
  }, [])

  const processCommand = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim()
    const matched = VOICE_COMMANDS.find(cmd =>
      lower.includes(cmd.phrase)
    )

    if (matched) {
      setLastCommand(matched.phrase)
      setTimeout(() => setLastCommand(null), 1500)

      // Simulate keypress if key is defined
      if (matched.key) {
        const event = new KeyboardEvent('keydown', { key: matched.key, bubbles: true })
        document.dispatchEvent(event)
        setTimeout(() => {
          const upEvent = new KeyboardEvent('keyup', { key: matched.key!, bubbles: true })
          document.dispatchEvent(upEvent)
        }, 100)
      }

      onCommand?.(matched)
    }
  }, [onCommand])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || (window as Window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          processCommand(event.results[i][0].transcript)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        console.error('[VoiceControl] Error:', event.error)
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      if (isListening) {
        // Auto-restart
        recognition.start()
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [isSupported, isListening, processCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const toggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  if (!enabled || !isSupported) return null

  return (
    <div className="relative">
      {/* Voice control button */}
      <button
        onClick={toggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
          isListening
            ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
        )}
      >
        {isListening ? <Mic size={12} className="animate-pulse" /> : <MicOff size={12} />}
        {isListening ? 'Listening...' : 'Voice Control'}
      </button>

      {/* Last command toast */}
      {lastCommand && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono whitespace-nowrap animate-fade-in shadow-lg">
          <Volume2 size={10} className="inline mr-1" />
          "{lastCommand}"
        </div>
      )}

      {/* Commands list toggle */}
      <button
        onClick={() => setShowCommands(!showCommands)}
        className="ml-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        {showCommands ? '▲' : '▼'} Commands
      </button>

      {showCommands && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-3 animate-fade-in">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Voice Commands
          </div>
          <div className="space-y-1">
            {VOICE_COMMANDS.map(cmd => (
              <div key={cmd.phrase} className="flex items-center justify-between text-xs">
                <span className="font-mono text-primary">"{cmd.phrase}"</span>
                <span className="text-muted-foreground">{cmd.action}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground/50">
            Uses Web Speech API. Requires microphone permission.
          </div>
        </div>
      )}
    </div>
  )
}
