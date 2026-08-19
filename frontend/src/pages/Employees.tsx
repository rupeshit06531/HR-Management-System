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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px",
  boxSizing: "border-box",
  background: "#f8fafc",
  fontFamily:
    'Inter, "Segoe UI", Roboto, Arial, sans-serif',
  color: "#0f172a",
}

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  boxShadow:
    "0 2px 8px rgba(15, 23, 42, 0.04)",
}

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  padding: "9px 12px",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "13px",
  outline: "none",
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
}

function Employees() {
  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [departments, setDepartments] =
    useState<Department[]>([])

  const [designations, setDesignations] =
    useState<Designation[]>([])

  const [users, setUsers] =
    useState<AuthUser[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<EmployeePayload>(
      emptyForm,
    )

  const loadEmployees = async () => {
    const response =
      await getEmployees()

    if (Array.isArray(response)) {
      setEmployees(response)
    } else {
      const paginated =
        response as EmployeeListResponse

      setEmployees(
        paginated.results ?? [],
      )
    }
  }

  const loadDepartments = async () => {
    const response =
      await getDepartments()

    if (Array.isArray(response)) {
      setDepartments(response)
    } else {
      const paginated =
        response as DepartmentListResponse

      setDepartments(
        paginated.results ?? [],
      )
    }
  }

  const loadDesignations = async () => {
    const response =
      await getDesignations()

    if (Array.isArray(response)) {
      setDesignations(response)
    } else {
      const paginated =
        response as DesignationListResponse

      setDesignations(
        paginated.results ?? [],
      )
    }
  }

  const loadUsers = async () => {
    const response =
      await getUsers()

    if (Array.isArray(response)) {
      setUsers(response)
    } else {
      const paginated =
        response as UserListResponse

      setUsers(
        paginated.results ?? [],
      )
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await Promise.all([
        loadEmployees(),
        loadDepartments(),
        loadDesignations(),
        loadUsers(),
      ])
    } catch {
      setError(
        "Unable to load employee data.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredDesignations =
    useMemo(() => {
      if (!form.department) {
        return []
      }

      return designations.filter(
        (designation) =>
          designation.department ===
          form.department,
      )
    }, [
      designations,
      form.department,
    ])

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.employment_status ===
          "ACTIVE",
      ).length,
    [employees],
  )

  const inactiveEmployees =
    employees.length -
    activeEmployees

  const resetForm = () => {
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setError(null)
    setSuccess(null)
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (
    employee: Employee,
  ) => {
    setError(null)
    setSuccess(null)

    setEditingId(employee.id)

    setForm({
      user: employee.user,
      employee_id:
        employee.employee_id,
      department:
        employee.department,
      designation:
        employee.designation,
      joining_date:
        employee.joining_date,
      employment_type:
        employee.employment_type,
      employment_status:
        employee.employment_status,
      manager:
        employee.manager,
      date_of_birth:
        employee.date_of_birth,
      address:
        employee.address,
      emergency_contact:
        employee.emergency_contact,
    })

    setShowForm(true)
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
      setError(
        "Employee ID is required.",
      )
      return
    }

    if (!form.joining_date) {
      setError(
        "Joining date is required.",
      )
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
          designation.id ===
            form.designation &&
          designation.department ===
            form.department,
      )
    ) {
      setError(
        "Selected designation does not belong to the selected department.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: EmployeePayload =
        {
          ...form,
          employee_id:
            form.employee_id
              .trim()
              .toUpperCase(),
          address:
            form.address?.trim() ?? "",
          emergency_contact:
            form.emergency_contact?.trim() ??
            "",
        }

      if (editingId !== null) {
        const updated =
          await updateEmployee(
            editingId,
            payload,
          )

        setEmployees(
          (current) =>
            current.map(
              (employee) =>
                employee.id ===
                editingId
                  ? updated
                  : employee,
            ),
        )

        setSuccess(
          "Employee updated successfully.",
        )
      } else {
        const created =
          await createEmployee(
            payload,
          )

        setEmployees(
          (current) => [
            created,
            ...current,
          ],
        )

        setSuccess(
          "Employee created successfully.",
        )
      }

      resetForm()
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

  const handleDelete = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
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

      setEmployees(
        (current) =>
          current.filter(
            (employee) =>
              employee.id !== id,
          ),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess(
        "Employee deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete employee.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatValue = (
    value: string,
  ) =>
    value
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )

  const getDepartmentName = (
    departmentId: number | null,
  ) => {
    if (!departmentId) {
      return "-"
    }

    return (
      departments.find(
        (department) =>
          department.id ===
          departmentId,
      )?.name ?? String(departmentId)
    )
  }

  const getDesignationName = (
    designationId: number | null,
  ) => {
    if (!designationId) {
      return "-"
    }

    return (
      designations.find(
        (designation) =>
          designation.id ===
          designationId,
      )?.name ?? String(designationId)
    )
  }

  const getStatusStyle = (
    status: string,
  ): CSSProperties => {
    if (status === "ACTIVE") {
      return {
        color: "#166534",
        background: "#dcfce7",
      }
    }

    if (status === "INACTIVE") {
      return {
        color: "#475569",
        background: "#e2e8f0",
      }
    }

    if (status === "RESIGNED") {
      return {
        color: "#92400e",
        background: "#fef3c7",
      }
    }

    return {
      color: "#991b1b",
      background: "#fee2e2",
    }
  }

  const getUserName = (
    userId: number,
  ) => {
    const user = users.find(
      (item) => item.id === userId,
    )

    if (!user) {
      return String(userId)
    }

    const fullName =
      `${user.first_name} ${user.last_name}`.trim()

    return fullName || user.username
  }

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 7px",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Workforce Management
            </p>

            <h1
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "30px",
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: "-0.025em",
              }}
            >
              Employees
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Manage employee records,
              organizational structure and
              employment information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            style={{
              minHeight: "42px",
              padding: "0 16px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow:
                "0 5px 14px rgba(37, 99, 235, 0.18)",
            }}
          >
            Add Employee
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              label: "Total Employees",
              value: employees.length,
              detail:
                "All employee records",
            },
            {
              label: "Active Employees",
              value: activeEmployees,
              detail:
                "Currently employed",
            },
            {
              label: "Other Status",
              value: inactiveEmployees,
              detail:
                "Inactive, resigned or terminated",
            },
          ].map((item) => (
            <section
              key={item.label}
              style={{
                ...cardStyle,
                padding: "18px 20px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <strong
                  style={{
                    color: "#0f172a",
                    fontSize: "27px",
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </strong>
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#94a3b8",
                  fontSize: "11px",
                }}
              >
                {item.detail}
              </p>
            </section>
          ))}
        </section>

        {error && (
          <section
            role="alert"
            style={{
              ...cardStyle,
              padding: "13px 16px",
              marginBottom: "18px",
              borderColor: "#fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              ...cardStyle,
              padding: "13px 16px",
              marginBottom: "18px",
              borderColor: "#bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {success}
          </section>
        )}

        {showForm && (
          <section
            style={{
              ...cardStyle,
              marginBottom: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "18px 20px",
                borderBottom:
                  "1px solid #e2e8f0",
                background: "#f8fafc",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#2563eb",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Employee Record
                </p>

                <h2
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "18px",
                    fontWeight: 800,
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
                  minHeight: "36px",
                  padding: "0 13px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "7px",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: isSubmitting
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "18px",
                padding: "22px",
              }}
            >
              <label style={labelStyle}>
                User
                <select
                  value={form.user || ""}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        user: Number(
                          event.target.value,
                        ),
                      }),
                    )
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
                        (
                          editingId !==
                            null ||
                          !employees.some(
                            (employee) =>
                              employee.user ===
                              user.id,
                          )
                        ),
                    )
                    .map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {getUserName(user.id)}
                        {" - "}
                        {user.username}
                      </option>
                    ))}
                </select>
              </label>

              <label style={labelStyle}>
                Employee ID
                <input
                  type="text"
                  value={
                    form.employee_id
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        employee_id:
                          event.target.value,
                      }),
                    )
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. EMP-001"
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
                    const departmentId =
                      event.target.value
                        ? Number(
                            event.target.value,
                          )
                        : null

                    setForm(
                      (current) => ({
                        ...current,
                        department:
                          departmentId,
                        designation: null,
                      }),
                    )
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
                        value={
                          department.id
                        }
                      >
                        {department.name}
                        {!department.is_active
                          ? " (Inactive)"
                          : ""}
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
                    setForm(
                      (current) => ({
                        ...current,
                        designation:
                          event.target.value
                            ? Number(
                                event.target.value,
                              )
                            : null,
                      }),
                    )
                  }
                  disabled={
                    isSubmitting ||
                    !form.department ||
                    filteredDesignations.length ===
                      0
                  }
                  style={{
                    ...inputStyle,
                    background:
                      !form.department ||
                      filteredDesignations.length ===
                        0
                        ? "#f8fafc"
                        : "#ffffff",
                  }}
                >
                  <option value="">
                    {!form.department
                      ? "Select department first"
                      : filteredDesignations.length ===
                          0
                        ? "No designations available"
                        : "Select designation"}
                  </option>

                  {filteredDesignations.map(
                    (designation) => (
                      <option
                        key={
                          designation.id
                        }
                        value={
                          designation.id
                        }
                      >
                        {designation.name}
                        {!designation.is_active
                          ? " (Inactive)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Joining Date
                <input
                  type="date"
                  value={
                    form.joining_date
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        joining_date:
                          event.target.value,
                      }),
                    )
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
                    setForm(
                      (current) => ({
                        ...current,
                        employment_type:
                          event.target.value,
                      }),
                    )
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
                    setForm(
                      (current) => ({
                        ...current,
                        employment_status:
                          event.target.value,
                      }),
                    )
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
                    setForm(
                      (current) => ({
                        ...current,
                        manager:
                          event.target.value
                            ? Number(
                                event.target.value,
                              )
                            : null,
                      }),
                    )
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
                    form.date_of_birth ??
                    ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        date_of_birth:
                          event.target.value ||
                          null,
                      }),
                    )
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
                    setForm(
                      (current) => ({
                        ...current,
                        emergency_contact:
                          event.target.value,
                      }),
                    )
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
                  value={
                    form.address ?? ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        address:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Employee residential address"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "84px",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  paddingTop: "2px",
                  borderTop:
                    "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    minHeight: "40px",
                    padding: "0 15px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#475569",
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    minHeight: "40px",
                    padding: "0 18px",
                    border: "none",
                    borderRadius: "8px",
                    background:
                      isSubmitting
                        ? "#93c5fd"
                        : "#2563eb",
                    color: "#ffffff",
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                    fontWeight: 800,
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

        {isLoading && (
          <section
            style={{
              ...cardStyle,
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                margin: "0 auto 12px",
                border:
                  "3px solid #dbeafe",
                borderTopColor:
                  "#2563eb",
                borderRadius: "50%",
                animation:
                  "employees-spin 0.8s linear infinite",
              }}
            />

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Loading employees...
            </p>

            <style>
              {`
                @keyframes employees-spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
          </section>
        )}

        {!isLoading &&
          !error &&
          employees.length === 0 && (
            <section
              style={{
                ...cardStyle,
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#334155",
                  fontSize: "18px",
                }}
              >
                No employees found
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Add your first employee
                record to begin managing
                the workforce.
              </p>

              <button
                type="button"
                onClick={handleAdd}
                style={{
                  marginTop: "18px",
                  minHeight: "38px",
                  padding: "0 15px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Add Employee
              </button>
            </section>
          )}

        {!isLoading &&
          employees.length > 0 && (
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
                  justifyContent:
                    "space-between",
                  gap: "12px",
                  padding: "16px 18px",
                  borderBottom:
                    "1px solid #e2e8f0",
                  background: "#ffffff",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: "15px",
                      fontWeight: 800,
                    }}
                  >
                    Employee Directory
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#94a3b8",
                      fontSize: "11px",
                    }}
                  >
                    {employees.length}{" "}
                    employee
                    {employees.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    in the organization
                  </p>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "1080px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "#f8fafc",
                      }}
                    >
                      {[
                        "Employee ID",
                        "Employee",
                        "Department",
                        "Designation",
                        "Status",
                        "Joining Date",
                        "Actions",
                      ].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            style={{
                              padding:
                                "11px 14px",
                              textAlign:
                                "left",
                              color:
                                "#64748b",
                              borderBottom:
                                "1px solid #e2e8f0",
                              fontSize:
                                "10px",
                              fontWeight:
                                800,
                              letterSpacing:
                                "0.04em",
                              textTransform:
                                "uppercase",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map(
                      (employee) => (
                        <tr
                          key={
                            employee.id
                          }
                          style={{
                            transition:
                              "background 0.15s ease",
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              color:
                                "#334155",
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
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
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
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
                                    "34px",
                                  height:
                                    "34px",
                                  flexShrink:
                                    0,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  borderRadius:
                                    "9px",
                                  background:
                                    "#eff6ff",
                                  color:
                                    "#2563eb",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                {(
                                  employee.full_name ||
                                  "E"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <div
                                  style={{
                                    color:
                                      "#0f172a",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {employee.full_name ||
                                    "-"}
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "3px",
                                    color:
                                      "#94a3b8",
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  {
                                    getUserName(
                                      employee.user,
                                    )
                                  }
                                </div>
                              </div>
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              color:
                                "#475569",
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDepartmentName(
                              employee.department,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              color:
                                "#475569",
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDesignationName(
                              employee.designation,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                minHeight:
                                  "24px",
                                padding:
                                  "0 9px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  800,
                                ...getStatusStyle(
                                  employee.employment_status,
                                ),
                              }}
                            >
                              {formatValue(
                                employee.employment_status,
                              )}
                            </span>
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              color:
                                "#475569",
                              fontSize:
                                "12px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              employee.joining_date
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "7px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    employee,
                                  )
                                }
                                style={{
                                  minHeight:
                                    "30px",
                                  padding:
                                    "0 10px",
                                  border:
                                    "1px solid #bfdbfe",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "#eff6ff",
                                  color:
                                    "#1d4ed8",
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    700,
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
                                  minHeight:
                                    "30px",
                                  padding:
                                    "0 10px",
                                  border:
                                    "1px solid #fecaca",
                                  borderRadius:
                                    "6px",
                                  background:
                                    deletingId ===
                                    employee.id
                                      ? "#f1f5f9"
                                      : "#fef2f2",
                                  color:
                                    deletingId ===
                                    employee.id
                                      ? "#94a3b8"
                                      : "#b91c1c",
                                  cursor:
                                    deletingId ===
                                    employee.id
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    700,
                                }}
                              >
                                {deletingId ===
                                employee.id
                                  ? "Deleting..."
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
            </section>
          )}
      </section>

      <style>
        {`
          @media (max-width: 1000px) {
            main {
              padding: 22px !important;
            }

            main section form {
              grid-template-columns: repeat(
                2,
                minmax(0, 1fr)
              ) !important;
            }
          }

          @media (max-width: 680px) {
            main {
              padding: 16px !important;
            }

            main section form {
              grid-template-columns: 1fr !important;
            }

            main section form label[style*="grid-column"] {
              grid-column: auto !important;
            }

            main section form > div {
              grid-column: auto !important;
              flex-wrap: wrap;
            }

            main > section > section:first-of-type {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Employees