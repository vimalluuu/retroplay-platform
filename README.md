# 🎮 RetroPlay Platform

A full-stack retro gaming platform for web and iOS. Play classic NES, SNES, Game Boy, Sega Genesis games using EmulatorJS — with full offline support and Capacitor iOS app support.

---

## Features

- **Game Library** — Browse, search, and filter by console
- **ROM Upload** — Upload your own ROM files (stored locally on device)
- **EmulatorJS Integration** — NES, SNES, GBA, GB, GBC, Genesis, N64, PS1, Arcade
- **Offline Support** — Service Worker caches EmulatorJS cores
- **iOS App** — Capacitor wraps the React app for native iOS
- **Save States** — Save and load game progress (per slot)
- **Favorites & Recently Played** — Track your gaming history
- **Supabase Auth** — Optional cloud sync (works fully offline too)
- **IndexedDB Storage** — ROMs stored locally in browser/device

---

## Quick Start (Web)

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

---

## Environment Variables (Optional)

Create `.env.local` to enable cloud sync:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app works completely without Supabase — all data is stored locally.

---

## iOS App Setup (Capacitor)

### Prerequisites

- macOS with Xcode 15+
- Apple Developer account (for device deployment)
- Node.js + npm/bun
- CocoaPods (`sudo gem install cocoapods`)

### Steps

```bash
# 1. Install Capacitor
bun add @capacitor/core @capacitor/cli @capacitor/ios
bun add @capacitor/filesystem @capacitor/status-bar @capacitor/splash-screen

# 2. Build the web app
bun run build

# 3. Initialize Capacitor (first time only)
npx cap init

# 4. Add iOS platform
npx cap add ios

# 5. Sync web build to iOS
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

### In Xcode

1. Select your Team in **Signing & Capabilities**
2. Set Bundle ID to `com.retroplay.app`
3. Set deployment target to **iOS 15+**
4. Build and run on simulator or device

### Updating iOS App

```bash
bun run build       # Rebuild web app
npx cap sync ios    # Sync to iOS
npx cap open ios    # Open Xcode to run
```

---

## ROM Management

### How ROMs Are Stored

**Web:** ROM binaries are stored in **IndexedDB** using the `idb` library. Each ROM is stored as an `ArrayBuffer` and served via `URL.createObjectURL()` when loaded into EmulatorJS.

**iOS (Capacitor):** ROMs are written to the app's `Documents/roms/` directory using `@capacitor/filesystem`. The file URI is passed directly to EmulatorJS.

### Loading a Local ROM into EmulatorJS

```javascript
// 1. User selects file
const file = await fileInput.files[0]

// 2. Create object URL (web)
const romUrl = URL.createObjectURL(file)

// 3. Configure EmulatorJS
window.EJS_player = '#game'
window.EJS_core = 'nes'       // or 'snes', 'gba', 'gb', etc.
window.EJS_gameUrl = romUrl    // blob: URL or capacitor:// URI
window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
window.EJS_startOnLoaded = true

// 4. Load EmulatorJS
const script = document.createElement('script')
script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
document.body.appendChild(script)
```

---

## EmulatorJS Core Mapping

| Console | Core Name | Extensions |
|---------|-----------|------------|
| NES | `nes` | `.nes` |
| SNES | `snes` | `.sfc`, `.smc` |
| Game Boy | `gb` | `.gb` |
| Game Boy Color | `gbc` | `.gbc` |
| Game Boy Advance | `gba` | `.gba` |
| Sega Genesis | `segaMD` | `.md`, `.bin`, `.gen` |
| Nintendo 64 | `n64` | `.n64`, `.z64`, `.v64` |
| PlayStation 1 | `psx` | `.bin`, `.cue`, `.iso` |
| Arcade (MAME) | `mame2003` | `.zip` |

---

## Supabase Setup (Optional)

For cloud sync, create a Supabase project and run this SQL:

```sql
-- Games metadata
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  console TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  year INTEGER,
  genre TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  game_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their games" ON games
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);
```

---

## Project Structure

```
/
├── src/
│   ├── App.tsx                    # Router + providers
│   ├── main.tsx                   # Entry point + SW registration
│   ├── index.css                  # Gaming dark theme
│   ├── types/index.ts             # All TypeScript types
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Supabase auth
│   │   └── GameLibraryContext.tsx # Local game library
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + helpers
│   │   ├── storage.ts             # IndexedDB (ROMs + saves)
│   │   ├── capacitor.ts           # Capacitor filesystem
│   │   ├── demo-games.ts          # Demo game placeholders
│   │   └── sw-register.ts         # Service Worker registration
│   ├── components/
│   │   ├── layout/Navbar.tsx      # App navigation
│   │   ├── game/GameCard.tsx      # Game tile component
│   │   ├── game/ConsoleFilter.tsx # Console filter bar
│   │   ├── emulator/EmulatorPlayer.tsx  # EmulatorJS wrapper
│   │   └── rom/ROMUploader.tsx    # ROM upload UI
│   └── pages/
│       ├── LibraryPage.tsx        # Main game library
│       ├── PlayPage.tsx           # Emulator + game info
│       ├── UploadPage.tsx         # ROM upload page
│       ├── FavoritesPage.tsx      # Favorites list
│       ├── RecentPage.tsx         # Recently played
│       ├── AuthPage.tsx           # Sign in / Sign up
│       └── SettingsPage.tsx       # App settings
├── public/
│   ├── sw.js                      # Service Worker (offline)
│   └── manifest.json              # PWA manifest
├── capacitor.config.ts            # Capacitor iOS config
└── README.md                      # This file
```

---

## Legal Notice

RetroPlay does **not** provide, distribute, or host ROM files of any kind.

You are solely responsible for ensuring you have the legal right to use any ROM files you upload. Only upload ROM files that you have personally dumped from cartridges you own, or obtained from legally licensed digital sources.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Emulation | EmulatorJS (CDN) |
| Local Storage | IndexedDB via `idb` |
| Mobile | Capacitor v5 (iOS + Android) |
| Auth/DB | Supabase (optional) |
| Offline | Service Worker + Cache API |
| PWA | Web App Manifest |

---

## Keyboard Controls (Default)

| Key | Action |
|-----|--------|
| Arrow Keys | D-Pad |
| Z | B Button (NES) / Circle (PS) |
| X | A Button (NES) / Cross (PS) |
| A | Y Button |
| S | X Button |
| Enter | Start |
| Shift | Select |
| Q / W | L / R Shoulder |
| F11 | Fullscreen |

Controls can be remapped in the emulator settings.
