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

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null)

  const [accessToken, setAccessToken] =
    useState<string | null>(() =>
      localStorage.getItem("access_token"),
    )

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    let isMounted = true

    const clearAuthentication = () => {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")

      if (!isMounted) {
        return
      }

      setAccessToken(null)
      setUser(null)
    }

    const initializeAuth = async () => {
      const storedAccessToken =
        localStorage.getItem("access_token")

      const storedRefreshToken =
        localStorage.getItem("refresh_token")

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

            setAccessToken(storedAccessToken)
            setUser(currentUser)
            setIsLoading(false)

            return
          } catch {
            // Access token may have expired.
            // Continue with refresh token flow.
          }
        }

        const latestRefreshToken =
          localStorage.getItem(
            "refresh_token",
          )

        if (!latestRefreshToken) {
          throw new Error(
            "Refresh token is missing.",
          )
        }

        const response =
          await refreshToken({
            refresh: latestRefreshToken,
          })

        localStorage.setItem(
          "access_token",
          response.access,
        )

        if (response.refresh) {
          localStorage.setItem(
            "refresh_token",
            response.refresh,
          )
        }

        if (!isMounted) {
          return
        }

        setAccessToken(response.access)

        const currentUser =
          await getCurrentUser()

        if (!isMounted) {
          return
        }

        setUser(currentUser)
      } catch {
        clearAuthentication()
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

    localStorage.setItem(
      "access_token",
      response.access,
    )

    localStorage.setItem(
      "refresh_token",
      response.refresh,
    )

    setAccessToken(response.access)
    setUser(response.user)
  }

  const logout = async (): Promise<void> => {
    const storedRefreshToken =
      localStorage.getItem(
        "refresh_token",
      )

    try {
      if (storedRefreshToken) {
        await logoutApi({
          refresh: storedRefreshToken,
        })
      }
    } finally {
      localStorage.removeItem(
        "access_token",
      )

      localStorage.removeItem(
        "refresh_token",
      )

      setAccessToken(null)
      setUser(null)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated:
        Boolean(accessToken) &&
        Boolean(user),
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
    <AuthContext.Provider value={value}>
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