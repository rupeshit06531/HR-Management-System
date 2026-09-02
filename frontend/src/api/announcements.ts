import apiClient from "./client"

export interface Announcement {
  id: number
  title: string
  message: string
  created_by: number | null
  created_by_name: string | null
  target_audience: "ALL" | "MANAGERS" | "DEPARTMENT"
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
  results: Announcement[]
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