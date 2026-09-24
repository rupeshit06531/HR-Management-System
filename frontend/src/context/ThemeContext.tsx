import {
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { ThemeContext } from "./theme-context"

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
