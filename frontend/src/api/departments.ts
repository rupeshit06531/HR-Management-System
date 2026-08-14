import apiClient from "./client"

export interface Department {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Designation {
  id: number
  name: string
  department: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DepartmentListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Department[]
}

export interface DesignationListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Designation[]
}

export interface DepartmentPayload {
  name: string
  description: string
  is_active: boolean
}

export interface DesignationPayload {
  name: string
  department: number
  is_active: boolean
}

export const getDepartments = async (): Promise<
  DepartmentListResponse | Department[]
> => {
  const response = await apiClient.get<
    DepartmentListResponse | Department[]
  >("/departments/")

  return response.data
}

export const createDepartment = async (
  data: DepartmentPayload,
): Promise<Department> => {
  const response =
    await apiClient.post<Department>(
      "/departments/",
      data,
    )

  return response.data
}

export const updateDepartment = async (
  id: number,
  data: DepartmentPayload,
): Promise<Department> => {
  const response =
    await apiClient.put<Department>(
      `/departments/${id}/`,
      data,
    )

  return response.data
}

export const deleteDepartment = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/departments/${id}/`,
  )
}

export const getDesignations = async (): Promise<
  DesignationListResponse | Designation[]
> => {
  const response =
    await apiClient.get<
      DesignationListResponse | Designation[]
    >("/designations/")

  return response.data
}

export const createDesignation = async (
  data: DesignationPayload,
): Promise<Designation> => {
  const response =
    await apiClient.post<Designation>(
      "/designations/",
      data,
    )

  return response.data
}

export const updateDesignation = async (
  id: number,
  data: DesignationPayload,
): Promise<Designation> => {
  const response =
    await apiClient.put<Designation>(
      `/designations/${id}/`,
      data,
    )

  return response.data
}

export const deleteDesignation = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/designations/${id}/`,
  )
}