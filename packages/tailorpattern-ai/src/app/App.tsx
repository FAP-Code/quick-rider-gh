import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { OfflineProvider } from './providers/OfflineProvider'
import { AuthProvider } from '../features/auth/AuthContext'
import { Router } from './Router'

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <OfflineProvider>
              <Router />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    borderRadius: '12px',
                    background: '#1A1A2E',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                  },
                  success: {
                    iconTheme: { primary: '#C9A84C', secondary: '#1A1A2E' },
                  },
                  error: {
                    iconTheme: { primary: '#EF4444', secondary: '#fff' },
                  },
                }}
              />
            </OfflineProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}
