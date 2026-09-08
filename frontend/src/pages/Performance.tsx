import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createPerformanceReview,
  deletePerformanceReview,
  getPerformanceReviews,
  updatePerformanceReview,
  type CreatePerformanceRequest,
  type PerformanceListResponse,
  type PerformanceReview,
} from "../api/performance"

import {
  getEmployees,
  type Employee,
} from "../api/employees"

import { useTheme } from "../context/ThemeContext"

const createEmptyForm =
  (): CreatePerformanceRequest => ({
    employee: 0,
    review_period: "Annual Review",
    strengths: "",
    areas_for_improvement: "",
    manager_comments: "",
    review_date: "",
  })

function Performance() {
  const { isDarkMode } = useTheme()

  const [reviews, setReviews] = useState<
    PerformanceReview[]
  >([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [isLoadingEmployees, setIsLoadingEmployees] =
    useState(true)

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
    useState<CreatePerformanceRequest>(
      createEmptyForm(),
    )

  const theme = {
    pageBackground: isDarkMode
      ? "#111827"
      : "#f5f7fa",

    cardBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    inputBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

    disabledBackground: isDarkMode
      ? "#374151"
      : "#f3f4f6",

    text: isDarkMode
      ? "#f9fafb"
      : "#111827",

    secondaryText: isDarkMode
      ? "#d1d5db"
      : "#374151",

    mutedText: isDarkMode
      ? "#9ca3af"
      : "#6b7280",

    border: isDarkMode
      ? "#374151"
      : "#e5e7eb",

    inputBorder: isDarkMode
      ? "#4b5563"
      : "#d1d5db",

    rowBorder: isDarkMode
      ? "#374151"
      : "#f3f4f6",

    tableHeader: isDarkMode
      ? "#111827"
      : "#f9fafb",

    primary: "#2563eb",

    errorBackground: isDarkMode
      ? "#451a1a"
      : "#fee2e2",

    errorBorder: isDarkMode
      ? "#7f1d1d"
      : "#fecaca",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground: isDarkMode
      ? "#14351f"
      : "#dcfce7",

    successBorder: isDarkMode
      ? "#166534"
      : "#bbf7d0",

    successText: isDarkMode
      ? "#86efac"
      : "#166534",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "10px 11px",
    boxSizing: "border-box",
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "7px",
    backgroundColor:
      theme.inputBackground,
    color: theme.text,
    fontSize: "14px",
    outline: "none",
  }

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response =
        await getPerformanceReviews()

      if (Array.isArray(response)) {
        setReviews(response)
      } else {
        const paginated =
          response as PerformanceListResponse

        setReviews(
          paginated.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load performance reviews.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)

      const response =
        await getEmployees()

      if (Array.isArray(response)) {
        setEmployees(response)
      } else {
        setEmployees(
          response.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load employees.",
      )
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  useEffect(() => {
    void loadReviews()
    void loadEmployees()
  }, [])

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const openEditForm = (
    review: PerformanceReview,
  ) => {
    setForm({
      employee: review.employee,
      review_period:
        review.review_period,
      strengths: review.strengths,
      areas_for_improvement:
        review.areas_for_improvement,
      manager_comments:
        review.manager_comments,
      review_date: review.review_date,
    })

    setEditingId(review.id)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (
      !form.employee ||
      form.employee <= 0
    ) {
      setError(
        "Employee ID is required.",
      )
      return
    }

    if (!form.review_period.trim()) {
      setError(
        "Review period is required.",
      )
      return
    }

    if (!form.review_date) {
      setError(
        "Review date is required.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreatePerformanceRequest =
        {
          employee: form.employee,
          review_period:
            form.review_period.trim(),
          strengths:
            form.strengths.trim(),
          areas_for_improvement:
            form.areas_for_improvement.trim(),
          manager_comments:
            form.manager_comments.trim(),
          review_date:
            form.review_date,
        }

      if (editingId !== null) {
        const updated =
          await updatePerformanceReview(
            editingId,
            payload,
          )

        setReviews(
          (current) =>
            current.map(
              (review) =>
                review.id === editingId
                  ? updated
                  : review,
            ),
        )

        setSuccess(
          "Performance review updated successfully.",
        )
      } else {
        const created =
          await createPerformanceReview(
            payload,
          )

        setReviews(
          (current) => [
            created,
            ...current,
          ],
        )

        setSuccess(
          "Performance review created successfully.",
        )
      }

      resetForm()
    } catch {
      setError(
        editingId !== null
          ? "Unable to update performance review."
          : "Unable to create performance review.",
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
        "Are you sure you want to delete this performance review?",
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deletePerformanceReview(id)

      setReviews(
        (current) =>
          current.filter(
            (review) =>
              review.id !== id,
          ),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess(
        "Performance review deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete performance review.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (
    value: string,
  ) => {
    if (!value) {
      return "-"
    }

    const date = new Date(
      `${value}T00:00:00`,
    )

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor:
          theme.pageBackground,
        color: theme.text,
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth: "1300px",
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
                color: theme.text,
              }}
            >
              Performance
            </h1>

            <p
              style={{
                color:
                  theme.mutedText,
                marginBottom: 0,
              }}
            >
              Manage employee performance
              reviews
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor:
                theme.primary,
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Add Review
          </button>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              padding: "16px",
              marginBottom: "20px",
              backgroundColor:
                theme.errorBackground,
              borderRadius: "8px",
              color:
                theme.errorText,
              border:
                `1px solid ${theme.errorBorder}`,
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
                theme.successBackground,
              borderRadius: "8px",
              color:
                theme.successText,
              border:
                `1px solid ${theme.successBorder}`,
            }}
          >
            {success}
          </section>
        )}

        {showForm && (
          <section
            style={{
              backgroundColor:
                theme.cardBackground,
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              border:
                `1px solid ${theme.border}`,
              boxShadow:
                "0 2px 6px rgba(0, 0, 0, 0.12)",
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
                  color: theme.text,
                }}
              >
                {editingId !== null
                  ? "Edit Performance Review"
                  : "Add Performance Review"}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  padding: "7px 12px",
                  border:
                    `1px solid ${theme.inputBorder}`,
                  borderRadius: "6px",
                  backgroundColor:
                    isDarkMode
                      ? "#374151"
                      : "#ffffff",
                  color:
                    theme.text,
                  cursor:
                    isSubmitting
                      ? "not-allowed"
                      : "pointer",
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
                gap: "16px",
                maxWidth: "700px",
              }}
            >
              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Employee

                <select
                  value={
                    form.employee || ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        employee:
                          Number(
                            event.target.value,
                          ),
                      }),
                    )
                  }
                  required
                  disabled={
                    isSubmitting ||
                    isLoadingEmployees
                  }
                  style={{
                    ...inputStyle,
                    cursor:
                      isSubmitting ||
                      isLoadingEmployees
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <option value="">
                    {isLoadingEmployees
                      ? "Loading employees..."
                      : "Select employee"}
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={
                          employee.id
                        }
                        value={
                          employee.id
                        }
                      >
                        {employee.full_name} —{" "}
                        {employee.employee_id}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Review Period

                <input
                  type="text"
                  value={
                    form.review_period
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        review_period:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. Annual Review"
                  style={
                    inputStyle
                  }
                />
              </label>

              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Review Date

                <input
                  type="date"
                  value={
                    form.review_date
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        review_date:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                  disabled={isSubmitting}
                  style={
                    inputStyle
                  }
                />
              </label>

              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Strengths

                <textarea
                  value={
                    form.strengths
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        strengths:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Employee strengths and achievements"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Areas for Improvement

                <textarea
                  value={
                    form.areas_for_improvement
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        areas_for_improvement:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Skills or areas requiring improvement"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  color:
                    theme.secondaryText,
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Manager Comments

                <textarea
                  value={
                    form.manager_comments
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        manager_comments:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Manager's overall comments"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
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
                      isSubmitting
                        ? isDarkMode
                          ? "#374151"
                          : "#93c5fd"
                        : theme.primary,
                    color:
                      isSubmitting
                        ? theme.mutedText
                        : "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Review"
                      : "Save Review"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      `1px solid ${theme.inputBorder}`,
                    borderRadius:
                      "6px",
                    backgroundColor:
                      isDarkMode
                        ? "#374151"
                        : "#ffffff",
                    color:
                      theme.text,
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          style={{
            backgroundColor:
              theme.cardBackground,
            borderRadius: "10px",
            overflow: "auto",
            border:
              `1px solid ${theme.border}`,
            boxShadow:
              "0 2px 6px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              padding:
                "20px 24px",
              borderBottom:
                `1px solid ${theme.border}`,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              Performance Reviews
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  theme.mutedText,
                fontSize:
                  "14px",
              }}
            >
              {reviews.length}{" "}
              {reviews.length === 1
                ? "review"
                : "reviews"}
            </p>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
                color:
                  theme.mutedText,
              }}
            >
              Loading performance
              reviews...
            </p>
          ) : reviews.length ===
            0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign:
                  "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    theme.mutedText,
                }}
              >
                No performance reviews
                found.
              </p>

              <button
                type="button"
                onClick={
                  openCreateForm
                }
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "9px 14px",
                  border: "none",
                  borderRadius:
                    "6px",
                  backgroundColor:
                    theme.primary,
                  color:
                    "#ffffff",
                  cursor:
                    "pointer",
                  fontWeight:
                    600,
                }}
              >
                Add First Review
              </button>
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "1150px",
                color:
                  theme.text,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Review Period",
                    "Review Date",
                    "Strengths",
                    "Areas for Improvement",
                    "Manager Comments",
                    "Actions",
                  ].map(
                    (heading) => (
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
                            `1px solid ${theme.border}`,
                          backgroundColor:
                            theme.tableHeader,
                          whiteSpace:
                            "nowrap",
                          fontSize:
                            "13px",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {reviews.map(
                  (review) => (
                    <tr
                      key={
                        review.id
                      }
                    >
                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          color:
                            theme.text,
                        }}
                      >
                        <strong>
                          {review.employee_name ||
                            "-"}
                        </strong>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              theme.mutedText,
                            marginTop:
                              "4px",
                          }}
                        >
                          {review.employee_id ||
                            `Employee #${review.employee}`}
                        </div>
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {
                          review.review_period
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {formatDate(
                          review.review_date,
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {review.strengths ||
                          "-"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {
                          review.areas_for_improvement ||
                          "-"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
                          color:
                            theme.secondaryText,
                        }}
                      >
                        {
                          review.manager_comments ||
                          "-"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            disabled={
                              isSubmitting ||
                              deletingId !==
                                null
                            }
                            onClick={() =>
                              openEditForm(
                                review,
                              )
                            }
                            style={{
                              padding:
                                "7px 12px",
                              border:
                                `1px solid ${theme.primary}`,
                              borderRadius:
                                "6px",
                              backgroundColor:
                                isDarkMode
                                  ? "#1e3a8a"
                                  : "#ffffff",
                              color:
                                isDarkMode
                                  ? "#dbeafe"
                                  : theme.primary,
                              cursor:
                                isSubmitting ||
                                deletingId !==
                                  null
                                  ? "not-allowed"
                                  : "pointer",
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
                              review.id
                            }
                            onClick={() =>
                              void handleDelete(
                                review.id,
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
                                review.id
                                  ? isDarkMode
                                    ? "#7f1d1d"
                                    : "#fca5a5"
                                  : "#dc2626",
                              color:
                                "#ffffff",
                              cursor:
                                deletingId ===
                                review.id
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight:
                                600,
                            }}
                          >
                            {deletingId ===
                            review.id
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
      </section>
    </main>
  )
}

export default Performance