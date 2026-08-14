import apiClient from "./client"

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone: string
  employee_id: string | null
  profile_image: string | null
  is_active: boolean
  date_joined: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  refresh: string
  access: string
  user: AuthUser
}

export interface RefreshResponse {
  access: string
  refresh?: string
}

export interface LogoutRequest {
  refresh: string
}

export interface CurrentUserResponse extends AuthUser {}

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    "/login/",
    credentials,
  )

  return response.data
}

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<RefreshResponse> => {
  const response = await apiClient.post<RefreshResponse>(
    "/token/refresh/",
    {
      refresh: refreshToken,
    },
  )

  return response.data
}

export const logout = async (
  refreshToken: string,
): Promise<void> => {
  await apiClient.post(
    "/logout/",
    {
      refresh: refreshToken,
    } satisfies LogoutRequest,
  )
}

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await apiClient.get<CurrentUserResponse>(
    "/me/",
  )

  return response.data
}