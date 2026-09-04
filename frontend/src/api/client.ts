import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim()

const API_BASE_URL =
  configuredApiBaseUrl
    ? configuredApiBaseUrl.replace(/\/+$/, "")
    : "/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  access: string
  refresh?: string
}

let refreshPromise: Promise<string> | null = null

const refreshAccessToken =
  async (): Promise<string> => {
    const storedRefreshToken =
      localStorage.getItem(
        "refresh_token",
      )

    if (!storedRefreshToken) {
      throw new Error(
        "Refresh token is missing.",
      )
    }

    const response =
      await axios.post<RefreshResponse>(
        `${API_BASE_URL}/token/refresh/`,
        {
          refresh: storedRefreshToken,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
          timeout: 15000,
        },
      )

    const newAccessToken =
      response.data.access

    localStorage.setItem(
      "access_token",
      newAccessToken,
    )

    if (response.data.refresh) {
      localStorage.setItem(
        "refresh_token",
        response.data.refresh,
      )
    }

    return newAccessToken
  }

apiClient.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem(
        "access_token",
      )

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`
    }

    return config
  },
  (error) =>
    Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | RetryableRequestConfig
        | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    const requestUrl =
      originalRequest.url || ""

    if (
      requestUrl.includes(
        "/login/",
      ) ||
      requestUrl.includes(
        "/token/refresh/",
      ) ||
      requestUrl.includes(
        "/logout/",
      )
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise =
          refreshAccessToken().finally(
            () => {
              refreshPromise = null
            },
          )
      }

      const newAccessToken =
        await refreshPromise

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`

      return apiClient.request(
        originalRequest,
      )
    } catch (refreshError) {
      localStorage.removeItem(
        "access_token",
      )

      localStorage.removeItem(
        "refresh_token",
      )

      return Promise.reject(
        refreshError,
      )
    }
  },
)

export default apiClient