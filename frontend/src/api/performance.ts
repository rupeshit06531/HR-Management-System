import apiClient from "./client"

export interface PerformanceReview {
  id: number
  employee: number
  employee_id: string
  employee_name: string
  review_period: string
  strengths: string
  areas_for_improvement: string
  manager_comments: string
  review_date: string
  created_at: string
  updated_at: string
}

export interface PerformanceListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PerformanceReview[]
}

export interface CreatePerformanceRequest {
  employee: number
  review_period: string
  strengths: string
  areas_for_improvement: string
  manager_comments: string
  review_date: string
}

export const getPerformanceReviews =
  async (): Promise<
    PerformanceListResponse | PerformanceReview[]
  > => {
    const response =
      await apiClient.get<
        PerformanceListResponse |
        PerformanceReview[]
      >("/performance/")

    return response.data
  }

export const createPerformanceReview =
  async (
    data: CreatePerformanceRequest,
  ): Promise<PerformanceReview> => {
    const response =
      await apiClient.post<PerformanceReview>(
        "/performance/",
        data,
      )

    return response.data
  }

export const updatePerformanceReview =
  async (
    id: number,
    data: CreatePerformanceRequest,
  ): Promise<PerformanceReview> => {
    const response =
      await apiClient.put<PerformanceReview>(
        `/performance/${id}/`,
        data,
      )

    return response.data
  }

export const deletePerformanceReview =
  async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/performance/${id}/`,
    )
  }