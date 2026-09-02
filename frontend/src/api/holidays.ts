import apiClient from "./client"

export interface Holiday {
  id: number
  name: string
  date: string
  holiday_type: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HolidayListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Holiday[]
}

export interface HolidayPayload {
  name: string
  date: string
  holiday_type: string
  description: string
  is_active: boolean
}

export const getHolidays = async (
  params?: Record<string, string | number | boolean>,
): Promise<HolidayListResponse> => {
  const response = await apiClient.get<HolidayListResponse>(
    "/holidays/",
    {
      params,
    },
  )

  return response.data
}

export const createHoliday = async (
  data: HolidayPayload,
): Promise<Holiday> => {
  const response = await apiClient.post<Holiday>(
    "/holidays/",
    data,
  )

  return response.data
}

export const updateHoliday = async (
  id: number,
  data: HolidayPayload,
): Promise<Holiday> => {
  const response = await apiClient.put<Holiday>(
    `/holidays/${id}/`,
    data,
  )

  return response.data
}

export const deleteHoliday = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/holidays/${id}/`,
  )
}