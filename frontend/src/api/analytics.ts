import apiClient from "./client"

export interface AnalyticsEmployees {
  total: number
  active: number
  inactive: number
  resigned: number
  terminated: number
  by_department: AnalyticsDepartment[]
  by_employment_type: AnalyticsEmploymentType[]
}

export interface AnalyticsDepartment {
  department: string | null
  total: number
}

export interface AnalyticsEmploymentType {
  employment_type: string
  total: number
}

export interface AnalyticsData {
  employees: AnalyticsEmployees
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const response = await apiClient.get<AnalyticsData>(
    "/analytics/",
  )

  return response.data
}