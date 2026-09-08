import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
  type Employee,
  type EmployeeListResponse,
  type EmployeePayload,
} from "../api/employees"

import {
  getDepartments,
  getDesignations,
  type Department,
  type DepartmentListResponse,
  type Designation,
  type DesignationListResponse,
} from "../api/departments"

import {
  getUsers,
  type AuthUser,
  type UserListResponse,
} from "../api/accounts"

import { useTheme } from "../context/ThemeContext"

const emptyForm: EmployeePayload = {
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

const employmentTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]

const employmentStatuses = [
  "ACTIVE",
  "INACTIVE",
  "RESIGNED",
  "TERMINATED",
]

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1480px",
  margin: "0 auto",
}

function formatValue(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function getInitials(name: string) {
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

function formatDate(date: string) {
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

function Employees() {
  const { isDarkMode } = useTheme()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])

  const [totalEmployees, setTotalEmployees] = useState(0)
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [previousPage, setPreviousPage] =
    useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] =
    useState("")
  const [designationFilter, setDesignationFilter] =
    useState("")
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState("")
  const [statusFilter, setStatusFilter] =
    useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null)

  const [form, setForm] =
    useState<EmployeePayload>(emptyForm)

  const theme = useMemo(() => {
    if (isDarkMode) {
      return {
        pageBackground: "#0f172a",
        cardBackground: "#111827",
        cardBackgroundAlt: "#172033",
        inputBackground: "#0f172a",
        inputBackgroundDisabled: "#182235",
        border: "#273449",
        borderSoft: "#334155",
        borderTable: "#243044",
        borderRow: "#1f2937",
        textPrimary: "#f1f5f9",
        textHeading: "#f8fafc",
        textSecondary: "#cbd5e1",
        textMuted: "#94a3b8",
        textSubtle: "#64748b",
        placeholder: "#64748b",
        blueBackground: "#172554",
        blueSoft: "#1e3a8a",
        blueText: "#93c5fd",
        blueBorder: "#315efb",
        white: "#ffffff",
        dangerBackground: "#2a1515",
        dangerBorder: "#5f2929",
        dangerText: "#fca5a5",
        successBackground: "#10251b",
        successBorder: "#23583b",
        successText: "#86efac",
        disabledBackground: "#1e293b",
        disabledText: "#64748b",
        avatarBackground: "#172554",
        avatarText: "#93c5fd",
      }
    }

    return {
      pageBackground: "#f5f7fb",
      cardBackground: "#ffffff",
      cardBackgroundAlt: "#fafbfc",
      inputBackground: "#ffffff",
      inputBackgroundDisabled: "#f7f8fa",
      border: "#e8ebf2",
      borderSoft: "#dfe3eb",
      borderTable: "#e8ebf2",
      borderRow: "#f0f2f5",
      textPrimary: "#293347",
      textHeading: "#202939",
      textSecondary: "#596579",
      textMuted: "#7b8495",
      textSubtle: "#929bab",
      placeholder: "#9aa3b2",
      blueBackground: "#eef3ff",
      blueSoft: "#f3f6ff",
      blueText: "#315efb",
      blueBorder: "#cdd8ff",
      white: "#ffffff",
      dangerBackground: "#fff7f6",
      dangerBorder: "#f2c5c1",
      dangerText: "#b42318",
      successBackground: "#f1fbf5",
      successBorder: "#b8e5ca",
      successText: "#18794e",
      disabledBackground: "#f7f8fa",
      disabledText: "#b1b8c4",
      avatarBackground: "#eef3ff",
      avatarText: "#315efb",
    }
  }, [isDarkMode])

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    boxSizing: "border-box",
    background: theme.pageBackground,
    fontFamily:
      'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    color: theme.textPrimary,
    transition:
      "background-color 0.2s ease, color 0.2s ease",
  }

  const cardStyle: CSSProperties = {
    background: theme.cardBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    boxShadow: isDarkMode
      ? "0 1px 3px rgba(0, 0, 0, 0.2)"
      : "0 1px 3px rgba(15, 23, 42, 0.04)",
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    boxSizing: "border-box",
    border: `1px solid ${theme.borderSoft}`,
    borderRadius: "7px",
    background: theme.inputBackground,
    color: theme.textPrimary,
    fontSize: "13px",
    outline: "none",
  }

  const labelStyle: CSSProperties = {
    display: "grid",
    gap: "6px",
    color: theme.textSecondary,
    fontSize: "12px",
    fontWeight: 600,
  }

  const getStatusStyle = (
    status: string,
  ): CSSProperties => {
    if (isDarkMode) {
      switch (status) {
        case "ACTIVE":
          return {
            color: "#86efac",
            background: "#123522",
          }

        case "INACTIVE":
          return {
            color: "#cbd5e1",
            background: "#1e293b",
          }

        case "RESIGNED":
          return {
            color: "#fde68a",
            background: "#3b2f0b",
          }

        case "TERMINATED":
          return {
            color: "#fca5a5",
            background: "#3b1717",
          }

        default:
          return {
            color: "#cbd5e1",
            background: "#1e293b",
          }
      }
    }

    switch (status) {
      case "ACTIVE":
        return {
          color: "#18794e",
          background: "#e8f7ef",
        }

      case "INACTIVE":
        return {
          color: "#64748b",
          background: "#f1f5f9",
        }

      case "RESIGNED":
        return {
          color: "#a16207",
          background: "#fff7d6",
        }

      case "TERMINATED":
        return {
          color: "#b42318",
          background: "#ffebe9",
        }

      default:
        return {
          color: "#64748b",
          background: "#f1f5f9",
        }
    }
  }

  const filteredDesignations = useMemo(() => {
    if (!form.department) {
      return []
    }

    return designations.filter(
      (designation) =>
        designation.department === form.department,
    )
  }, [designations, form.department])

  const activeCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.employment_status === "ACTIVE",
      ).length,
    [employees],
  )

  const inactiveCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.employment_status !== "ACTIVE",
      ).length,
    [employees],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(totalEmployees / pageSize),
  )

  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getEmployees({
        page,
        search: search.trim() || undefined,
        department: departmentFilter
          ? Number(departmentFilter)
          : undefined,
        designation: designationFilter
          ? Number(designationFilter)
          : undefined,
        employment_type:
          employmentTypeFilter || undefined,
        employment_status:
          statusFilter || undefined,
      })

      if (Array.isArray(response)) {
        setEmployees(response)
        setTotalEmployees(response.length)
        setNextPage(null)
        setPreviousPage(null)
      } else {
        const paginated =
          response as EmployeeListResponse

        setEmployees(paginated.results ?? [])
        setTotalEmployees(paginated.count ?? 0)
        setNextPage(paginated.next)
        setPreviousPage(paginated.previous)
      }
    } catch {
      setError("Unable to load employee data.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDepartments = async () => {
    const response = await getDepartments()

    if (Array.isArray(response)) {
      setDepartments(response)
    } else {
      const paginated =
        response as DepartmentListResponse

      setDepartments(paginated.results ?? [])
    }
  }

  const loadDesignations = async () => {
    const response = await getDesignations()

    if (Array.isArray(response)) {
      setDesignations(response)
    } else {
      const paginated =
        response as DesignationListResponse

      setDesignations(paginated.results ?? [])
    }
  }

  const loadUsers = async () => {
    const response = await getUsers()

    if (Array.isArray(response)) {
      setUsers(response)
    } else {
      const paginated =
        response as UserListResponse

      setUsers(paginated.results ?? [])
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [
    page,
    search,
    departmentFilter,
    designationFilter,
    employmentTypeFilter,
    statusFilter,
  ])

  useEffect(() => {
    const loadSupportingData = async () => {
      try {
        await Promise.all([
          loadDepartments(),
          loadDesignations(),
          loadUsers(),
        ])
      } catch {
        setError(
          "Unable to load employee supporting data.",
        )
      }
    }

    void loadSupportingData()
  }, [])

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setError(null)
    setSuccess(null)
    setShowDetails(false)
    setSelectedEmployee(null)
    setEditingId(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  const handleEdit = (employee: Employee) => {
    setError(null)
    setSuccess(null)
    setShowDetails(false)

    setEditingId(employee.id)

    setForm({
      user: employee.user,
      employee_id: employee.employee_id,
      department: employee.department,
      designation: employee.designation,
      joining_date: employee.joining_date,
      employment_type: employee.employment_type,
      employment_status: employee.employment_status,
      manager: employee.manager,
      date_of_birth: employee.date_of_birth,
      address: employee.address,
      emergency_contact: employee.emergency_contact,
    })

    setShowForm(true)
  }

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowForm(false)
    setShowDetails(true)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.user) {
      setError("User is required.")
      return
    }

    if (!form.employee_id.trim()) {
      setError("Employee ID is required.")
      return
    }

    if (!form.joining_date) {
      setError("Joining date is required.")
      return
    }

    if (
      form.designation !== null &&
      form.department === null
    ) {
      setError(
        "Please select a department before selecting a designation.",
      )
      return
    }

    if (
      form.designation !== null &&
      !designations.some(
        (designation) =>
          designation.id === form.designation &&
          designation.department === form.department,
      )
    ) {
      setError(
        "Selected designation does not belong to the selected department.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: EmployeePayload = {
        ...form,
        employee_id: form.employee_id
          .trim()
          .toUpperCase(),
        address: form.address?.trim() ?? "",
        emergency_contact:
          form.emergency_contact?.trim() ?? "",
      }

      if (editingId !== null) {
        await updateEmployee(editingId, payload)

        setSuccess(
          "Employee updated successfully.",
        )
      } else {
        await createEmployee(payload)

        setSuccess(
          "Employee created successfully.",
        )
      }

      resetForm()
      await loadEmployees()
    } catch {
      setError(
        editingId !== null
          ? "Unable to update employee."
          : "Unable to create employee.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?",
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deleteEmployee(id)

      setSuccess(
        "Employee deleted successfully.",
      )

      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null)
        setShowDetails(false)
      }

      await loadEmployees()
    } catch {
      setError("Unable to delete employee.")
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setDepartmentFilter("")
    setDesignationFilter("")
    setEmploymentTypeFilter("")
    setStatusFilter("")
    setPage(1)
  }

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value)
    setPage(1)
  }

  const handleDepartmentFilter = (
    value: string,
  ) => {
    setDepartmentFilter(value)
    setDesignationFilter("")
    setPage(1)
  }

  const handlePrevious = () => {
    if (previousPage && page > 1) {
      setPage((current) => current - 1)
    }
  }

  const handleNext = () => {
    if (nextPage) {
      setPage((current) => current + 1)
    }
  }

  const getUserName = (userId: number) => {
    const user = users.find(
      (item) => item.id === userId,
    )

    if (!user) {
      return "-"
    }

    const name =
      `${user.first_name} ${user.last_name}`.trim()

    return name || user.username
  }

  const getDepartmentName = (
    employee: Employee,
  ) =>
    employee.department_name ||
    departments.find(
      (department) =>
        department.id === employee.department,
    )?.name ||
    "-"

  const getDesignationName = (
    employee: Employee,
  ) =>
    employee.designation_name ||
    designations.find(
      (designation) =>
        designation.id === employee.designation,
    )?.name ||
    "-"

  const startRecord =
    totalEmployees === 0
      ? 0
      : (page - 1) * pageSize + 1

  const endRecord = Math.min(
    page * pageSize,
    totalEmployees,
  )

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "22px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "26px",
                padding: "0 10px",
                borderRadius: "6px",
                background: theme.blueBackground,
                color: theme.blueText,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              HR Management / Employees
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                lineHeight: 1.2,
                fontWeight: 700,
                color: theme.textHeading,
              }}
            >
              Employees
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: theme.textMuted,
                fontSize: "13px",
              }}
            >
              Manage employee information, employment details, and workforce records.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            style={{
              height: "40px",
              padding: "0 18px",
              border: "none",
              borderRadius: "7px",
              background: "#315efb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow:
                "0 4px 10px rgba(49, 94, 251, 0.18)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                marginRight: "7px",
                borderRadius: "4px",
                background:
                  "rgba(255, 255, 255, 0.18)",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              +
            </span>
            Add Employee
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          {[
            {
              label: "Total Employees",
              value: totalEmployees,
              description:
                "Total employee records",
            },
            {
              label: "Active Employees",
              value:
                totalEmployees > 0
                  ? activeCount
                  : 0,
              description:
                "Currently active",
            },
            {
              label: "Other Status",
              value:
                totalEmployees > 0
                  ? inactiveCount
                  : 0,
              description:
                "Inactive, resigned or terminated",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  color: theme.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "25px",
                  fontWeight: 700,
                  color: theme.textHeading,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: "5px",
                  color: theme.textSubtle,
                  fontSize: "11px",
                }}
              >
                {item.description}
              </div>
            </div>
          ))}
        </section>

        {error && (
          <div
            role="alert"
            style={{
              ...cardStyle,
              padding: "12px 15px",
              marginBottom: "16px",
              color: theme.dangerText,
              background: theme.dangerBackground,
              borderColor: theme.dangerBorder,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              ...cardStyle,
              padding: "12px 15px",
              marginBottom: "16px",
              color: theme.successText,
              background: theme.successBackground,
              borderColor: theme.successBorder,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            ...cardStyle,
            marginBottom: "16px",
            padding: "15px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2fr) repeat(4, minmax(145px, 1fr)) auto",
              gap: "10px",
              alignItems: "end",
            }}
          >
            <label style={labelStyle}>
              Search

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value,
                    )
                  }
                  placeholder="Search employee..."
                  style={{
                    ...inputStyle,
                    paddingLeft: "34px",
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "11px",
                    color: theme.placeholder,
                    fontSize: "13px",
                  }}
                >
                  Q
                </span>
              </div>
            </label>

            <label style={labelStyle}>
              Department

              <select
                value={departmentFilter}
                onChange={(event) =>
                  handleDepartmentFilter(
                    event.target.value,
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  All Departments
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label style={labelStyle}>
              Designation

              <select
                value={designationFilter}
                onChange={(event) => {
                  setDesignationFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Designations
                </option>

                {designations
                  .filter(
                    (designation) =>
                      !departmentFilter ||
                      designation.department ===
                        Number(
                          departmentFilter,
                        ),
                  )
                  .map((designation) => (
                    <option
                      key={designation.id}
                      value={designation.id}
                    >
                      {designation.name}
                    </option>
                  ))}
              </select>
            </label>

            <label style={labelStyle}>
              Employment Type

              <select
                value={employmentTypeFilter}
                onChange={(event) => {
                  setEmploymentTypeFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Types
                </option>

                {employmentTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {formatValue(type)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label style={labelStyle}>
              Status

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Status
                </option>

                {employmentStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatValue(status)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              style={{
                height: "40px",
                padding: "0 13px",
                border:
                  `1px solid ${theme.borderSoft}`,
                borderRadius: "7px",
                background: theme.inputBackground,
                color: theme.textSecondary,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </button>
          </div>
        </section>

        {showForm && (
          <section
            style={{
              ...cardStyle,
              marginBottom: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom:
                  `1px solid ${theme.border}`,
                background: theme.cardBackgroundAlt,
              }}
            >
              <div>
                <div
                  style={{
                    color: theme.blueText,
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Employee Information
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: "17px",
                    color: theme.textHeading,
                  }}
                >
                  {editingId !== null
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  border:
                    `1px solid ${theme.borderSoft}`,
                  borderRadius: "6px",
                  background: theme.inputBackground,
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "16px",
                padding: "20px",
              }}
            >
              <label style={labelStyle}>
                User

                <select
                  value={form.user || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      user: Number(
                        event.target.value,
                      ),
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  <option value="">
                    Select user
                  </option>

                  {users
                    .filter(
                      (user) =>
                        user.is_active &&
                        (editingId !== null ||
                          !employees.some(
                            (employee) =>
                              employee.user ===
                              user.id,
                          )),
                    )
                    .map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {getUserName(user.id)} -{" "}
                        {user.username}
                      </option>
                    ))}
                </select>
              </label>

              <label style={labelStyle}>
                Employee ID

                <input
                  type="text"
                  value={form.employee_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employee_id:
                        event.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="EMP-001"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Department

                <select
                  value={
                    form.department ?? ""
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value
                        ? Number(
                            event.target.value,
                          )
                        : null

                    setForm((current) => ({
                      ...current,
                      department: value,
                      designation: null,
                    }))
                  }}
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Designation

                <select
                  value={
                    form.designation ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      designation:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }))
                  }
                  disabled={
                    isSubmitting ||
                    !form.department
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select designation
                  </option>

                  {filteredDesignations.map(
                    (designation) => (
                      <option
                        key={designation.id}
                        value={designation.id}
                      >
                        {designation.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Joining Date

                <input
                  type="date"
                  value={form.joining_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      joining_date:
                        event.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Employment Type

                <select
                  value={
                    form.employment_type
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_type:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  {employmentTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {formatValue(type)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Employment Status

                <select
                  value={
                    form.employment_status
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_status:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  {employmentStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatValue(status)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Manager ID

                <input
                  type="number"
                  min="1"
                  value={
                    form.manager ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      manager:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }))
                  }
                  disabled={isSubmitting}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Date of Birth

                <input
                  type="date"
                  value={
                    form.date_of_birth ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date_of_birth:
                        event.target.value ||
                        null,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Emergency Contact

                <input
                  type="text"
                  value={
                    form.emergency_contact ??
                    ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emergency_contact:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  placeholder="Phone number"
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Address

                <textarea
                  value={form.address ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Employee address"
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: "80px",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  paddingTop: "15px",
                  borderTop:
                    `1px solid ${theme.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    border:
                      `1px solid ${theme.borderSoft}`,
                    borderRadius: "7px",
                    background:
                      theme.inputBackground,
                    color: theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    height: "38px",
                    padding: "0 18px",
                    border: "none",
                    borderRadius: "7px",
                    background:
                      isSubmitting
                        ? "#647de0"
                        : "#315efb",
                    color: "#ffffff",
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
              </div>
            </form>
          </section>
        )}

        {showDetails &&
          selectedEmployee && (
            <section
              style={{
                ...cardStyle,
                marginBottom: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom:
                    `1px solid ${theme.border}`,
                  background:
                    theme.cardBackgroundAlt,
                }}
              >
                <div>
                  <div
                    style={{
                      color: theme.blueText,
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                    }}
                  >
                    EMPLOYEE DETAILS
                  </div>

                  <h2
                    style={{
                      margin: "5px 0 0",
                      color: theme.textHeading,
                      fontSize: "18px",
                    }}
                  >
                    {selectedEmployee.full_name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedEmployee(null)
                  }}
                  style={{
                    height: "34px",
                    padding: "0 12px",
                    border:
                      `1px solid ${theme.borderSoft}`,
                    borderRadius: "6px",
                    background:
                      theme.inputBackground,
                    color: theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "20px",
                  padding: "22px",
                }}
              >
                {[
                  [
                    "Employee ID",
                    selectedEmployee.employee_id,
                  ],
                  [
                    "Email",
                    selectedEmployee.user_email,
                  ],
                  [
                    "Department",
                    selectedEmployee.department_name ||
                      "-",
                  ],
                  [
                    "Designation",
                    selectedEmployee.designation_name ||
                      "-",
                  ],
                  [
                    "Manager",
                    selectedEmployee.manager_name ||
                      "-",
                  ],
                  [
                    "Joining Date",
                    formatDate(
                      selectedEmployee.joining_date,
                    ),
                  ],
                  [
                    "Employment Type",
                    selectedEmployee.employment_type_label ||
                      formatValue(
                        selectedEmployee.employment_type,
                      ),
                  ],
                  [
                    "Status",
                    formatValue(
                      selectedEmployee.employment_status,
                    ),
                  ],
                  [
                    "Date of Birth",
                    selectedEmployee.date_of_birth
                      ? formatDate(
                          selectedEmployee.date_of_birth,
                        )
                      : "-",
                  ],
                  [
                    "Emergency Contact",
                    selectedEmployee.emergency_contact ||
                      "-",
                  ],
                  [
                    "Address",
                    selectedEmployee.address ||
                      "-",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div
                      style={{
                        color: theme.textSubtle,
                        fontSize: "11px",
                        fontWeight: 600,
                        marginBottom: "5px",
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        color: theme.textPrimary,
                        fontSize: "13px",
                        fontWeight: 600,
                        wordBreak: "break-word",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        <section
          style={{
            ...cardStyle,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
              padding: "16px 18px",
              borderBottom:
                `1px solid ${theme.border}`,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: theme.textHeading,
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Employee Directory
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  color: theme.textSubtle,
                  fontSize: "11px",
                }}
              >
                {totalEmployees} employee
                {totalEmployees === 1
                  ? ""
                  : "s"}{" "}
                found
              </p>
            </div>

            {isLoading && (
              <span
                style={{
                  color: theme.blueText,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Loading...
              </span>
            )}
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: theme.textMuted,
                fontSize: "13px",
              }}
            >
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: theme.textPrimary,
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                No employees found
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  color: theme.textSubtle,
                  fontSize: "12px",
                }}
              >
                Try changing your filters
                or add a new employee.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "1200px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          theme.cardBackgroundAlt,
                      }}
                    >
                      {[
                        "Employee",
                        "Employee ID",
                        "Department",
                        "Designation",
                        "Manager",
                        "Joining Date",
                        "Type",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "11px 14px",
                            textAlign: "left",
                            borderBottom:
                              `1px solid ${theme.borderTable}`,
                            color: theme.textMuted,
                            fontSize: "10px",
                            fontWeight: 700,
                            whiteSpace:
                              "nowrap",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.035em",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map(
                      (employee) => (
                        <tr
                          key={employee.id}
                          style={{
                            background:
                              theme.cardBackground,
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    "36px",
                                  height:
                                    "36px",
                                  flexShrink: 0,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  borderRadius:
                                    "50%",
                                  background:
                                    theme.avatarBackground,
                                  color:
                                    theme.avatarText,
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                {getInitials(
                                  employee.full_name,
                                )}
                              </div>

                              <div>
                                <div
                                  style={{
                                    color:
                                      theme.textPrimary,
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    employee.full_name
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "3px",
                                    color:
                                      theme.textSubtle,
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  {
                                    employee.user_email
                                  }
                                </div>
                              </div>
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              employee.employee_id
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDepartmentName(
                              employee,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDesignationName(
                              employee,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {employee.manager_name ||
                              "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatDate(
                              employee.joining_date,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {employee.employment_type_label ||
                              formatValue(
                                employee.employment_type,
                              )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                height:
                                  "24px",
                                padding:
                                  "0 9px",
                                borderRadius:
                                  "12px",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  700,
                                whiteSpace:
                                  "nowrap",
                                ...getStatusStyle(
                                  employee.employment_status,
                                ),
                              }}
                            >
                              {employee.employment_status_label ||
                                formatValue(
                                  employee.employment_status,
                                )}
                            </span>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "6px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    employee,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.borderSoft}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.inputBackground,
                                  color:
                                    theme.textSecondary,
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    employee,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.blueBorder}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.blueSoft,
                                  color:
                                    theme.blueText,
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  employee.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    employee.id,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.dangerBorder}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.dangerBackground,
                                  color:
                                    theme.dangerText,
                                  cursor:
                                    deletingId ===
                                    employee.id
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {deletingId ===
                                employee.id
                                  ? "..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                  padding: "13px 16px",
                  borderTop:
                    `1px solid ${theme.border}`,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    color: theme.textMuted,
                    fontSize: "11px",
                  }}
                >
                  Showing{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {startRecord}
                  </strong>{" "}
                  to{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {endRecord}
                  </strong>{" "}
                  of{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {totalEmployees}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      !previousPage ||
                      page <= 1
                    }
                    onClick={handlePrevious}
                    style={{
                      height: "32px",
                      padding: "0 11px",
                      border:
                        `1px solid ${theme.borderSoft}`,
                      borderRadius: "6px",
                      background:
                        !previousPage ||
                        page <= 1
                          ? theme.disabledBackground
                          : theme.inputBackground,
                      color:
                        !previousPage ||
                        page <= 1
                          ? theme.disabledText
                          : theme.textSecondary,
                      cursor:
                        !previousPage ||
                        page <= 1
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Previous
                  </button>

                  <span
                    style={{
                      minWidth: "32px",
                      height: "32px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      borderRadius: "6px",
                      background: "#315efb",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {page}
                  </span>

                  <span
                    style={{
                      color: theme.textMuted,
                      fontSize: "11px",
                    }}
                  >
                    of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!nextPage}
                    onClick={handleNext}
                    style={{
                      height: "32px",
                      padding: "0 11px",
                      border:
                        `1px solid ${theme.borderSoft}`,
                      borderRadius: "6px",
                      background: !nextPage
                        ? theme.disabledBackground
                        : theme.inputBackground,
                      color: !nextPage
                        ? theme.disabledText
                        : theme.textSecondary,
                      cursor: !nextPage
                        ? "not-allowed"
                        : "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      <style>
        {`
          input::placeholder,
          textarea::placeholder {
            color: ${theme.placeholder};
            opacity: 1;
          }

          select option {
            background: ${theme.inputBackground};
            color: ${theme.textPrimary};
          }

          input:focus,
          select:focus,
          textarea:focus {
            border-color: #315efb !important;
            box-shadow: 0 0 0 2px rgba(49, 94, 251, 0.12);
          }

          button {
            transition:
              background-color 0.15s ease,
              border-color 0.15s ease,
              color 0.15s ease;
          }

          @media (max-width: 1200px) {
            main section {
              max-width: 100%;
            }

            main > section > section:nth-child(4) > div {
              grid-template-columns:
                repeat(3, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 900px) {
            main {
              padding: 16px !important;
            }

            main > section > section:nth-child(2) {
              grid-template-columns:
                1fr !important;
            }

            main > section > section:nth-child(4) > div {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }

            form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 600px) {
            main {
              padding: 12px !important;
            }

            main > section > section:nth-child(4) > div {
              grid-template-columns:
                1fr !important;
            }

            form {
              grid-template-columns:
                1fr !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Employees