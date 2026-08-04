import { createContext, useContext, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// 全站锁死暗色模式，不再动态切换
const FORCED_THEME: Theme = 'dark'

const NOOP = () => { /* 全站强制暗色，切换操作已禁用 */ }

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{ theme: FORCED_THEME, toggleTheme: NOOP, setTheme: NOOP }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
