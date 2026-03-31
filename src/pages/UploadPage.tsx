import { useLocation } from 'react-router-dom'
import { HardDrive, Shield, Cpu, Wifi } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { ROMUploader } from '../components/rom/ROMUploader'
import { ALL_CONSOLES, type ConsoleType } from '../types'

export function UploadPage() {
  const location = useLocation()
  const defaultConsole = location.state?.console as ConsoleType | undefined

  return (
    <div className="min-h-screen bg-background grid-scanlines">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading tracking-widest uppercase mb-5">
            <HardDrive size={12} />
            ROM Management
          </div>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-3">
            Upload Your ROM
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload ROM files you own to your local library. Files are stored securely on your device — never uploaded to our servers.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, title: 'Stays Local', desc: 'ROMs never leave your device' },
            { icon: Cpu, title: 'Fast Emulation', desc: 'EmulatorJS powered cores' },
            { icon: Wifi, title: 'Works Offline', desc: 'Play without internet' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                <Icon size={14} className="text-primary" />
              </div>
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {/* Uploader */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <ROMUploader defaultConsole={defaultConsole} />
        </div>

        {/* Supported consoles */}
        <div className="mt-8">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Supported Systems
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {ALL_CONSOLES.map(info => (
              <div
                key={info.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/40 border border-border/50 hover:border-border transition-all"
              >
                <span className="text-2xl">{info.icon}</span>
                <span className="text-xs font-medium text-foreground/70">{info.shortName}</span>
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {info.extensions.slice(0, 2).map(ext => (
                    <span key={ext} className="text-xs font-mono text-muted-foreground/60">{ext}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-8 p-5 rounded-xl bg-muted/20 border border-border/50">
          <div className="text-sm font-medium text-foreground/80 mb-2">⚖️ Important Legal Notice</div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <p>RetroPlay does not provide, distribute, or host ROM files of any kind.</p>
            <p>
              You may only upload ROM files that you have legally obtained — either by dumping from cartridges you own,
              or from officially licensed digital sources.
            </p>
            <p>Downloading ROMs from unauthorized sources is illegal in most jurisdictions.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
