import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileCode2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { useGameLibrary } from '../../contexts/GameLibraryContext'
import { ALL_CONSOLES, CONSOLE_INFO, type ConsoleType } from '../../types'
import { cn } from '../../lib/utils'

interface ROMUploaderProps {
  defaultConsole?: ConsoleType
  onSuccess?: (gameId: string) => void
  compact?: boolean
}

type UploadState = 'idle' | 'detecting' | 'uploading' | 'success' | 'error'

export function ROMUploader({ defaultConsole, onSuccess, compact = false }: ROMUploaderProps) {
  const { uploadROM } = useGameLibrary()
  const navigate = useNavigate()

  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedConsole, setDetectedConsole] = useState<ConsoleType | null>(defaultConsole || null)
  const [manualConsole, setManualConsole] = useState<ConsoleType | null>(defaultConsole || null)
  const [customTitle, setCustomTitle] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedGameId, setUploadedGameId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect console from file extension
  const detectConsoleFromFile = useCallback((file: File): ConsoleType | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    for (const info of ALL_CONSOLES) {
      if (info.extensions.includes(ext)) {
        return info.id
      }
    }
    return null
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setUploadState('detecting')
    setErrorMsg('')
    setUploadedGameId(null)

    // Auto-detect console
    const detected = detectConsoleFromFile(file)
    setDetectedConsole(detected)

    if (!manualConsole && detected) {
      setManualConsole(detected)
    }

    // Auto-fill title from filename
    const titleFromFile = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    setCustomTitle(titleFromFile)

    setUploadState('idle')
  }, [detectConsoleFromFile, manualConsole])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !manualConsole) return

    setUploadState('uploading')
    setErrorMsg('')

    try {
      const game = await uploadROM(selectedFile, manualConsole, {
        title: customTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
      })
      setUploadedGameId(game.id)
      setUploadState('success')
      onSuccess?.(game.id)
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
  }, [selectedFile, manualConsole, customTitle, uploadROM, onSuccess])

  const handleReset = () => {
    setSelectedFile(null)
    setDetectedConsole(null)
    setManualConsole(defaultConsole || null)
    setCustomTitle('')
    setUploadState('idle')
    setErrorMsg('')
    setUploadedGameId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const activeConsole = manualConsole || detectedConsole
  const consoleInfo = activeConsole ? CONSOLE_INFO[activeConsole] : null

  // All accepted extensions
  const acceptedExtensions = ALL_CONSOLES.flatMap(c => c.extensions).join(',')

  if (uploadState === 'success' && uploadedGameId) {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-8 text-center', compact && 'py-4')}>
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse-glow">
          <CheckCircle size={28} className="text-primary" />
        </div>
        <div>
          <div className="font-heading font-semibold text-foreground text-lg">ROM Uploaded!</div>
          <div className="text-sm text-muted-foreground mt-1">
            {customTitle || selectedFile?.name} is ready to play
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/play/${uploadedGameId}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all btn-retro"
          >
            ▶ Play Now
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl bg-muted border border-border text-muted-foreground text-sm hover:text-foreground transition-all"
          >
            Upload Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', compact && 'gap-3')}>
      {/* Drop zone */}
      {!selectedFile ? (
        <div
          className={cn(
            'rom-dropzone rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragging && 'active',
            compact && 'p-5'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedExtensions}
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center',
              isDragging ? 'border-primary bg-primary/5' : '',
              compact ? 'w-12 h-12' : 'w-16 h-16'
            )}>
              <Upload size={compact ? 20 : 28} className={cn('transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div>
              <div className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>
                {isDragging ? 'Drop your ROM here' : 'Drop ROM file or click to browse'}
              </div>
              {!compact && (
                <div className="text-sm text-muted-foreground mt-1">
                  NES, SNES, GBA, GB, GBC, Genesis, N64, PS1...
                </div>
              )}
            </div>
            {!compact && (
              <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                {['.nes', '.sfc', '.smc', '.gba', '.gb', '.gbc', '.md', '.bin'].map(ext => (
                  <span key={ext} className="text-xs font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                    {ext}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // File selected state
        <div className="flex flex-col gap-3">
          {/* File info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: consoleInfo ? `${consoleInfo.color}22` : 'hsl(var(--muted))' }}
            >
              <FileCode2 size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{selectedFile.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{formatFileSize(selectedFile.size)}</span>
                {detectedConsole && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-primary font-mono">{CONSOLE_INFO[detectedConsole].shortName} detected</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          {/* Game title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Game Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder="Enter game title..."
              className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/80 transition-all"
            />
          </div>

          {/* Console selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Console
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ALL_CONSOLES.map(info => (
                <button
                  key={info.id}
                  onClick={() => setManualConsole(info.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-sm transition-all',
                    manualConsole === info.id
                      ? 'text-[var(--c)] bg-[var(--cbg)] border-[var(--cb)]'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                  )}
                  style={manualConsole === info.id ? {
                    '--c': info.color,
                    '--cbg': `${info.color}18`,
                    '--cb': `${info.color}55`,
                  } as React.CSSProperties : {}}
                >
                  <span>{info.icon}</span>
                  <span className="text-xs font-medium">{info.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {uploadState === 'error' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && uploadState !== 'success' && (
        <button
          onClick={handleUpload}
          disabled={!manualConsole || uploadState === 'uploading'}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3 rounded-xl font-heading font-semibold text-sm uppercase tracking-wider transition-all btn-retro',
            manualConsole && uploadState !== 'uploading'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(142_76%_52%/0.3)]'
              : 'bg-muted border border-border text-muted-foreground cursor-not-allowed'
          )}
        >
          {uploadState === 'uploading' ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving ROM...
            </>
          ) : (
            <>
              <Upload size={15} />
              Add to Library
            </>
          )}
        </button>
      )}

      {/* Legal notice */}
      {!compact && (
        <div className="text-xs text-muted-foreground/60 text-center leading-relaxed">
          Only upload ROM files you own or have legal rights to use.
          RetroPlay does not distribute or host copyrighted ROMs.
        </div>
      )}
    </div>
  )
}
