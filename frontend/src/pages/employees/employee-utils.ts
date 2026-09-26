import type { CSSProperties } from "react"

import type { EmployeePayload } from "../../api/employees"

export const emptyForm: EmployeePayload = {
  user: 0,
  employee_id: "",
  department: null,
  designation: null,
  joining_date: "",
  employment_type: "FULL_TIME",
  employment_status: "ACTIVE",
  manager: null,
  date_of_birth: null,
  address: "",
  emergency_contact: "",
}

export const employmentTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
] as const

export const employmentStatuses = [
  "ACTIVE",
  "INACTIVE",
  "RESIGNED",
  "TERMINATED",
] as const

export const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1480px",
  margin: "0 auto",
}

export async function loadAllPages<T>(
  fetchPage: (page: number) => Promise<{
    results: T[]
    next: string | null
  }>,
): Promise<T[]> {
  const items: T[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const response = await fetchPage(page)
    items.push(...response.results)
    hasNextPage = Boolean(response.next)
    page += 1
  }

  return items
}

export function formatValue(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)

  if (!parts.length) {
    return "E"
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}

export function formatDate(date: string): string {
  if (!date) {
    return "-"
  }

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
