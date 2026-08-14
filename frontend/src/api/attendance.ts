import apiClient from "./client"

export interface Attendance {
  id: number
  employee: number
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface AttendanceListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Attendance[]
}

export const getAttendance = async (): Promise<
  AttendanceListResponse | Attendance[]
> => {
  const response = await apiClient.get<
    AttendanceListResponse | Attendance[]
  >("/attendance/")

  return response.data
}