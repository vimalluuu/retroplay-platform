import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './contexts/AuthContext'
import { GameLibraryProvider } from './contexts/GameLibraryContext'

import { LibraryPage } from './pages/LibraryPage'
import { PlayPage } from './pages/PlayPage'
import { UploadPage } from './pages/UploadPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { RecentPage } from './pages/RecentPage'
import { AuthPage } from './pages/AuthPage'
import { SettingsPage } from './pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameLibraryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/play/:id" element={<PlayPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/recent" element={<RecentPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(225 22% 11%)',
                color: 'hsl(210 40% 92%)',
                border: '1px solid hsl(225 20% 18%)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: 'hsl(142 76% 52%)', secondary: 'hsl(225 25% 7%)' },
              },
            }}
          />
        </GameLibraryProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
