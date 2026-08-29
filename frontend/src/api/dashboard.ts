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

export interface DashboardEmployee {
  id: number
  employee_id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  department: string | null
  designation: string | null
  joining_date: string | null
  employment_type: string
  employment_status: string
  manager: string | null
}

export interface DashboardData {
  user: DashboardUser
  employees: DashboardEmployees
  employee?: DashboardEmployee
  users?: DashboardUsers
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>(
    "/dashboard/",
  )

  return response.data
}