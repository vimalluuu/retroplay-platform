import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Capacitor plugins are native-only; they are provided by the Capacitor WebView
      // at runtime on Android/iOS and must not be bundled into the web build.
      external: [
        '@capacitor/filesystem',
        '@capacitor/core',
        '@capacitor/status-bar',
        '@capacitor/splash-screen',
        '@capacitor/keyboard',
      ],
      output: {
        // When externalized, Capacitor plugins will be resolved via window.Capacitor
        globals: {
          '@capacitor/filesystem': 'CapacitorFilesystem',
          '@capacitor/core': 'Capacitor',
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
  },
});
