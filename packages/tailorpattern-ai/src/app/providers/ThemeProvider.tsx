import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useLocalStorage<Theme>('tp-theme', 'system')

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
  return ctx
}
