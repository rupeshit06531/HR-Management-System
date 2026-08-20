import apiClient from "./client"

export interface AnnouncementRecord {
  id: number
  title: string
  message: string
  created_by: number | null
  created_by_name: string | null
  target_audience: string
  department: number | null
  department_name: string | null
  publish_date: string
  expiry_date: string | null
  is_active: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementListResponse {
  count: number
  next: string | null
  previous: string | null
  results: AnnouncementRecord[]
}

export interface CreateAnnouncementRequest {
  title: string
  message: string
  target_audience: string
  department?: number | null
  publish_date: string
  expiry_date?: string | null
  is_active: boolean
}

export const getAnnouncements =
  async (): Promise<AnnouncementListResponse> => {
    const response =
      await apiClient.get<AnnouncementListResponse>(
        "/announcements/",
      )

    return response.data
  }

export const createAnnouncement = async (
  data: CreateAnnouncementRequest,
): Promise<AnnouncementRecord> => {
  const response =
    await apiClient.post<AnnouncementRecord>(
      "/announcements/",
      data,
    )

  return response.data
}

export const updateAnnouncement = async (
  id: number,
  data: Partial<CreateAnnouncementRequest>,
): Promise<AnnouncementRecord> => {
  const response =
    await apiClient.patch<AnnouncementRecord>(
      `/announcements/${id}/`,
      data,
    )

  return response.data
}

export const deleteAnnouncement = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/announcements/${id}/`,
  )
}