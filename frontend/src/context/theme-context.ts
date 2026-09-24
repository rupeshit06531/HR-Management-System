import { createContext, useContext } from "react"

export interface ThemeContextValue {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const ThemeContext = createContext<
  ThemeContextValue | undefined
>(undefined)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.")
  }

  return context
}
