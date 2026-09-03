import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import {
  createDepartment,
  createDesignation,
  deleteDepartment,
  deleteDesignation,
  getDepartments,
  getDesignations,
  updateDepartment,
  updateDesignation,
  type Department,
  type DepartmentListResponse,
  type DepartmentPayload,
  type Designation,
  type DesignationListResponse,
  type DesignationPayload,
} from "../api/departments"

const createEmptyDepartment = (): DepartmentPayload => ({
  name: "",
  description: "",
  is_active: true,
})

const createEmptyDesignation = (): DesignationPayload => ({
  name: "",
  department: 0,
  is_active: true,
})

function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isDepartmentSubmitting, setIsDepartmentSubmitting] =
    useState(false)

  const [isDesignationSubmitting, setIsDesignationSubmitting] =
    useState(false)

  const [deletingDepartmentId, setDeletingDepartmentId] =
    useState<number | null>(null)

  const [deletingDesignationId, setDeletingDesignationId] =
    useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [showDesignationForm, setShowDesignationForm] = useState(false)

  const [editingDepartmentId, setEditingDepartmentId] =
    useState<number | null>(null)

  const [editingDesignationId, setEditingDesignationId] =
    useState<number | null>(null)

  const [departmentForm, setDepartmentForm] =
    useState<DepartmentPayload>(createEmptyDepartment())

  const [designationForm, setDesignationForm] =
    useState<DesignationPayload>(createEmptyDesignation())

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [departmentResponse, designationResponse] =
        await Promise.all([
          getDepartments(),
          getDesignations(),
        ])

      const departmentData = Array.isArray(departmentResponse)
        ? departmentResponse
        : (departmentResponse as DepartmentListResponse).results ?? []

      const designationData = Array.isArray(designationResponse)
        ? designationResponse
        : (designationResponse as DesignationListResponse).results ?? []

      setDepartments(departmentData)
      setDesignations(designationData)
    } catch {
      setError(
        "Unable to load departments and designations. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active),
    [departments],
  )

  const activeDesignations = useMemo(
    () => designations.filter((designation) => designation.is_active),
    [designations],
  )

  const inactiveDepartments = departments.length - activeDepartments.length

  const resetDepartmentForm = () => {
    setDepartmentForm(createEmptyDepartment())
    setEditingDepartmentId(null)
    setShowDepartmentForm(false)
  }

  const resetDesignationForm = () => {
    setDesignationForm(createEmptyDesignation())
    setEditingDesignationId(null)
    setShowDesignationForm(false)
  }

  const openDepartmentForm = (department?: Department) => {
    clearMessages()

    if (department) {
      setDepartmentForm({
        name: department.name,
        description: department.description ?? "",
        is_active: department.is_active,
      })
      setEditingDepartmentId(department.id)
    } else {
      setDepartmentForm(createEmptyDepartment())
      setEditingDepartmentId(null)
    }

    setShowDepartmentForm(true)
    setShowDesignationForm(false)
  }

  const openDesignationForm = (designation?: Designation) => {
    clearMessages()

    if (designation) {
      setDesignationForm({
        name: designation.name,
        department: designation.department,
        is_active: designation.is_active,
      })
      setEditingDesignationId(designation.id)
    } else {
      setDesignationForm(createEmptyDesignation())
      setEditingDesignationId(null)
    }

    setShowDesignationForm(true)
    setShowDepartmentForm(false)
  }

  const handleDepartmentSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    clearMessages()

    const trimmedName = departmentForm.name.trim()
    const trimmedDescription = departmentForm.description.trim()

    if (!trimmedName) {
      setError("Department name is required.")
      return
    }

    const duplicateExists = departments.some(
      (department) =>
        department.id !== editingDepartmentId &&
        department.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )

    if (duplicateExists) {
      setError("A department with this name already exists.")
      return
    }

    try {
      setIsDepartmentSubmitting(true)

      const payload: DepartmentPayload = {
        name: trimmedName,
        description: trimmedDescription,
        is_active: departmentForm.is_active,
      }

      if (editingDepartmentId !== null) {
        const updated = await updateDepartment(
          editingDepartmentId,
          payload,
        )

        setDepartments((current) =>
          current.map((department) =>
            department.id === editingDepartmentId
              ? updated
              : department,
          ),
        )

        setSuccess("Department updated successfully.")
      } else {
        const created = await createDepartment(payload)

        setDepartments((current) => [...current, created])
        setSuccess("Department created successfully.")
      }

      resetDepartmentForm()
    } catch {
      setError(
        editingDepartmentId !== null
          ? "Unable to update department. Please try again."
          : "Unable to create department. Please try again.",
      )
    } finally {
      setIsDepartmentSubmitting(false)
    }
  }

  const handleDesignationSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    clearMessages()

    const trimmedName = designationForm.name.trim()

    if (!trimmedName) {
      setError("Designation name is required.")
      return
    }

    if (!designationForm.department) {
      setError("Please select a department.")
      return
    }

    const selectedDepartment = departments.find(
      (department) => department.id === designationForm.department,
    )

    if (!selectedDepartment) {
      setError("Selected department could not be found.")
      return
    }

    if (
      !selectedDepartment.is_active &&
      editingDesignationId === null
    ) {
      setError(
        "New designations can only be created under active departments.",
      )
      return
    }

    const duplicateExists = designations.some(
      (designation) =>
        designation.id !== editingDesignationId &&
        designation.department === designationForm.department &&
        designation.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )

    if (duplicateExists) {
      setError(
        "A designation with this name already exists in the selected department.",
      )
      return
    }

    try {
      setIsDesignationSubmitting(true)

      const payload: DesignationPayload = {
        name: trimmedName,
        department: designationForm.department,
        is_active: designationForm.is_active,
      }

      if (editingDesignationId !== null) {
        const updated = await updateDesignation(
          editingDesignationId,
          payload,
        )

        setDesignations((current) =>
          current.map((designation) =>
            designation.id === editingDesignationId
              ? updated
              : designation,
          ),
        )

        setSuccess("Designation updated successfully.")
      } else {
        const created = await createDesignation(payload)

        setDesignations((current) => [...current, created])
        setSuccess("Designation created successfully.")
      }

      resetDesignationForm()
    } catch {
      setError(
        editingDesignationId !== null
          ? "Unable to update designation. Please try again."
          : "Unable to create designation. Please try again.",
      )
    } finally {
      setIsDesignationSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (id: number) => {
    const department = departments.find((item) => item.id === id)

    if (!department) {
      return
    }

    const relatedDesignationCount = designations.filter(
      (designation) => designation.department === id,
    ).length

    const warning =
      relatedDesignationCount > 0
        ? `This department has ${relatedDesignationCount} related designation${
            relatedDesignationCount === 1 ? "" : "s"
          }. Deleting it may fail if the server prevents deletion of related records. Continue?`
        : "Are you sure you want to delete this department?"

    if (!window.confirm(warning)) {
      return
    }

    try {
      setDeletingDepartmentId(id)
      clearMessages()

      await deleteDepartment(id)

      setDepartments((current) =>
        current.filter((item) => item.id !== id),
      )

      setDesignations((current) =>
        current.filter((designation) => designation.department !== id),
      )

      if (designationForm.department === id) {
        resetDesignationForm()
      }

      if (editingDepartmentId === id) {
        resetDepartmentForm()
      }

      setSuccess("Department deleted successfully.")
    } catch {
      setError(
        "Unable to delete department. It may have related employees or designations.",
      )
    } finally {
      setDeletingDepartmentId(null)
    }
  }

  const handleDeleteDesignation = async (id: number) => {
    const designation = designations.find((item) => item.id === id)

    if (!designation) {
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${designation.name}"?`,
      )
    ) {
      return
    }

    try {
      setDeletingDesignationId(id)
      clearMessages()

      await deleteDesignation(id)

      setDesignations((current) =>
        current.filter((item) => item.id !== id),
      )

      if (editingDesignationId === id) {
        resetDesignationForm()
      }

      setSuccess("Designation deleted successfully.")
    } catch {
      setError("Unable to delete designation. Please try again.")
    } finally {
      setDeletingDesignationId(null)
    }
  }

  const formatStatus = (value: boolean) =>
    value ? "Active" : "Inactive"

  const getDepartmentName = (id: number) =>
    departments.find((department) => department.id === id)?.name ??
    `Department #${id}`

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "38px",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
  }

  const primaryButtonStyle: React.CSSProperties = {
    minHeight: "38px",
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  }

  const secondaryButtonStyle: React.CSSProperties = {
    minHeight: "38px",
    padding: "8px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  }

  const dangerButtonStyle: React.CSSProperties = {
    minHeight: "34px",
    padding: "6px 10px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  }

  const editButtonStyle: React.CSSProperties = {
    minHeight: "34px",
    padding: "6px 10px",
    border: "1px solid #2563eb",
    borderRadius: "5px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "18px",
        backgroundColor: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <style>
        {`
          .departments-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
            flex-wrap: wrap;
          }

          .departments-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .department-kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
          }

          .department-kpi {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
          }

          .department-content-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 14px;
          }

          .department-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }

          .department-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
            flex-wrap: wrap;
          }

          .department-table-wrap {
            overflow-x: auto;
          }

          .department-table {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }

          .department-table th {
            padding: 9px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            background: #f9fafb;
            white-space: nowrap;
          }

          .department-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
            font-size: 13px;
            vertical-align: middle;
          }

          .department-table tbody tr:last-child td {
            border-bottom: none;
          }

          .department-table tbody tr:hover {
            background: #fafafa;
          }

          .department-status {
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
          }

          .department-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .department-form-full {
            grid-column: 1 / -1;
          }

          .department-form-actions {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 2px;
          }

          @media (max-width: 800px) {
            .department-kpis {
              grid-template-columns: 1fr;
            }

            .department-form-grid {
              grid-template-columns: 1fr;
            }

            .department-form-full {
              grid-column: auto;
            }
          }

          @media (max-width: 600px) {
            .departments-header {
              align-items: flex-start;
            }

            .departments-actions {
              width: 100%;
            }

            .departments-actions button {
              flex: 1;
            }
          }
        `}
      </style>

      <section
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <header className="departments-header">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "3px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2563eb",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                HRMS
              </span>

              <span
                style={{
                  color: "#d1d5db",
                  fontSize: "12px",
                }}
              >
                /
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                Organization Setup
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "22px",
                lineHeight: 1.25,
              }}
            >
              Departments & Designations
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Manage organizational structure, departments and job
              designations.
            </p>
          </div>

          <div className="departments-actions">
            <button
              type="button"
              onClick={() => openDepartmentForm()}
              style={primaryButtonStyle}
            >
              + Add Department
            </button>

            <button
              type="button"
              onClick={() => openDesignationForm()}
              disabled={activeDepartments.length === 0}
              style={{
                ...primaryButtonStyle,
                backgroundColor:
                  activeDepartments.length === 0 ? "#9ca3af" : "#16a34a",
                cursor:
                  activeDepartments.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              + Add Designation
            </button>
          </div>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              padding: "9px 12px",
              marginBottom: "10px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#991b1b",
              fontSize: "12px",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              padding: "9px 12px",
              marginBottom: "10px",
              backgroundColor: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              color: "#166534",
              fontSize: "12px",
            }}
          >
            {success}
          </section>
        )}

        {!isLoading && (
          <section className="department-kpis">
            <div className="department-kpi">
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "3px",
                }}
              >
                Total Departments
              </div>

              <div
                style={{
                  color: "#111827",
                  fontSize: "22px",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                {departments.length}
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  marginTop: "5px",
                }}
              >
                Organization units
              </div>
            </div>

            <div className="department-kpi">
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "3px",
                }}
              >
                Active Departments
              </div>

              <div
                style={{
                  color: "#16a34a",
                  fontSize: "22px",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                {activeDepartments.length}
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  marginTop: "5px",
                }}
              >
                {inactiveDepartments} inactive
              </div>
            </div>

            <div className="department-kpi">
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "3px",
                }}
              >
                Active Designations
              </div>

              <div
                style={{
                  color: "#2563eb",
                  fontSize: "22px",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                {activeDesignations.length}
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  marginTop: "5px",
                }}
              >
                {designations.length} total designations
              </div>
            </div>
          </section>
        )}

        {showDepartmentForm && (
          <section
            className="department-card"
            style={{
              marginBottom: "14px",
            }}
          >
            <div className="department-card-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "15px",
                  }}
                >
                  {editingDepartmentId !== null
                    ? "Edit Department"
                    : "Add Department"}
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    color: "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  Configure department information and availability.
                </p>
              </div>

              <button
                type="button"
                onClick={resetDepartmentForm}
                style={secondaryButtonStyle}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleDepartmentSubmit}
              style={{
                padding: "14px",
              }}
            >
              <div className="department-form-grid">
                <label
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Department Name

                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(event) =>
                      setDepartmentForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength={150}
                    required
                    style={{
                      ...inputStyle,
                      marginTop: "5px",
                    }}
                  />
                </label>

                <label
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Status

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: "38px",
                      marginTop: "5px",
                      padding: "0 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      boxSizing: "border-box",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={departmentForm.is_active}
                        onChange={(event) =>
                          setDepartmentForm((current) => ({
                            ...current,
                            is_active: event.target.checked,
                          }))
                        }
                      />
                      Active Department
                    </label>
                  </div>
                </label>

                <label
                  className="department-form-full"
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Description

                  <textarea
                    value={departmentForm.description}
                    onChange={(event) =>
                      setDepartmentForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={500}
                    style={{
                      ...inputStyle,
                      minHeight: "76px",
                      marginTop: "5px",
                      resize: "vertical",
                    }}
                  />
                </label>
              </div>

              <div className="department-form-actions">
                <button
                  type="submit"
                  disabled={isDepartmentSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: isDepartmentSubmitting
                      ? "#9ca3af"
                      : "#2563eb",
                    cursor: isDepartmentSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isDepartmentSubmitting
                    ? "Saving..."
                    : editingDepartmentId !== null
                      ? "Update Department"
                      : "Save Department"}
                </button>

                <button
                  type="button"
                  onClick={resetDepartmentForm}
                  disabled={isDepartmentSubmitting}
                  style={{
                    ...secondaryButtonStyle,
                    cursor: isDepartmentSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {showDesignationForm && (
          <section
            className="department-card"
            style={{
              marginBottom: "14px",
            }}
          >
            <div className="department-card-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "15px",
                  }}
                >
                  {editingDesignationId !== null
                    ? "Edit Designation"
                    : "Add Designation"}
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    color: "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  Assign the designation to an active department.
                </p>
              </div>

              <button
                type="button"
                onClick={resetDesignationForm}
                style={secondaryButtonStyle}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleDesignationSubmit}
              style={{
                padding: "14px",
              }}
            >
              <div className="department-form-grid">
                <label
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Designation Name

                  <input
                    type="text"
                    value={designationForm.name}
                    onChange={(event) =>
                      setDesignationForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength={150}
                    required
                    style={{
                      ...inputStyle,
                      marginTop: "5px",
                    }}
                  />
                </label>

                <label
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Department

                  <select
                    value={designationForm.department || ""}
                    onChange={(event) =>
                      setDesignationForm((current) => ({
                        ...current,
                        department: event.target.value
                          ? Number(event.target.value)
                          : 0,
                      }))
                    }
                    required
                    style={{
                      ...inputStyle,
                      marginTop: "5px",
                    }}
                  >
                    <option value="">
                      Select active department
                    </option>

                    {activeDepartments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Status

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: "38px",
                      marginTop: "5px",
                      padding: "0 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      boxSizing: "border-box",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={designationForm.is_active}
                        onChange={(event) =>
                          setDesignationForm((current) => ({
                            ...current,
                            is_active: event.target.checked,
                          }))
                        }
                      />
                      Active Designation
                    </label>
                  </div>
                </label>
              </div>

              <div className="department-form-actions">
                <button
                  type="submit"
                  disabled={isDesignationSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: isDesignationSubmitting
                      ? "#9ca3af"
                      : "#16a34a",
                    cursor: isDesignationSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isDesignationSubmitting
                    ? "Saving..."
                    : editingDesignationId !== null
                      ? "Update Designation"
                      : "Save Designation"}
                </button>

                <button
                  type="button"
                  onClick={resetDesignationForm}
                  disabled={isDesignationSubmitting}
                  style={{
                    ...secondaryButtonStyle,
                    cursor: isDesignationSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {isLoading ? (
          <section
            className="department-card"
            style={{
              padding: "24px",
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            Loading departments and designations...
          </section>
        ) : (
          <div className="department-content-grid">
            <section className="department-card">
              <div className="department-card-header">
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#111827",
                      fontSize: "15px",
                    }}
                  >
                    Departments
                  </h2>

                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#6b7280",
                      fontSize: "11px",
                    }}
                  >
                    {departments.length} department
                    {departments.length === 1 ? "" : "s"} in the
                    organization.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openDepartmentForm()}
                  style={editButtonStyle}
                >
                  + Add
                </button>
              </div>

              {departments.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: "20px 14px",
                    color: "#6b7280",
                    fontSize: "12px",
                  }}
                >
                  No departments found.
                </p>
              ) : (
                <div className="department-table-wrap">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {departments.map((department) => (
                        <tr key={department.id}>
                          <td>
                            <div
                              style={{
                                color: "#111827",
                                fontWeight: 700,
                              }}
                            >
                              {department.name}
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                color: "#6b7280",
                              }}
                            >
                              {department.description || "-"}
                            </span>
                          </td>

                          <td>
                            <span
                              className="department-status"
                              style={{
                                backgroundColor: department.is_active
                                  ? "#dcfce7"
                                  : "#f3f4f6",
                                color: department.is_active
                                  ? "#166534"
                                  : "#6b7280",
                              }}
                            >
                              {formatStatus(department.is_active)}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openDepartmentForm(department)
                                }
                                style={editButtonStyle}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingDepartmentId === department.id
                                }
                                onClick={() =>
                                  void handleDeleteDepartment(
                                    department.id,
                                  )
                                }
                                style={{
                                  ...dangerButtonStyle,
                                  backgroundColor:
                                    deletingDepartmentId === department.id
                                      ? "#9ca3af"
                                      : "#dc2626",
                                  cursor:
                                    deletingDepartmentId === department.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {deletingDepartmentId === department.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="department-card">
              <div className="department-card-header">
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#111827",
                      fontSize: "15px",
                    }}
                  >
                    Designations
                  </h2>

                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#6b7280",
                      fontSize: "11px",
                    }}
                  >
                    {designations.length} designation
                    {designations.length === 1 ? "" : "s"} across
                    departments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openDesignationForm()}
                  disabled={activeDepartments.length === 0}
                  style={{
                    ...editButtonStyle,
                    borderColor:
                      activeDepartments.length === 0
                        ? "#d1d5db"
                        : "#16a34a",
                    color:
                      activeDepartments.length === 0
                        ? "#9ca3af"
                        : "#16a34a",
                    cursor:
                      activeDepartments.length === 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  + Add
                </button>
              </div>

              {designations.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: "20px 14px",
                    color: "#6b7280",
                    fontSize: "12px",
                  }}
                >
                  No designations found.
                </p>
              ) : (
                <div className="department-table-wrap">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {designations.map((designation) => (
                        <tr key={designation.id}>
                          <td>
                            <div
                              style={{
                                color: "#111827",
                                fontWeight: 700,
                              }}
                            >
                              {designation.name}
                            </div>
                          </td>

                          <td>
                            {getDepartmentName(designation.department)}
                          </td>

                          <td>
                            <span
                              className="department-status"
                              style={{
                                backgroundColor: designation.is_active
                                  ? "#dcfce7"
                                  : "#f3f4f6",
                                color: designation.is_active
                                  ? "#166534"
                                  : "#6b7280",
                              }}
                            >
                              {formatStatus(designation.is_active)}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openDesignationForm(designation)
                                }
                                style={editButtonStyle}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingDesignationId === designation.id
                                }
                                onClick={() =>
                                  void handleDeleteDesignation(
                                    designation.id,
                                  )
                                }
                                style={{
                                  ...dangerButtonStyle,
                                  backgroundColor:
                                    deletingDesignationId === designation.id
                                      ? "#9ca3af"
                                      : "#dc2626",
                                  cursor:
                                    deletingDesignationId === designation.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {deletingDesignationId === designation.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

export default Departments