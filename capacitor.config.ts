import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.retroplay.app',
  appName: 'RetroPlay',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For local dev, point to Vite dev server:
    // url: 'http://192.168.1.100:5173',
    // cleartext: true,
  },
  plugins: {
    // Filesystem: allow local ROM storage
    Filesystem: {
      iosScheme: 'capacitor',
    },

    // SplashScreen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0d1117',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // StatusBar (iOS/Android)
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0d1117',
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },

  ios: {
    // Allow loading EmulatorJS from CDN
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#0d1117',
    // WebView config for EmulatorJS performance
    preferredContentMode: 'mobile',
    // Allow file: URLs for local ROMs
    limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    backgroundColor: '#0d1117',
    allowMixedContent: true,
  },
}

export default config
