/**
 * Capacitor integration for iOS/Android.
 * Provides filesystem access for ROM storage on mobile.
 *
 * Falls back gracefully to IndexedDB when running on web.
 */

// Feature detect Capacitor
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 'Capacitor' in window
}

export function isIOS(): boolean {
  return isCapacitor() && /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  return isCapacitor() && /Android/.test(navigator.userAgent)
}

export function isMobile(): boolean {
  return isIOS() || isAndroid()
}

// ── Capacitor Filesystem (lazy import to avoid web build errors) ──────────────

interface FilesystemPlugin {
  writeFile(options: {
    path: string
    data: string
    directory: string
    encoding?: string
  }): Promise<{ uri: string }>

  readFile(options: {
    path: string
    directory: string
    encoding?: string
  }): Promise<{ data: string }>

  deleteFile(options: {
    path: string
    directory: string
  }): Promise<void>

  mkdir(options: {
    path: string
    directory: string
    recursive: boolean
  }): Promise<void>

  getUri(options: {
    path: string
    directory: string
  }): Promise<{ uri: string }>
}

async function getFilesystem(): Promise<FilesystemPlugin | null> {
  if (!isCapacitor()) return null
  try {
    const { Filesystem } = await import('@capacitor/filesystem')
    return Filesystem as unknown as FilesystemPlugin
  } catch {
    return null
  }
}

async function getDirectory(): Promise<string> {
  if (!isCapacitor()) return ''
  try {
    const { Directory } = await import('@capacitor/filesystem')
    return Directory.Data as string
  } catch {
    return 'DATA'
  }
}

// ── ROM File Management (Capacitor) ──────────────────────────────────────────

export interface CapacitorROMResult {
  localPath: string
  uri: string
}

/**
 * Save a ROM file to local device storage (Capacitor only).
 * Returns the local URI that can be used with EmulatorJS.
 */
export async function saveROMToDevice(
  file: File,
  gameId: string
): Promise<CapacitorROMResult | null> {
  const fs = await getFilesystem()
  if (!fs) return null

  const dir = await getDirectory()
  const ext = file.name.split('.').pop() || 'rom'
  const path = `roms/${gameId}.${ext}`

  try {
    // Ensure /roms directory exists
    await fs.mkdir({ path: 'roms', directory: dir, recursive: true }).catch(() => {})

    // Convert file to base64
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach(b => (binary += String.fromCharCode(b)))
    const base64 = btoa(binary)

    // Write to device
    const result = await fs.writeFile({
      path,
      data: base64,
      directory: dir,
    })

    console.log('[Capacitor] ROM saved to:', result.uri)
    return { localPath: path, uri: result.uri }
  } catch (err) {
    console.error('[Capacitor] Failed to save ROM:', err)
    return null
  }
}

/**
 * Get the URI of a locally stored ROM file (Capacitor only).
 */
export async function getLocalROMUri(path: string): Promise<string | null> {
  const fs = await getFilesystem()
  if (!fs) return null

  const dir = await getDirectory()
  try {
    const result = await fs.getUri({ path, directory: dir })
    return result.uri
  } catch (err) {
    console.error('[Capacitor] Failed to get ROM URI:', err)
    return null
  }
}

/**
 * Delete a ROM from device storage (Capacitor only).
 */
export async function deleteLocalROM(path: string): Promise<void> {
  const fs = await getFilesystem()
  if (!fs) return

  const dir = await getDirectory()
  try {
    await fs.deleteFile({ path, directory: dir })
    console.log('[Capacitor] ROM deleted:', path)
  } catch (err) {
    console.error('[Capacitor] Failed to delete ROM:', err)
  }
}

// ── WebSocket stub (future multiplayer) ──────────────────────────────────────

/**
 * WebSocket connection manager.
 * Scaffold for future real-time multiplayer features.
 */
export class RetroPlayWS {
  private ws: WebSocket | null = null
  private url: string
  private reconnectDelay = 2000
  private maxReconnects = 5
  private reconnects = 0

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[WS] Connected to RetroPlay multiplayer server')
      this.reconnects = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (err) {
        console.warn('[WS] Invalid message:', err)
      }
    }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      if (this.reconnects < this.maxReconnects) {
        setTimeout(() => {
          this.reconnects++
          this.connect()
        }, this.reconnectDelay)
      }
    }

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err)
    }
  }

  private handleMessage(data: Record<string, unknown>): void {
    // TODO: handle multiplayer game state sync
    console.log('[WS] Message:', data)
  }

  send(type: string, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected, message dropped:', type)
      return
    }
    this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }))
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}
