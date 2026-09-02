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

export type Announcement = AnnouncementRecord

export interface CreateAnnouncementRequest {
  title: string
  message: string
  target_audience: string
  department?: number | null
  publish_date: string
  expiry_date?: string | null
  is_active?: boolean
}

export interface AnnouncementListResponse {
  count: number
  next: string | null
  previous: string | null
  results: AnnouncementRecord[]
}

export async function getAnnouncements(
  params?: Record<string, string | number | boolean>,
): Promise<AnnouncementListResponse> {
  const response = await apiClient.get<AnnouncementListResponse>(
    "/announcements/",
    {
      params,
    },
  )

  return response.data
}

export async function createAnnouncement(
  data: CreateAnnouncementRequest,
): Promise<AnnouncementRecord> {
  const response = await apiClient.post<AnnouncementRecord>(
    "/announcements/",
    data,
  )

  return response.data
}

export async function deleteAnnouncement(
  id: number,
): Promise<void> {
  await apiClient.delete(`/announcements/${id}/`)
}