import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

interface ThemeContextValue {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<
  ThemeContextValue | undefined
>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

const THEME_STORAGE_KEY = "app_theme_mode"

function getStoredTheme(): boolean {
  const stored = localStorage.getItem(
    THEME_STORAGE_KEY,
  )
  return stored === "dark"
}

function storeTheme(isDark: boolean): void {
  localStorage.setItem(
    THEME_STORAGE_KEY,
    isDark ? "dark" : "light",
  )
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] =
    useState<boolean>(() => getStoredTheme())

  useEffect(() => {
    storeTheme(isDarkMode)

    if (isDarkMode) {
      document.documentElement.setAttribute(
        "data-theme",
        "dark",
      )
      document.documentElement.style.colorScheme =
        "dark"
    } else {
      document.documentElement.removeAttribute(
        "data-theme",
      )
      document.documentElement.style.colorScheme =
        "light"
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider",
    )
  }

  return context
}
