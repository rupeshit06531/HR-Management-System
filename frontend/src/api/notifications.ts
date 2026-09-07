import apiClient from "./client"

export type NotificationType =
  | "SYSTEM"
  | "ANNOUNCEMENT"
  | "LEAVE"
  | "ATTENDANCE"
  | "PAYROLL"
  | "PERFORMANCE"
  | "RECRUITMENT"
  | "DOCUMENT"

export interface NotificationRecord {
  id: number
  recipient: number
  recipient_name: string | null
  title: string
  message: string
  notification_type: NotificationType
  notification_type_display: string
  is_read: boolean
  action_url: string
  created_at: string
  updated_at: string
}

export interface NotificationListResponse {
  count: number
  next: string | null
  previous: string | null
  results: NotificationRecord[]
}

export interface UnreadNotificationCountResponse {
  count: number
}

export interface MarkAllNotificationsReadResponse {
  detail: string
  updated_count: number
}

export async function getNotifications(
  params?: Record<string, string | number | boolean>,
): Promise<NotificationListResponse> {
  const response = await apiClient.get<NotificationListResponse>(
    "/notifications/",
    {
      params,
    },
  )

  return response.data
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response =
    await apiClient.get<UnreadNotificationCountResponse>(
      "/notifications/unread-count/",
    )

  return response.data.count
}

export async function markNotificationRead(
  id: number,
): Promise<NotificationRecord> {
  const response = await apiClient.post<NotificationRecord>(
    `/notifications/${id}/mark-read/`,
  )

  return response.data
}

export async function markNotificationUnread(
  id: number,
): Promise<NotificationRecord> {
  const response = await apiClient.post<NotificationRecord>(
    `/notifications/${id}/mark-unread/`,
  )

  return response.data
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  const response =
    await apiClient.post<MarkAllNotificationsReadResponse>(
      "/notifications/mark-all-read/",
    )

  return response.data
}