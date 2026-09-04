import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  const authOperationRef =
    useRef(0)

  useEffect(() => {
    let isMounted = true
    const operationId =
      authOperationRef.current

    const initializeAuth = async () => {
      const storedAccessToken =
        getStoredAccessToken()

      const storedRefreshToken =
        getStoredRefreshToken()

      const isCurrentOperation = () =>
        isMounted &&
        authOperationRef.current ===
          operationId

      if (
        !storedAccessToken &&
        !storedRefreshToken
      ) {
        if (isCurrentOperation()) {
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

            if (!isCurrentOperation()) {
              return
            }

            setAccessToken(
              storedAccessToken,
            )
            setUser(currentUser)
            setIsLoading(false)

            return
          } catch {
            // Access token may have expired.
            // Continue with refresh-token recovery.
          }
        }

        if (!isCurrentOperation()) {
          return
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

        if (!isCurrentOperation()) {
          return
        }

        storeTokens(
          response.access,
          response.refresh,
        )

        setAccessToken(
          response.access,
        )

        const currentUser =
          await getCurrentUser()

        if (!isCurrentOperation()) {
          return
        }

        setUser(currentUser)
      } catch {
        if (!isCurrentOperation()) {
          return
        }

        clearStoredTokens()
        setAccessToken(null)
        setUser(null)
      }

      if (isCurrentOperation()) {
        setIsLoading(false)
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
    const operationId =
      ++authOperationRef.current

    const response =
      await loginApi(credentials)

    if (
      authOperationRef.current !==
      operationId
    ) {
      return
    }

    storeTokens(
      response.access,
      response.refresh,
    )

    setAccessToken(
      response.access,
    )
    setUser(response.user)
    setIsLoading(false)
  }

  const logout = async (): Promise<void> => {
    const operationId =
      ++authOperationRef.current

    const storedRefreshToken =
      getStoredRefreshToken()

    let logoutCompleted = false

    try {
      if (storedRefreshToken) {
        await logoutApi({
          refresh:
            storedRefreshToken,
        })
      }

      logoutCompleted = true
    } finally {
      if (
        logoutCompleted &&
        authOperationRef.current ===
          operationId
      ) {
        clearStoredTokens()

        setAccessToken(null)
        setUser(null)
        setIsLoading(false)
      }
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