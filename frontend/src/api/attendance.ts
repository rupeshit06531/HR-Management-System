import apiClient from "./client"

export interface Attendance {
  id: number
  employee: number
  employee_id: string
  employee_name: string
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

export interface AttendancePayload {
  employee: number
  date: string
  check_in?: string | null
  check_out?: string | null
  status: string
  remarks?: string
}

export const getAttendance = async (): Promise<
  AttendanceListResponse | Attendance[]
> => {
  const response = await apiClient.get<
    AttendanceListResponse | Attendance[]
  >("/attendance/")

  return response.data
}

export const createAttendance = async (
  data: AttendancePayload,
): Promise<Attendance> => {
  const response =
    await apiClient.post<Attendance>(
      "/attendance/",
      data,
    )

  return response.data
}

export const updateAttendance = async (
  id: number,
  data: AttendancePayload,
): Promise<Attendance> => {
  const response =
    await apiClient.put<Attendance>(
      `/attendance/${id}/`,
      data,
    )

  return response.data
}

export const deleteAttendance = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/attendance/${id}/`,
  )
}