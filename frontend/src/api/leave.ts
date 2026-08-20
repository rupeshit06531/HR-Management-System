import apiClient from "./client"

export interface LeaveRecord {
  id: number
  employee: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  applied_at: string
  updated_at: string
}

export interface LeaveListResponse {
  count: number
  next: string | null
  previous: string | null
  results: LeaveRecord[]
}

export interface CreateLeaveRequest {
  leave_type: string
  start_date: string
  end_date: string
  reason: string
}

export const getLeaves =
  async (): Promise<LeaveListResponse> => {
    const response =
      await apiClient.get<LeaveListResponse>(
        "/leaves/",
      )

    return response.data
  }

export const createLeave = async (
  data: CreateLeaveRequest,
): Promise<LeaveRecord> => {
  const response =
    await apiClient.post<LeaveRecord>(
      "/leaves/",
      data,
    )

  return response.data
}

export const updateLeave = async (
  id: number,
  data: CreateLeaveRequest,
): Promise<LeaveRecord> => {
  const response =
    await apiClient.put<LeaveRecord>(
      `/leaves/${id}/`,
      data,
    )

  return response.data
}

export const deleteLeave = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/leaves/${id}/`,
  )
}