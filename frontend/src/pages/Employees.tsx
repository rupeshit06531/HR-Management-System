import {
  useEffect,
  useMemo,
  useState,
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
      setError(
        "User is required.",
      )
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

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor:
          "#f5f7fa",
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth:
            "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: "16px",
            marginBottom:
              "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color:
                  "#111827",
              }}
            >
              Employees
            </h1>

            <p
              style={{
                color:
                  "#6b7280",
              }}
            >
              Employee management
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleAdd
            }
            style={{
              padding:
                "10px 16px",
              border: "none",
              borderRadius:
                "6px",
              backgroundColor:
                "#2563eb",
              color:
                "#ffffff",
              cursor:
                "pointer",
            }}
          >
            Add Employee
          </button>
        </header>

        {error && (
          <section
            style={{
              padding:
                "16px",
              marginBottom:
                "20px",
              backgroundColor:
                "#fee2e2",
              borderRadius:
                "8px",
              color:
                "#991b1b",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            style={{
              padding:
                "16px",
              marginBottom:
                "20px",
              backgroundColor:
                "#dcfce7",
              borderRadius:
                "8px",
              color:
                "#166534",
            }}
          >
            {success}
          </section>
        )}

        {showForm && (
          <section
            style={{
              backgroundColor:
                "#ffffff",
              padding:
                "24px",
              borderRadius:
                "10px",
              marginBottom:
                "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                marginBottom:
                  "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color:
                    "#111827",
                }}
              >
                {editingId !==
                null
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <button
                type="button"
                onClick={
                  resetForm
                }
                style={{
                  padding:
                    "8px 14px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "6px",
                  backgroundColor:
                    "#ffffff",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <label>
                User

                <select
                  value={
                    form.user || ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        user:
                          Number(
                            event
                              .target
                              .value,
                          ),
                      }),
                    )
                  }
                  required
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
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
                    .map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.first_name ||
                          user.last_name
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : user.username}
                          {" — "}
                          {user.username}
                        </option>
                      ),
                    )}
                </select>
              </label>

              <label>
                Employee ID

                <input
                  type="text"
                  value={
                    form.employee_id
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        employee_id:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  required
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Department

                <select
                  value={
                    form.department ??
                    ""
                  }
                  onChange={(
                    event,
                  ) => {
                    const departmentId =
                      event
                        .target
                        .value
                        ? Number(
                            event
                              .target
                              .value,
                          )
                        : null

                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        department:
                          departmentId,
                        designation:
                          null,
                      }),
                    )
                  }}
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map(
                    (
                      department,
                    ) => (
                      <option
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {
                          department.name
                        }
                        {!department.is_active
                          ? " (Inactive)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Designation

                <select
                  value={
                    form.designation ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        designation:
                          event
                            .target
                            .value
                            ? Number(
                                event
                                  .target
                                  .value,
                              )
                            : null,
                      }),
                    )
                  }
                  disabled={
                    !form.department ||
                    filteredDesignations.length ===
                      0
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
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
                    (
                      designation,
                    ) => (
                      <option
                        key={
                          designation.id
                        }
                        value={
                          designation.id
                        }
                      >
                        {
                          designation.name
                        }
                        {!designation.is_active
                          ? " (Inactive)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Joining Date

                <input
                  type="date"
                  value={
                    form.joining_date
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        joining_date:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  required
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Employment Type

                <select
                  value={
                    form.employment_type
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        employment_type:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                  }}
                >
                  {employmentTypes.map(
                    (
                      type,
                    ) => (
                      <option
                        key={
                          type
                        }
                        value={
                          type
                        }
                      >
                        {formatValue(
                          type,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Employment Status

                <select
                  value={
                    form.employment_status
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        employment_status:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                  }}
                >
                  {employmentStatuses.map(
                    (
                      status,
                    ) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {formatValue(
                          status,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Manager ID

                <input
                  type="number"
                  value={
                    form.manager ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        manager:
                          event
                            .target
                            .value
                            ? Number(
                                event
                                  .target
                                  .value,
                              )
                            : null,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Date of Birth

                <input
                  type="date"
                  value={
                    form.date_of_birth ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        date_of_birth:
                          event
                            .target
                            .value ||
                          null,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Emergency Contact

                <input
                  type="text"
                  value={
                    form.emergency_contact ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        emergency_contact:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                Address

                <textarea
                  value={
                    form.address ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        address:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  rows={3}
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop:
                      "6px",
                    padding:
                      "10px",
                    boxSizing:
                      "border-box",
                    resize:
                      "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "none",
                    borderRadius:
                      "6px",
                    backgroundColor:
                      isSubmitting
                        ? "#9ca3af"
                        : "#16a34a",
                    color:
                      "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !==
                        null
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
              </div>
            </form>
          </section>
        )}

        {isLoading && (
          <p>
            Loading employees...
          </p>
        )}

        {!isLoading &&
          !error &&
          employees.length ===
            0 && (
            <section
              style={{
                backgroundColor:
                  "#ffffff",
                padding:
                  "24px",
                borderRadius:
                  "8px",
              }}
            >
              <p>
                No employees
                found.
              </p>
            </section>
          )}

        {!isLoading &&
          employees.length >
            0 && (
            <section
              style={{
                backgroundColor:
                  "#ffffff",
                borderRadius:
                  "8px",
                overflow:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "1100px",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Employee ID",
                      "Name",
                      "Department",
                      "Designation",
                      "Status",
                      "Joining Date",
                      "Actions",
                    ].map(
                      (
                        heading,
                      ) => (
                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "14px",
                            textAlign:
                              "left",
                            borderBottom:
                              "1px solid #e5e7eb",
                          }}
                        >
                          {
                            heading
                          }
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {employees.map(
                    (
                      employee,
                    ) => (
                      <tr
                        key={
                          employee.id
                        }
                      >
                        <td
                          style={{
                            padding:
                              "14px",
                            borderBottom:
                              "1px solid #f3f4f6",
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
                              "1px solid #f3f4f6",
                          }}
                        >
                          {
                            employee.full_name ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "14px",
                            borderBottom:
                              "1px solid #f3f4f6",
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
                              "1px solid #f3f4f6",
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
                              "1px solid #f3f4f6",
                          }}
                        >
                          {formatValue(
                            employee.employment_status,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px",
                            borderBottom:
                              "1px solid #f3f4f6",
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
                              "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
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
                                padding:
                                  "7px 12px",
                                border:
                                  "1px solid #2563eb",
                                borderRadius:
                                  "6px",
                                backgroundColor:
                                  "#ffffff",
                                color:
                                  "#2563eb",
                                cursor:
                                  "pointer",
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
                                padding:
                                  "7px 12px",
                                border:
                                  "none",
                                borderRadius:
                                  "6px",
                                backgroundColor:
                                  deletingId ===
                                  employee.id
                                    ? "#9ca3af"
                                    : "#dc2626",
                                color:
                                  "#ffffff",
                                cursor:
                                  deletingId ===
                                  employee.id
                                    ? "not-allowed"
                                    : "pointer",
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
            </section>
          )}
      </section>
    </main>
  )
}

export default Employees