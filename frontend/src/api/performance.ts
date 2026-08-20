import apiClient from "./client"

export interface PerformanceReview {
  id: number
  employee: number
  employee_id?: number | string
  employee_name?: string
  review_period: string
  strengths: string
  areas_for_improvement: string
  manager_comments: string
  review_date: string
  created_at?: string
  updated_at?: string
}

export interface CreatePerformanceRequest {
  employee: number
  review_period: string
  strengths: string
  areas_for_improvement: string
  manager_comments: string
  review_date: string
}

export interface PerformanceListResponse {
  count?: number
  next?: string | null
  previous?: string | null
  results: PerformanceReview[]
}

const PERFORMANCE_URL = "/performance/"

export const getPerformanceReviews = async () => {
  const response = await apiClient.get<
    PerformanceReview[] | PerformanceListResponse
  >(PERFORMANCE_URL)

  return response.data
}

export const createPerformanceReview = async (
  payload: CreatePerformanceRequest,
) => {
  const response =
    await apiClient.post<PerformanceReview>(
      PERFORMANCE_URL,
      payload,
    )

  return response.data
}

export const updatePerformanceReview = async (
  id: number,
  payload: CreatePerformanceRequest,
) => {
  const response =
    await apiClient.patch<PerformanceReview>(
      `${PERFORMANCE_URL}${id}/`,
      payload,
    )

  return response.data
}

export const deletePerformanceReview = async (
  id: number,
) => {
  await apiClient.delete(
    `${PERFORMANCE_URL}${id}/`,
  )
}