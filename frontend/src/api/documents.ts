import apiClient from "./client"

export interface DocumentRecord {
  id: number
  employee: number
  employee_name: string
  title: string
  document_type: string
  file: string
  description: string
  uploaded_at: string
}

export interface DocumentListResponse {
  count: number
  next: string | null
  previous: string | null
  results: DocumentRecord[]
}

export interface CreateDocumentRequest {
  employee: number
  title: string
  document_type: string
  file: File
  description: string
}

export const getDocuments =
  async (): Promise<DocumentListResponse> => {
    const response =
      await apiClient.get<DocumentListResponse>(
        "/documents/",
      )

    return response.data
  }

export const createDocument = async (
  data: CreateDocumentRequest,
): Promise<DocumentRecord> => {
  const formData = new FormData()

  formData.append(
    "employee",
    String(data.employee),
  )

  formData.append(
    "title",
    data.title,
  )

  formData.append(
    "document_type",
    data.document_type,
  )

  formData.append(
    "file",
    data.file,
  )

  formData.append(
    "description",
    data.description,
  )

  const response =
    await apiClient.post<DocumentRecord>(
      "/documents/",
      formData,
    )

  return response.data
}

export const deleteDocument = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/documents/${id}/`,
  )
}