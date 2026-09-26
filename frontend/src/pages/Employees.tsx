import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"
import { useSearchParams } from "react-router-dom"

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getEmployeeSummary,
  updateEmployee,
  type Employee,
  type EmployeeListResponse,
  type EmployeePayload,
  type EmployeeSummary,
} from "../api/employees"

import {
  getDepartments,
  getDesignations,
  type Department,
  type Designation,
} from "../api/departments"

import {
  getUsers,
  type AuthUser,
} from "../api/accounts"

import { useTheme } from "../context/theme-context"
import { useConfirm } from "../context/confirmation-context"
import { useAuth } from "../context/auth-context"
import EmployeeFilters from "./employees/EmployeeFilters"
import EmployeeForm from "./employees/EmployeeForm"

import {
  containerStyle,
  emptyForm,
  employmentStatuses,
  employmentTypes,
  formatDate,
  formatValue,
  getInitials,
  loadAllPages,
} from "./employees/employee-utils"

function Employees() {
  const confirm = useConfirm()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const canManageEmployees =
    user?.role === "HR" || user?.role === "SUPER_ADMIN"
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedEmployeeId = searchParams.get("employee")

  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])

  const [totalEmployees, setTotalEmployees] = useState(0)
  const [employeeSummary, setEmployeeSummary] =
    useState<EmployeeSummary | null>(null)
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
  const employeeRequestIdRef = useRef(0)

  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null)

  const [form, setForm] =
    useState<EmployeePayload>(emptyForm)

  const theme = useMemo(() => {
    return {
      pageBackground: "var(--app-bg)",
      cardBackground: "var(--surface)",
      cardBackgroundAlt: "var(--surface-subtle)",
      inputBackground: "var(--surface)",
      inputBackgroundDisabled: "var(--surface-subtle)",
      border: "var(--border)",
      borderSoft: "var(--border-strong)",
      borderTable: "var(--border)",
      borderRow: "var(--border-light)",
      textPrimary: "var(--text-primary)",
      textHeading: "var(--text-primary)",
      textSecondary: "var(--text-secondary)",
      textMuted: "var(--text-muted)",
      textSubtle: "var(--text-muted)",
      placeholder: "var(--text-placeholder)",
      blueBackground: "var(--app-primary-soft)",
      blueSoft: "var(--surface-subtle)",
      blueText: "var(--app-primary)",
      blueBorder: "var(--border-focus)",
      white: "var(--white)",
      dangerBackground: isDarkMode ? "#2a1515" : "var(--danger-50)",
      dangerBorder: isDarkMode ? "#5f2929" : "var(--danger-100)",
      dangerText: isDarkMode ? "#fca5a5" : "var(--danger-700)",
      successBackground: isDarkMode ? "#10251b" : "var(--success-50)",
      successBorder: isDarkMode ? "#23583b" : "var(--success-100)",
      successText: isDarkMode ? "#86efac" : "var(--success-700)",
      disabledBackground: "var(--surface-subtle)",
      disabledText: "var(--text-muted)",
      avatarBackground: "var(--app-primary-soft)",
      avatarText: "var(--app-primary)",
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
    borderRadius: "14px",
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
    borderRadius: "10px",
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

  const totalPages = Math.max(
    1,
    Math.ceil(totalEmployees / pageSize),
  )

  const loadEmployees = useCallback(async () => {
    const requestId = ++employeeRequestIdRef.current

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

      if (requestId !== employeeRequestIdRef.current) {
        return
      }

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
      if (requestId === employeeRequestIdRef.current) {
        setError("Unable to load employee data.")
      }
    } finally {
      if (requestId === employeeRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [
    page,
    search,
    departmentFilter,
    designationFilter,
    employmentTypeFilter,
    statusFilter,
  ])

  const loadDepartments = async () => {
    setDepartments(
      await loadAllPages((pageNumber) =>
        getDepartments({ page: pageNumber }),
      ),
    )
  }

  const loadDesignations = async () => {
    setDesignations(
      await loadAllPages((pageNumber) =>
        getDesignations({ page: pageNumber }),
      ),
    )
  }

  const loadUsers = async () => {
    setUsers(
      await loadAllPages((pageNumber) =>
        getUsers({ page: pageNumber }),
      ),
    )
  }

  const loadEmployeeSummary = async () => {
    try {
      setEmployeeSummary(await getEmployeeSummary())
    } catch {
      setEmployeeSummary(null)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    const loadSupportingData = async () => {
      try {
        await Promise.all([
          loadDepartments(),
          loadDesignations(),
          ...(canManageEmployees ? [loadUsers()] : []),
        ])
      } catch {
        setError(
          "Unable to load employee supporting data.",
        )
      }
    }

    void loadSupportingData()
    void loadEmployeeSummary()
  }, [canManageEmployees])

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

  useEffect(() => {
    if (!requestedEmployeeId) return

    const employeeId = Number(requestedEmployeeId)
    let isCurrentRequest = true

    const clearEmployeeQuery = () => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete("employee")
        return next
      }, { replace: true })
    }

    if (!Number.isInteger(employeeId) || employeeId < 1) {
      clearEmployeeQuery()
      return
    }

    const openRequestedEmployee = async () => {
      try {
        const employee = await getEmployeeById(employeeId)
        if (!isCurrentRequest) return

        setSelectedEmployee(employee)
        setShowForm(false)
        setShowDetails(true)
      } catch {
        if (isCurrentRequest) {
          setError("Unable to open the selected employee record.")
        }
      } finally {
        if (isCurrentRequest) clearEmployeeQuery()
      }
    }

    void openRequestedEmployee()

    return () => {
      isCurrentRequest = false
    }
  }, [requestedEmployeeId, setSearchParams])

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
    const confirmed = await confirm({
      title: "Delete employee?",
      message: "This employee record will be permanently deleted.",
      confirmLabel: "Delete employee",
    })

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
    <main className="employees-page" style={pageStyle}>
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

          {canManageEmployees && <button
            type="button"
            onClick={handleAdd}
            style={{
              height: "40px",
              padding: "0 18px",
              border: "none",
              borderRadius: "7px",
              background: "var(--app-primary)",
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
          </button>}
        </header>

        <section
          className="employees-stats"
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
              value: employeeSummary?.total ?? "—",
              description:
                "In your organization or team",
            },
            {
              label: "Active Employees",
              value: employeeSummary?.active ?? "—",
              description:
                "Currently active employees",
            },
            {
              label: "Other Status",
              value: employeeSummary
                ? employeeSummary.inactive +
                  employeeSummary.resigned +
                  employeeSummary.terminated
                : "—",
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

        <EmployeeFilters
          theme={theme}
          cardStyle={cardStyle}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          search={search}
          departmentFilter={departmentFilter}
          designationFilter={designationFilter}
          employmentTypeFilter={employmentTypeFilter}
          statusFilter={statusFilter}
          departments={departments}
          designations={designations}
          employmentTypes={employmentTypes}
          employmentStatuses={employmentStatuses}
          formatValue={formatValue}
          handleSearchChange={handleSearchChange}
          handleDepartmentFilter={handleDepartmentFilter}
          setDesignationFilter={(value) => setDesignationFilter(value)}
          setEmploymentTypeFilter={(value) => setEmploymentTypeFilter(value)}
          setStatusFilter={(value) => setStatusFilter(value)}
          setPage={setPage}
          clearFilters={clearFilters}
        />

        {canManageEmployees && showForm && (
          <EmployeeForm
            theme={theme}
            cardStyle={cardStyle}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
            editingId={editingId}
            isSubmitting={isSubmitting}
            form={form}
            setForm={setForm}
            users={users}
            employees={employees}
            departments={departments}
            filteredDesignations={filteredDesignations}
            employmentTypes={employmentTypes}
            employmentStatuses={employmentStatuses}
            formatValue={formatValue}
            getUserName={getUserName}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
          />
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
          className="employees-directory"
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
                        ...(canManageEmployees ? ["Actions"] : []),
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

                              {canManageEmployees && <button
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
                              </button>}

                              {canManageEmployees && <button
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
                              </button>}
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
                      background: "var(--app-primary)",
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
          .employees-page input::placeholder,
          .employees-page textarea::placeholder {
            color: ${theme.placeholder};
            opacity: 1;
          }

          .employees-page select option {
            background: ${theme.inputBackground};
            color: ${theme.textPrimary};
          }

          .employees-page input:focus,
          .employees-page select:focus,
          .employees-page textarea:focus {
            border-color: var(--app-primary) !important;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
          }

          .employees-page button {
            transition:
              background-color 0.15s ease,
              border-color 0.15s ease,
              color 0.15s ease;
          }

          @media (max-width: 1200px) {
            .employees-page section {
              max-width: 100%;
            }

            .employees-filters > div {
              grid-template-columns:
                repeat(3, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 900px) {
            .employees-page {
              padding: 16px !important;
            }

            .employees-stats {
              grid-template-columns:
                repeat(3, minmax(0, 1fr)) !important;
            }

            .employees-filters > div {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }

            .employees-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 600px) {
            .employees-page {
              padding: 12px !important;
            }

            .employees-filters > div {
              grid-template-columns:
                1fr !important;
            }

            .employees-form {
              grid-template-columns:
                1fr !important;
            }

            .employees-stats {
              grid-template-columns:
                1fr !important;
            }

            .employees-directory > div:first-child {
              align-items: flex-start !important;
              flex-direction: column !important;
              padding: 14px !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Employees