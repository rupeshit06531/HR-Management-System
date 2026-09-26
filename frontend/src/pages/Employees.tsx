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
import EmployeeDetails from "./employees/EmployeeDetails"
import EmployeeDirectory from "./employees/EmployeeDirectory"
import EmployeePageHeader from "./employees/EmployeePageHeader"

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
        <EmployeePageHeader
          theme={theme}
          cardStyle={cardStyle}
          canManageEmployees={canManageEmployees}
          employeeSummary={employeeSummary}
          error={error}
          success={success}
          onAdd={handleAdd}
        />

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

        <EmployeeDetails
          theme={theme}
          cardStyle={cardStyle}
          employee={selectedEmployee}
          formatValue={formatValue}
          formatDate={formatDate}
          onClose={() => {
            setShowDetails(false)
            setSelectedEmployee(null)
          }}
        />

        <EmployeeDirectory
          theme={theme}
          cardStyle={cardStyle}
          employees={employees}
          canManageEmployees={canManageEmployees}
          isLoading={isLoading}
          deletingId={deletingId}
          totalEmployees={totalEmployees}
          page={page}
          totalPages={totalPages}
          startRecord={startRecord}
          endRecord={endRecord}
          nextPage={nextPage}
          previousPage={previousPage}
          formatValue={formatValue}
          formatDate={formatDate}
          getInitials={getInitials}
          getDepartmentName={getDepartmentName}
          getDesignationName={getDesignationName}
          getStatusStyle={getStatusStyle}
          handleView={handleView}
          handleEdit={handleEdit}
          handleDelete={(id) => {
            void handleDelete(id)
          }}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
        />

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