import apiClient from "./client"

export interface Employee {
  id: number
  user: number
  full_name: string
  user_name: string
  user_username: string
  user_email: string
  employee_id: string
  department: number | null
  department_name: string | null
  designation: number | null
  designation_name: string | null
  joining_date: string
  employment_type: string
  employment_type_label: string
  employment_status: string
  employment_status_label: string
  manager: number | null
  manager_name: string | null
  manager_employee_id: string | null
  date_of_birth: string | null
  address: string
  emergency_contact: string
  created_at: string
  updated_at: string
}

export interface EmployeeListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Employee[]
}

export interface EmployeePayload {
  user: number
  employee_id: string
  department?: number | null
  designation?: number | null
  joining_date: string
  employment_type: string
  employment_status: string
  manager?: number | null
  date_of_birth?: string | null
  address?: string
  emergency_contact?: string
}

export const getEmployees =
  async (): Promise<EmployeeListResponse> => {
    const response =
      await apiClient.get<EmployeeListResponse>(
        "/employees/",
      )

    return response.data
  }

export const getEmployeeByUserId = async (
  userId: number,
): Promise<Employee | null> => {
  const response =
    await apiClient.get<EmployeeListResponse>(
      "/employees/",
      {
        params: {
          user: userId,
        },
      },
    )

  return (
    response.data.results.find(
      (employee) =>
        employee.user === userId,
    ) ?? null
  )
}

export const createEmployee = async (
  data: EmployeePayload,
): Promise<Employee> => {
  const response =
    await apiClient.post<Employee>(
      "/employees/",
      data,
    )

  return response.data
}

export const updateEmployee = async (
  id: number,
  data: EmployeePayload,
): Promise<Employee> => {
  const response =
    await apiClient.put<Employee>(
      `/employees/${id}/`,
      data,
    )

  return response.data
}

export const deleteEmployee = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/employees/${id}/`,
  )
}