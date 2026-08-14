import apiClient from "./client"

export interface Employee {
  id: number
  employee_id: string
  department: number | null
  designation: number | null
  joining_date: string
  employment_type: string
  employment_status: string
  manager: number | null
  date_of_birth: string | null
  address: string
  emergency_contact: string
  user: number
}

export interface EmployeeListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Employee[]
}

export const getEmployees = async (): Promise<
  EmployeeListResponse | Employee[]
> => {
  const response = await apiClient.get<
    EmployeeListResponse | Employee[]
  >("/employees/")

  return response.data
}

export const getEmployeeByUserId = async (
  userId: number,
): Promise<Employee | null> => {
  const response = await apiClient.get<
    EmployeeListResponse | Employee[]
  >("/employees/", {
    params: {
      user: userId,
    },
  })

  const data = response.data

  if (Array.isArray(data)) {
    return data.find(
      (employee) => employee.user === userId,
    ) ?? null
  }

  return (
    data.results.find(
      (employee) => employee.user === userId,
    ) ?? null
  )
}