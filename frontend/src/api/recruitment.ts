import apiClient from "./client"

export interface Candidate {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  job_title: string
  department: number
  department_name: string
  resume: string | null
  application_date: string
  interview_date: string | null
  status: string
  interview_notes: string
  hr_notes: string
  experience_years: number
  expected_salary: string | null
  offer_date: string | null
  joining_date: string | null
  created_at: string
  updated_at: string
}

export interface CandidateListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Candidate[]
}

export interface CandidatePayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: number
  resume?: File | null
  interview_date?: string | null
  status: string
  interview_notes: string
  hr_notes: string
  experience_years?: number
  expected_salary?: string | null
  offer_date?: string | null
  joining_date?: string | null
}

export const getCandidates = async (): Promise<
  CandidateListResponse | Candidate[]
> => {
  const response =
    await apiClient.get<
      CandidateListResponse | Candidate[]
    >("/recruitment/")

  return response.data
}

export const createCandidate = async (
  data: CandidatePayload,
): Promise<Candidate> => {
  const formData = new FormData()

  formData.append(
    "first_name",
    data.first_name,
  )

  formData.append(
    "last_name",
    data.last_name,
  )

  formData.append(
    "email",
    data.email,
  )

  formData.append(
    "phone",
    data.phone,
  )

  formData.append(
    "job_title",
    data.job_title,
  )

  formData.append(
    "department",
    String(data.department),
  )

  if (data.resume) {
    formData.append(
      "resume",
      data.resume,
    )
  }

  if (data.interview_date) {
    formData.append(
      "interview_date",
      data.interview_date,
    )
  }

  formData.append(
    "status",
    data.status,
  )

  formData.append(
    "interview_notes",
    data.interview_notes,
  )

  formData.append(
    "hr_notes",
    data.hr_notes,
  )

  if (data.experience_years !== undefined) {
    formData.append(
      "experience_years",
      String(data.experience_years),
    )
  }

  if (data.expected_salary !== undefined) {
    formData.append(
      "expected_salary",
      data.expected_salary ?? "",
    )
  }

  if (data.offer_date) {
    formData.append(
      "offer_date",
      data.offer_date,
    )
  }

  if (data.joining_date) {
    formData.append(
      "joining_date",
      data.joining_date,
    )
  }

  const response =
    await apiClient.post<Candidate>(
      "/recruitment/",
      formData,
    )

  return response.data
}

export const updateCandidate = async (
  id: number,
  data: CandidatePayload,
): Promise<Candidate> => {
  const formData = new FormData()

  formData.append(
    "first_name",
    data.first_name,
  )

  formData.append(
    "last_name",
    data.last_name,
  )

  formData.append(
    "email",
    data.email,
  )

  formData.append(
    "phone",
    data.phone,
  )

  formData.append(
    "job_title",
    data.job_title,
  )

  formData.append(
    "department",
    String(data.department),
  )

  if (data.resume) {
    formData.append(
      "resume",
      data.resume,
    )
  }

  if (data.interview_date) {
    formData.append(
      "interview_date",
      data.interview_date,
    )
  }

  formData.append(
    "status",
    data.status,
  )

  formData.append(
    "interview_notes",
    data.interview_notes,
  )

  formData.append(
    "hr_notes",
    data.hr_notes,
  )

  if (data.experience_years !== undefined) {
    formData.append(
      "experience_years",
      String(data.experience_years),
    )
  }

  if (data.expected_salary !== undefined) {
    formData.append(
      "expected_salary",
      data.expected_salary ?? "",
    )
  }

  if (data.offer_date) {
    formData.append(
      "offer_date",
      data.offer_date,
    )
  }

  if (data.joining_date) {
    formData.append(
      "joining_date",
      data.joining_date,
    )
  }

  const response =
    await apiClient.put<Candidate>(
      `/recruitment/${id}/`,
      formData,
    )

  return response.data
}

export const deleteCandidate = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/recruitment/${id}/`,
  )
}