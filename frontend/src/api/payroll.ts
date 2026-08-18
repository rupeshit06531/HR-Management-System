import apiClient from "./client"

export interface Payroll {
  id: number
  employee: number
  employee_id: string
  employee_name: string
  month: string
  basic_salary: string
  allowances: string
  deductions: string
  gross_salary: string
  net_salary: string
  payment_status: "pending" | "paid"
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PayrollListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Payroll[]
}

export interface PayrollPayload {
  employee: number
  month: string
  basic_salary: string
  allowances: string
  deductions: string
  payment_status: "pending" | "paid"
  paid_at?: string | null
}

export interface PayrollUpdatePayload {
  employee?: number
  month?: string
  basic_salary?: string
  allowances?: string
  deductions?: string
  payment_status?: "pending" | "paid"
  paid_at?: string | null
}

export interface PayrollQueryParams {
  page?: number
  employee?: number
  payment_status?: "pending" | "paid"
  month?: string
  paid_at?: string
  search?: string
  ordering?: string
}

export const getPayroll = async (
  params?: PayrollQueryParams,
): Promise<PayrollListResponse> => {
  const response =
    await apiClient.get<PayrollListResponse>(
      "/payroll/",
      {
        params,
      },
    )

  return response.data
}

export const createPayroll = async (
  data: PayrollPayload,
): Promise<Payroll> => {
  const response =
    await apiClient.post<Payroll>(
      "/payroll/",
      data,
    )

  return response.data
}

export const updatePayroll = async (
  id: number,
  data: PayrollPayload,
): Promise<Payroll> => {
  const response =
    await apiClient.put<Payroll>(
      `/payroll/${id}/`,
      data,
    )

  return response.data
}

export const patchPayroll = async (
  id: number,
  data: PayrollUpdatePayload,
): Promise<Payroll> => {
  const response =
    await apiClient.patch<Payroll>(
      `/payroll/${id}/`,
      data,
    )

  return response.data
}

export const deletePayroll = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/payroll/${id}/`,
  )
}