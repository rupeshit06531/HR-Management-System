import apiClient from "./client"

export interface Attendance {
  id: number
  employee: number
  employee_id: string
  employee_name: string
  date: string
  check_in: string | null
  check_out: string | null

  check_in_latitude: string | null
  check_in_longitude: string | null
  check_in_accuracy: string | null

  check_out_latitude: string | null
  check_out_longitude: string | null
  check_out_accuracy: string | null

  check_in_selfie: string | null

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

  check_in_latitude?: number | string | null
  check_in_longitude?: number | string | null
  check_in_accuracy?: number | string | null

  check_out_latitude?: number | string | null
  check_out_longitude?: number | string | null
  check_out_accuracy?: number | string | null

  check_in_selfie?: File | null

  status: string
  remarks?: string
}

export interface PunchInPayload {
  latitude: number
  longitude: number
  accuracy?: number | null
  selfie: File
  remarks?: string
}

export const getAttendance =
  async (): Promise<AttendanceListResponse> => {
    const response =
      await apiClient.get<AttendanceListResponse>(
        "/attendance/",
      )

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

export const punchIn = async (
  data: PunchInPayload,
): Promise<Attendance> => {
  const formData = new FormData()

  formData.append(
    "latitude",
    String(data.latitude),
  )

  formData.append(
    "longitude",
    String(data.longitude),
  )

  if (data.accuracy !== undefined && data.accuracy !== null) {
    formData.append(
      "accuracy",
      String(data.accuracy),
    )
  }

  formData.append(
    "selfie",
    data.selfie,
    data.selfie.name || "attendance-selfie.jpg",
  )

  if (data.remarks) {
    formData.append(
      "remarks",
      data.remarks,
    )
  }

  const response =
    await apiClient.post<Attendance>(
      "/attendance/punch-in/",
      formData,
    )

  return response.data
}