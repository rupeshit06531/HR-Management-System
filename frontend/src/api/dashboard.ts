import apiClient from "./client"

export interface DashboardUser {
  id: number
  username: string
  role: string
}

export interface DashboardEmployees {
  total: number
  active: number
  inactive: number
  resigned: number
  terminated: number
}

export interface DashboardUsers {
  total: number
  roles: Record<string, number>
}

export interface DashboardData {
  user: DashboardUser
  employees: DashboardEmployees
  users: DashboardUsers
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>(
    "/dashboard/",
  )

  return response.data
}