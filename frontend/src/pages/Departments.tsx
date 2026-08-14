import {
  useEffect,
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

const emptyDepartment: DepartmentPayload = {
  name: "",
  description: "",
  is_active: true,
}

const emptyDesignation: DesignationPayload = {
  name: "",
  department: 0,
  is_active: true,
}

function Departments() {
  const [departments, setDepartments] =
    useState<Department[]>([])

  const [designations, setDesignations] =
    useState<Designation[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

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
      emptyDepartment,
    )

  const [designationForm, setDesignationForm] =
    useState<DesignationPayload>(
      emptyDesignation,
    )

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingDepartmentId, setDeletingDepartmentId] =
    useState<number | null>(null)

  const [deletingDesignationId, setDeletingDesignationId] =
    useState<number | null>(null)

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

      if (Array.isArray(departmentResponse)) {
        setDepartments(departmentResponse)
      } else {
        const paginated =
          departmentResponse as DepartmentListResponse

        setDepartments(
          paginated.results ?? [],
        )
      }

      if (Array.isArray(designationResponse)) {
        setDesignations(designationResponse)
      } else {
        const paginated =
          designationResponse as DesignationListResponse

        setDesignations(
          paginated.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load departments and designations.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const resetDepartmentForm = () => {
    setDepartmentForm(
      emptyDepartment,
    )
    setEditingDepartmentId(null)
    setShowDepartmentForm(false)
  }

  const resetDesignationForm = () => {
    setDesignationForm(
      emptyDesignation,
    )
    setEditingDesignationId(null)
    setShowDesignationForm(false)
  }

  const handleDepartmentSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!departmentForm.name.trim()) {
      setError(
        "Department name is required.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: DepartmentPayload = {
        ...departmentForm,
        name: departmentForm.name.trim(),
        description:
          departmentForm.description.trim(),
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
          ? "Unable to update department."
          : "Unable to create department.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDesignationSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!designationForm.name.trim()) {
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

    try {
      setIsSubmitting(true)

      const payload: DesignationPayload = {
        ...designationForm,
        name: designationForm.name.trim(),
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
          ? "Unable to update designation."
          : "Unable to create designation.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this department? Related designations may also be deleted.",
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingDepartmentId(id)
      setError(null)
      setSuccess(null)

      await deleteDepartment(id)

      setDepartments(
        (current) =>
          current.filter(
            (department) =>
              department.id !== id,
          ),
      )

      setDesignations(
        (current) =>
          current.filter(
            (designation) =>
              designation.department !== id,
          ),
      )

      setSuccess(
        "Department deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete department.",
      )
    } finally {
      setDeletingDepartmentId(null)
    }
  }

  const handleDeleteDesignation = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this designation?",
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingDesignationId(id)
      setError(null)
      setSuccess(null)

      await deleteDesignation(id)

      setDesignations(
        (current) =>
          current.filter(
            (designation) =>
              designation.id !== id,
          ),
      )

      setSuccess(
        "Designation deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete designation.",
      )
    } finally {
      setDeletingDesignationId(null)
    }
  }

  const formatStatus = (
    value: boolean,
  ) =>
    value
      ? "Active"
      : "Inactive"

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
              }}
            >
              Manage departments and designations
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setError(null)
                setSuccess(null)
                setDepartmentForm(
                  emptyDepartment,
                )
                setEditingDepartmentId(
                  null,
                )
                setShowDepartmentForm(
                  true,
                )
              }}
              style={{
                padding:
                  "10px 16px",
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
              onClick={() => {
                setError(null)
                setSuccess(null)
                setDesignationForm(
                  emptyDesignation,
                )
                setEditingDesignationId(
                  null,
                )
                setShowDesignationForm(
                  true,
                )
              }}
              style={{
                padding:
                  "10px 16px",
                border: "none",
                borderRadius: "6px",
                backgroundColor:
                  "#16a34a",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Add Designation
            </button>
          </div>
        </header>

        {error && (
          <section
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
              backgroundColor:
                "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2>
              {editingDepartmentId !==
              null
                ? "Edit Department"
                : "Add Department"}
            </h2>

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
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
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
                          event
                            .target
                            .checked,
                      }),
                    )
                  }
                />{" "}
                Active
              </label>

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
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
                  {isSubmitting
                    ? "Saving..."
                    : editingDepartmentId !==
                        null
                      ? "Update"
                      : "Save"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetDepartmentForm
                  }
                  style={{
                    padding:
                      "10px 18px",
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
            </form>
          </section>
        )}

        {showDesignationForm && (
          <section
            style={{
              backgroundColor:
                "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2>
              {editingDesignationId !==
              null
                ? "Edit Designation"
                : "Add Designation"}
            </h2>

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
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
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
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
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
                          event
                            .target
                            .checked,
                      }),
                    )
                  }
                />{" "}
                Active
              </label>

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
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
                    border: "none",
                    borderRadius:
                      "6px",
                    backgroundColor:
                      "#16a34a",
                    color:
                      "#ffffff",
                    cursor:
                      "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingDesignationId !==
                        null
                      ? "Update"
                      : "Save"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetDesignationForm
                  }
                  style={{
                    padding:
                      "10px 18px",
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
            </form>
          </section>
        )}

        {isLoading ? (
          <p>
            Loading departments...
          </p>
        ) : (
          <>
            <section
              style={{
                backgroundColor:
                  "#ffffff",
                borderRadius:
                  "10px",
                overflow:
                  "auto",
                marginBottom:
                  "24px",
              }}
            >
              <div
                style={{
                  padding:
                    "20px 24px",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Departments
                </h2>
              </div>

              {departments.length ===
              0 ? (
                <p
                  style={{
                    padding:
                      "24px",
                  }}
                >
                  No departments
                  found.
                </p>
              ) : (
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "800px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Description
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Actions
                      </th>
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
                                gap:
                                  "8px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setDepartmentForm(
                                    {
                                      name:
                                        department.name,
                                      description:
                                        department.description,
                                      is_active:
                                        department.is_active,
                                    },
                                  )
                                  setEditingDepartmentId(
                                    department.id,
                                  )
                                  setShowDepartmentForm(
                                    true,
                                  )
                                  setError(
                                    null,
                                  )
                                  setSuccess(
                                    null,
                                  )
                                }}
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
                                    "#dc2626",
                                  color:
                                    "#ffffff",
                                  cursor:
                                    "pointer",
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
                backgroundColor:
                  "#ffffff",
                borderRadius:
                  "10px",
                overflow:
                  "auto",
              }}
            >
              <div
                style={{
                  padding:
                    "20px 24px",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Designations
                </h2>
              </div>

              {designations.length ===
              0 ? (
                <p
                  style={{
                    padding:
                      "24px",
                  }}
                >
                  No designations
                  found.
                </p>
              ) : (
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "800px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Department
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding:
                            "14px",
                          textAlign:
                            "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        Actions
                      </th>
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
                                gap:
                                  "8px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setDesignationForm(
                                    {
                                      name:
                                        designation.name,
                                      department:
                                        designation.department,
                                      is_active:
                                        designation.is_active,
                                    },
                                  )
                                  setEditingDesignationId(
                                    designation.id,
                                  )
                                  setShowDesignationForm(
                                    true,
                                  )
                                  setError(
                                    null,
                                  )
                                  setSuccess(
                                    null,
                                  )
                                }}
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
                                    "#dc2626",
                                  color:
                                    "#ffffff",
                                  cursor:
                                    "pointer",
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