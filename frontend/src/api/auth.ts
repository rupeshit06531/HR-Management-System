import apiClient from "./client"

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone: string
  employee_id: string
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

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ChangePasswordResponse {
  detail: string
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response =
    await apiClient.post<LoginResponse>(
      "/login/",
      credentials,
    )

  return response.data
}

export async function refreshToken(
  data: RefreshRequest,
): Promise<RefreshResponse> {
  const response =
    await apiClient.post<RefreshResponse>(
      "/token/refresh/",
      data,
    )

  return response.data
}

export async function logout(
  data: LogoutRequest,
): Promise<void> {
  await apiClient.post(
    "/logout/",
    data,
  )
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response =
    await apiClient.get<AuthUser>(
      "/me/",
    )

  return response.data
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  const response =
    await apiClient.post<ChangePasswordResponse>(
      "/password/change/",
      data,
    )

  return response.data
}