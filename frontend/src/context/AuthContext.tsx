import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  refreshToken,
  type AuthUser,
  type LoginRequest,
} from "../api/auth"

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  )

interface AuthProviderProps {
  children: ReactNode
}

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

function getStoredAccessToken(): string | null {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY,
  )
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY,
  )
}

function clearStoredTokens(): void {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  )

  localStorage.removeItem(
    REFRESH_TOKEN_KEY,
  )
}

function storeTokens(
  accessToken: string,
  refreshTokenValue?: string,
): void {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  )

  if (refreshTokenValue) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshTokenValue,
    )
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null)

  const [accessToken, setAccessToken] =
    useState<string | null>(
      getStoredAccessToken,
    )

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const storedAccessToken =
        getStoredAccessToken()

      const storedRefreshToken =
        getStoredRefreshToken()

      if (
        !storedAccessToken &&
        !storedRefreshToken
      ) {
        if (isMounted) {
          setAccessToken(null)
          setUser(null)
          setIsLoading(false)
        }

        return
      }

      try {
        if (storedAccessToken) {
          try {
            const currentUser =
              await getCurrentUser()

            if (!isMounted) {
              return
            }

            setAccessToken(
              storedAccessToken,
            )
            setUser(currentUser)

            return
          } catch {
            // Access token may have expired.
            // Continue with refresh-token recovery.
          }
        }

        const latestRefreshToken =
          getStoredRefreshToken()

        if (!latestRefreshToken) {
          throw new Error(
            "Refresh token is missing.",
          )
        }

        const response =
          await refreshToken({
            refresh:
              latestRefreshToken,
          })

        storeTokens(
          response.access,
          response.refresh,
        )

        if (!isMounted) {
          return
        }

        setAccessToken(
          response.access,
        )

        const currentUser =
          await getCurrentUser()

        if (!isMounted) {
          return
        }

        setUser(currentUser)
      } catch {
        clearStoredTokens()

        if (isMounted) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (
    credentials: LoginRequest,
  ): Promise<void> => {
    const response =
      await loginApi(credentials)

    storeTokens(
      response.access,
      response.refresh,
    )

    setAccessToken(
      response.access,
    )
    setUser(response.user)
  }

  const logout = async (): Promise<void> => {
    const storedRefreshToken =
      getStoredRefreshToken()

    try {
      if (storedRefreshToken) {
        await logoutApi({
          refresh:
            storedRefreshToken,
        })
      }
    } finally {
      clearStoredTokens()

      setAccessToken(null)
      setUser(null)
    }
  }

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        accessToken,
        isAuthenticated:
          Boolean(
            accessToken && user,
          ),
        isLoading,
        login,
        logout,
      }),
      [
        user,
        accessToken,
        isLoading,
      ],
    )

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    )
  }

  return context
}