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
  const [departments, setDepartments] =
    useState<Department[]>([])

  const [designations, setDesignations] =
    useState<Designation[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isDepartmentSubmitting, setIsDepartmentSubmitting] =
    useState(false)

  const [isDesignationSubmitting, setIsDesignationSubmitting] =
    useState(false)

  const [deletingDepartmentId, setDeletingDepartmentId] =
    useState<number | null>(null)

  const [deletingDesignationId, setDeletingDesignationId] =
    useState<number | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const [showDepartmentForm, setShowDepartmentForm] =
    useState(false)

  const [showDesignationForm, setShowDesignationForm] =
    useState(false)

  const [editingDepartmentId, setEditingDepartmentId] =
    useState<number | null>(null)

  const [editingDesignationId, setEditingDesignationId] =
    useState<number | null>(null)

  const [departmentForm, setDepartmentForm] =
    useState<DepartmentPayload>(
      createEmptyDepartment(),
    )

  const [designationForm, setDesignationForm] =
    useState<DesignationPayload>(
      createEmptyDesignation(),
    )

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [
        departmentResponse,
        designationResponse,
      ] = await Promise.all([
        getDepartments(),
        getDesignations(),
      ])

      const departmentData =
        Array.isArray(departmentResponse)
          ? departmentResponse
          : (
              departmentResponse as DepartmentListResponse
            ).results ?? []

      const designationData =
        Array.isArray(designationResponse)
          ? designationResponse
          : (
              designationResponse as DesignationListResponse
            ).results ?? []

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
    () =>
      departments.filter(
        (department) =>
          department.is_active,
      ),
    [departments],
  )

  const resetDepartmentForm = () => {
    setDepartmentForm(
      createEmptyDepartment(),
    )
    setEditingDepartmentId(null)
    setShowDepartmentForm(false)
  }

  const resetDesignationForm = () => {
    setDesignationForm(
      createEmptyDesignation(),
    )
    setEditingDesignationId(null)
    setShowDesignationForm(false)
  }

  const openDepartmentForm = (
    department?: Department,
  ) => {
    clearMessages()

    if (department) {
      setDepartmentForm({
        name: department.name,
        description:
          department.description ?? "",
        is_active:
          department.is_active,
      })
      setEditingDepartmentId(
        department.id,
      )
    } else {
      setDepartmentForm(
        createEmptyDepartment(),
      )
      setEditingDepartmentId(null)
    }

    setShowDepartmentForm(true)
    setShowDesignationForm(false)
  }

  const openDesignationForm = (
    designation?: Designation,
  ) => {
    clearMessages()

    if (designation) {
      setDesignationForm({
        name: designation.name,
        department:
          designation.department,
        is_active:
          designation.is_active,
      })
      setEditingDesignationId(
        designation.id,
      )
    } else {
      setDesignationForm(
        createEmptyDesignation(),
      )
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

    const trimmedName =
      departmentForm.name.trim()

    const trimmedDescription =
      departmentForm.description.trim()

    if (!trimmedName) {
      setError(
        "Department name is required.",
      )
      return
    }

    const duplicateExists =
      departments.some(
        (department) =>
          department.id !==
            editingDepartmentId &&
          department.name.trim().toLowerCase() ===
            trimmedName.toLowerCase(),
      )

    if (duplicateExists) {
      setError(
        "A department with this name already exists.",
      )
      return
    }

    try {
      setIsDepartmentSubmitting(true)

      const payload: DepartmentPayload = {
        name: trimmedName,
        description:
          trimmedDescription,
        is_active:
          departmentForm.is_active,
      }

      if (
        editingDepartmentId !== null
      ) {
        const updated =
          await updateDepartment(
            editingDepartmentId,
            payload,
          )

        setDepartments(
          (current) =>
            current.map(
              (department) =>
                department.id ===
                editingDepartmentId
                  ? updated
                  : department,
            ),
        )

        setSuccess(
          "Department updated successfully.",
        )
      } else {
        const created =
          await createDepartment(
            payload,
          )

        setDepartments(
          (current) => [
            ...current,
            created,
          ],
        )

        setSuccess(
          "Department created successfully.",
        )
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

    const trimmedName =
      designationForm.name.trim()

    if (!trimmedName) {
      setError(
        "Designation name is required.",
      )
      return
    }

    if (!designationForm.department) {
      setError(
        "Please select a department.",
      )
      return
    }

    const selectedDepartment =
      departments.find(
        (department) =>
          department.id ===
          designationForm.department,
      )

    if (!selectedDepartment) {
      setError(
        "Selected department could not be found.",
      )
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

    const duplicateExists =
      designations.some(
        (designation) =>
          designation.id !==
            editingDesignationId &&
          designation.department ===
            designationForm.department &&
          designation.name.trim().toLowerCase() ===
            trimmedName.toLowerCase(),
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
        department:
          designationForm.department,
        is_active:
          designationForm.is_active,
      }

      if (
        editingDesignationId !== null
      ) {
        const updated =
          await updateDesignation(
            editingDesignationId,
            payload,
          )

        setDesignations(
          (current) =>
            current.map(
              (designation) =>
                designation.id ===
                editingDesignationId
                  ? updated
                  : designation,
            ),
        )

        setSuccess(
          "Designation updated successfully.",
        )
      } else {
        const created =
          await createDesignation(
            payload,
          )

        setDesignations(
          (current) => [
            ...current,
            created,
          ],
        )

        setSuccess(
          "Designation created successfully.",
        )
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

  const handleDeleteDepartment = async (
    id: number,
  ) => {
    const department =
      departments.find(
        (item) => item.id === id,
      )

    if (!department) {
      return
    }

    const relatedDesignationCount =
      designations.filter(
        (designation) =>
          designation.department === id,
      ).length

    const warning =
      relatedDesignationCount > 0
        ? `This department has ${relatedDesignationCount} related designation${relatedDesignationCount === 1 ? "" : "s"}. Deleting it may fail if the server prevents deletion of related records. Continue?`
        : "Are you sure you want to delete this department?"

    if (!window.confirm(warning)) {
      return
    }

    try {
      setDeletingDepartmentId(id)
      clearMessages()

      await deleteDepartment(id)

      setDepartments(
        (current) =>
          current.filter(
            (item) => item.id !== id,
          ),
      )

      setDesignations(
        (current) =>
          current.filter(
            (designation) =>
              designation.department !== id,
          ),
      )

      if (
        designationForm.department === id
      ) {
        resetDesignationForm()
      }

      if (
        editingDepartmentId === id
      ) {
        resetDepartmentForm()
      }

      setSuccess(
        "Department deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete department. It may have related employees or designations.",
      )
    } finally {
      setDeletingDepartmentId(null)
    }
  }

  const handleDeleteDesignation = async (
    id: number,
  ) => {
    const designation =
      designations.find(
        (item) => item.id === id,
      )

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

      setDesignations(
        (current) =>
          current.filter(
            (item) => item.id !== id,
          ),
      )

      if (
        editingDesignationId === id
      ) {
        resetDesignationForm()
      }

      setSuccess(
        "Designation deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete designation. Please try again.",
      )
    } finally {
      setDeletingDesignationId(null)
    }
  }

  const formatStatus = (
    value: boolean,
  ) =>
    value ? "Active" : "Inactive"

  const getDepartmentName = (
    id: number,
  ) =>
    departments.find(
      (department) =>
        department.id === id,
    )?.name ?? `Department #${id}`

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fa",
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#111827",
              }}
            >
              Departments
            </h1>

            <p
              style={{
                color: "#6b7280",
                marginBottom: 0,
              }}
            >
              Manage organizational departments
              and designations
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                openDepartmentForm()
              }
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                backgroundColor:
                  "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Add Department
            </button>

            <button
              type="button"
              onClick={() =>
                openDesignationForm()
              }
              disabled={
                activeDepartments.length ===
                0
              }
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                backgroundColor:
                  activeDepartments.length ===
                  0
                    ? "#9ca3af"
                    : "#16a34a",
                color: "#ffffff",
                cursor:
                  activeDepartments.length ===
                  0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Add Designation
            </button>
          </div>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              padding: "16px",
              marginBottom: "20px",
              backgroundColor:
                "#fee2e2",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              padding: "16px",
              marginBottom: "20px",
              backgroundColor:
                "#dcfce7",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            {success}
          </section>
        )}

        {showDepartmentForm && (
          <section
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                }}
              >
                {editingDepartmentId !==
                null
                  ? "Edit Department"
                  : "Add Department"}
              </h2>

              <button
                type="button"
                onClick={
                  resetDepartmentForm
                }
                style={{
                  padding: "8px 14px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor:
                    "#ffffff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                handleDepartmentSubmit
              }
              style={{
                display: "grid",
                gap: "16px",
                maxWidth: "700px",
              }}
            >
              <label>
                Name

                <input
                  type="text"
                  value={
                    departmentForm.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setDepartmentForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      }),
                    )
                  }
                  maxLength={150}
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Description

                <textarea
                  value={
                    departmentForm.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDepartmentForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  rows={4}
                  maxLength={500}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    departmentForm.is_active
                  }
                  onChange={(
                    event,
                  ) =>
                    setDepartmentForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target.checked,
                      }),
                    )
                  }
                />
                Active
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  disabled={
                    isDepartmentSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor:
                      isDepartmentSubmitting
                        ? "#9ca3af"
                        : "#2563eb",
                    color: "#ffffff",
                    cursor:
                      isDepartmentSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isDepartmentSubmitting
                    ? "Saving..."
                    : editingDepartmentId !==
                        null
                      ? "Update Department"
                      : "Save Department"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetDepartmentForm
                  }
                  disabled={
                    isDepartmentSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor:
                      "#ffffff",
                    cursor:
                      isDepartmentSubmitting
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
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                }}
              >
                {editingDesignationId !==
                null
                  ? "Edit Designation"
                  : "Add Designation"}
              </h2>

              <button
                type="button"
                onClick={
                  resetDesignationForm
                }
                style={{
                  padding: "8px 14px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor:
                    "#ffffff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                handleDesignationSubmit
              }
              style={{
                display: "grid",
                gap: "16px",
                maxWidth: "700px",
              }}
            >
              <label>
                Name

                <input
                  type="text"
                  value={
                    designationForm.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setDesignationForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      }),
                    )
                  }
                  maxLength={150}
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Department

                <select
                  value={
                    designationForm.department ||
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setDesignationForm(
                      (current) => ({
                        ...current,
                        department:
                          event.target.value
                            ? Number(
                                event.target.value,
                              )
                            : 0,
                      }),
                    )
                  }
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <option value="">
                    Select active department
                  </option>

                  {activeDepartments.map(
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
                        {department.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    designationForm.is_active
                  }
                  onChange={(
                    event,
                  ) =>
                    setDesignationForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target.checked,
                      }),
                    )
                  }
                />
                Active
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  disabled={
                    isDesignationSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor:
                      isDesignationSubmitting
                        ? "#9ca3af"
                        : "#16a34a",
                    color: "#ffffff",
                    cursor:
                      isDesignationSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isDesignationSubmitting
                    ? "Saving..."
                    : editingDesignationId !==
                        null
                      ? "Update Designation"
                      : "Save Designation"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetDesignationForm
                  }
                  disabled={
                    isDesignationSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor:
                      "#ffffff",
                    cursor:
                      isDesignationSubmitting
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
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "10px",
            }}
          >
            Loading departments and
            designations...
          </section>
        ) : (
          <>
            <section
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                overflow: "auto",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                  }}
                >
                  Departments
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#6b7280",
                  }}
                >
                  {departments.length} department
                  {departments.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              {departments.length ===
              0 ? (
                <p
                  style={{
                    padding: "24px",
                    color: "#6b7280",
                  }}
                >
                  No departments found.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "850px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Name",
                        "Description",
                        "Status",
                        "Actions",
                      ].map(
                        (heading) => (
                          <th
                            key={heading}
                            style={{
                              padding:
                                "14px",
                              textAlign:
                                "left",
                              borderBottom:
                                "1px solid #e5e7eb",
                            }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {departments.map(
                      (
                        department,
                      ) => (
                        <tr
                          key={
                            department.id
                          }
                        >
                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f3f4f6",
                              fontWeight: 600,
                            }}
                          >
                            {
                              department.name
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f3f4f6",
                              color: "#6b7280",
                            }}
                          >
                            {department.description ||
                              "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f3f4f6",
                            }}
                          >
                            {formatStatus(
                              department.is_active,
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
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "8px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openDepartmentForm(
                                    department,
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
                                  deletingDepartmentId ===
                                  department.id
                                }
                                onClick={() =>
                                  void handleDeleteDepartment(
                                    department.id,
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
                                    deletingDepartmentId ===
                                    department.id
                                      ? "#9ca3af"
                                      : "#dc2626",
                                  color:
                                    "#ffffff",
                                  cursor:
                                    deletingDepartmentId ===
                                    department.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {deletingDepartmentId ===
                                department.id
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
              )}
            </section>

            <section
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                  }}
                >
                  Designations
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#6b7280",
                  }}
                >
                  {designations.length} designation
                  {designations.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              {designations.length ===
              0 ? (
                <p
                  style={{
                    padding: "24px",
                    color: "#6b7280",
                  }}
                >
                  No designations found.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "850px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Name",
                        "Department",
                        "Status",
                        "Actions",
                      ].map(
                        (heading) => (
                          <th
                            key={heading}
                            style={{
                              padding:
                                "14px",
                              textAlign:
                                "left",
                              borderBottom:
                                "1px solid #e5e7eb",
                            }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {designations.map(
                      (
                        designation,
                      ) => (
                        <tr
                          key={
                            designation.id
                          }
                        >
                          <td
                            style={{
                              padding:
                                "14px",
                              borderBottom:
                                "1px solid #f3f4f6",
                              fontWeight: 600,
                            }}
                          >
                            {
                              designation.name
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
                              designation.department,
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
                            {formatStatus(
                              designation.is_active,
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
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "8px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openDesignationForm(
                                    designation,
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
                                  deletingDesignationId ===
                                  designation.id
                                }
                                onClick={() =>
                                  void handleDeleteDesignation(
                                    designation.id,
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
                                    deletingDesignationId ===
                                    designation.id
                                      ? "#9ca3af"
                                      : "#dc2626",
                                  color:
                                    "#ffffff",
                                  cursor:
                                    deletingDesignationId ===
                                    designation.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {deletingDesignationId ===
                                designation.id
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
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default Departments