import apiClient from "./client"

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone: string
  profile_image: string | null
  is_active: boolean
  date_joined: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

export interface RefreshRequest {
  refresh: string
}

export interface RefreshResponse {
  access: string
  refresh?: string
}

export interface LogoutRequest {
  refresh: string
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/login/",
    credentials,
  )

  const { access, refresh } = response.data

  localStorage.setItem(
    "access_token",
    access,
  )

  localStorage.setItem(
    "refresh_token",
    refresh,
  )

  return response.data
}

export async function refreshToken(
  data: RefreshRequest,
): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>(
    "/token/refresh/",
    data,
  )

  localStorage.setItem(
    "access_token",
    response.data.access,
  )

  if (response.data.refresh) {
    localStorage.setItem(
      "refresh_token",
      response.data.refresh,
    )
  }

  return response.data
}

export async function logout(
  data: LogoutRequest,
): Promise<void> {
  try {
    await apiClient.post(
      "/logout/",
      data,
    )
  } finally {
    localStorage.removeItem(
      "access_token",
    )

    localStorage.removeItem(
      "refresh_token",
    )
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>(
    "/me/",
  )

  return response.data
}