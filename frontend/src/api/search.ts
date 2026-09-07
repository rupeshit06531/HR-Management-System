import apiClient from "./client"

export interface GlobalSearchResult {
  id: number
  type: "employee"
  employee_id: string
  full_name: string
  email: string
  department: string | null
  designation: string | null
  employment_status: string
}

export interface GlobalSearchResponse {
  query: string
  total: number
  results: GlobalSearchResult[]
}

export async function globalSearch(
  query: string,
): Promise<GlobalSearchResponse> {
  const response =
    await apiClient.get<GlobalSearchResponse>(
      "/search/",
      {
        params: {
          q: query,
        },
      },
    )

  return response.data
}