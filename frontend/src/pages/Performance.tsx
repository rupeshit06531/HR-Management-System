import {
  useEffect,
  useMemo,
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

const createEmptyForm = (): CreatePerformanceRequest => ({
  employee: 0,
  review_period: "Annual Review",
  strengths: "",
  areas_for_improvement: "",
  manager_comments: "",
  review_date: "",
})

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "16px",
  backgroundColor: "#f5f7fa",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
}

const containerStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
}

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxSizing: "border-box",
}

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "5px",
  backgroundColor: "#ffffff",
  color: "#111827",
  boxSizing: "border-box",
  fontSize: "13px",
  outline: "none",
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "76px",
  resize: "vertical",
  fontFamily: "Arial, sans-serif",
}

const primaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "7px 12px",
  border: "none",
  borderRadius: "5px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
}

const secondaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "7px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "5px",
  backgroundColor: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
}

const dangerButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "6px 10px",
  border: "none",
  borderRadius: "5px",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
}

const editButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "6px 10px",
  border: "1px solid #2563eb",
  borderRadius: "5px",
  backgroundColor: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
}

const getEmployeeLabel = (employee: Employee) =>
  `${employee.full_name} — ${employee.employee_id}`

function Performance() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] =
    useState<CreatePerformanceRequest>(createEmptyForm())

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getPerformanceReviews()

      if (Array.isArray(response)) {
        setReviews(response)
      } else {
        const paginated = response as PerformanceListResponse
        setReviews(paginated.results ?? [])
      }
    } catch {
      setError("Unable to load performance reviews.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)

      const response = await getEmployees()

      if (Array.isArray(response)) {
        setEmployees(response)
      } else {
        setEmployees(response.results ?? [])
      }
    } catch {
      setError("Unable to load employees.")
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

  const openEditForm = (review: PerformanceReview) => {
    setForm({
      employee: review.employee,
      review_period: review.review_period,
      strengths: review.strengths,
      areas_for_improvement: review.areas_for_improvement,
      manager_comments: review.manager_comments,
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

    if (!form.employee || form.employee <= 0) {
      setError("Employee ID is required.")
      return
    }

    if (!form.review_period.trim()) {
      setError("Review period is required.")
      return
    }

    if (!form.review_date) {
      setError("Review date is required.")
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreatePerformanceRequest = {
        employee: form.employee,
        review_period: form.review_period.trim(),
        strengths: form.strengths.trim(),
        areas_for_improvement:
          form.areas_for_improvement.trim(),
        manager_comments: form.manager_comments.trim(),
        review_date: form.review_date,
      }

      if (editingId !== null) {
        const updated = await updatePerformanceReview(
          editingId,
          payload,
        )

        setReviews((current) =>
          current.map((review) =>
            review.id === editingId ? updated : review,
          ),
        )

        setSuccess(
          "Performance review updated successfully.",
        )
      } else {
        const created = await createPerformanceReview(payload)

        setReviews((current) => [created, ...current])

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
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

      setReviews((current) =>
        current.filter((review) => review.id !== id),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess(
        "Performance review deleted successfully.",
      )
    } catch {
      setError("Unable to delete performance review.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (value: string) => {
    if (!value) {
      return "-"
    }

    const date = new Date(`${value}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const statistics = useMemo(() => {
    const total = reviews.length

    const completed = reviews.filter(
      (review) =>
        Boolean(review.strengths?.trim()) ||
        Boolean(review.manager_comments?.trim()),
    ).length

    const pending = Math.max(total - completed, 0)

    const currentYear = new Date().getFullYear()

    const thisYear = reviews.filter((review) => {
      if (!review.review_date) {
        return false
      }

      const date = new Date(`${review.review_date}T00:00:00`)

      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === currentYear
      )
    }).length

    return {
      total,
      completed,
      pending,
      thisYear,
    }
  }, [reviews])

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginBottom: "2px",
              }}
            >
              HRMS / Performance
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  lineHeight: 1.2,
                  color: "#111827",
                }}
              >
                Performance
              </h1>

              <span
                style={{
                  padding: "3px 7px",
                  borderRadius: "999px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                REVIEWS
              </span>
            </div>

            <p
              style={{
                margin: "3px 0 0",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Manage employee performance reviews and evaluations.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={primaryButtonStyle}
          >
            + Add Review
          </button>
        </div>

        {error && (
          <section
            role="alert"
            style={{
              ...cardStyle,
              padding: "9px 11px",
              marginBottom: "10px",
              backgroundColor: "#fef2f2",
              borderColor: "#fecaca",
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
              ...cardStyle,
              padding: "9px 11px",
              marginBottom: "10px",
              backgroundColor: "#f0fdf4",
              borderColor: "#bbf7d0",
              color: "#166534",
              fontSize: "12px",
            }}
          >
            {success}
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          {[
            {
              label: "Total Reviews",
              value: statistics.total,
              note: "Current records",
            },
            {
              label: "Completed",
              value: statistics.completed,
              note: "With evaluation notes",
            },
            {
              label: "Pending",
              value: statistics.pending,
              note: "Needs evaluation",
            },
            {
              label: "This Year",
              value: statistics.thisYear,
              note: `${new Date().getFullYear()} reviews`,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "11px 12px",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#111827",
                  fontSize: "21px",
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#9ca3af",
                  fontSize: "10px",
                }}
              >
                {item.note}
              </div>
            </div>
          ))}
        </section>

        {showForm && (
          <section
            style={{
              ...cardStyle,
              padding: "13px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "15px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Performance Review"
                    : "Add Performance Review"}
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    color: "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  Enter the employee evaluation details.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={secondaryButtonStyle}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "9px",
                }}
              >
                <label>
                  <span style={labelStyle}>
                    Employee
                  </span>

                  <select
                    value={form.employee || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employee: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    disabled={
                      isSubmitting ||
                      isLoadingEmployees
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      {isLoadingEmployees
                        ? "Loading employees..."
                        : "Select employee"}
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {getEmployeeLabel(employee)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span style={labelStyle}>
                    Review Period
                  </span>

                  <input
                    type="text"
                    value={form.review_period}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        review_period:
                          event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="e.g. Annual Review"
                    style={inputStyle}
                  />
                </label>

                <label>
                  <span style={labelStyle}>
                    Review Date
                  </span>

                  <input
                    type="date"
                    value={form.review_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        review_date:
                          event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    style={inputStyle}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "9px",
                }}
              >
                <label>
                  <span style={labelStyle}>
                    Strengths
                  </span>

                  <textarea
                    value={form.strengths}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        strengths:
                          event.target.value,
                      }))
                    }
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Employee strengths and achievements"
                    style={textareaStyle}
                  />
                </label>

                <label>
                  <span style={labelStyle}>
                    Areas for Improvement
                  </span>

                  <textarea
                    value={
                      form.areas_for_improvement
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        areas_for_improvement:
                          event.target.value,
                      }))
                    }
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Skills or areas requiring improvement"
                    style={textareaStyle}
                  />
                </label>

                <label>
                  <span style={labelStyle}>
                    Manager Comments
                  </span>

                  <textarea
                    value={form.manager_comments}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        manager_comments:
                          event.target.value,
                      }))
                    }
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Manager's overall comments"
                    style={textareaStyle}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "7px",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={primaryButtonStyle}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Review"
                      : "Save Review"}
                </button>
              </div>
            </form>
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
              padding: "10px 12px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "14px",
                }}
              >
                Performance Reviews
              </h2>

              <p
                style={{
                  margin: "2px 0 0",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                {reviews.length}{" "}
                {reviews.length === 1
                  ? "review"
                  : "reviews"}
              </p>
            </div>

            {!showForm && (
              <button
                type="button"
                onClick={openCreateForm}
                style={secondaryButtonStyle}
              >
                Add Review
              </button>
            )}
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "28px 16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Loading performance reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                No performance reviews found.
              </div>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#9ca3af",
                  fontSize: "11px",
                }}
              >
                Create the first employee performance review.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                style={{
                  ...primaryButtonStyle,
                  marginTop: "10px",
                }}
              >
                + Add First Review
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1050px",
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
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "8px 10px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                          backgroundColor: "#f9fafb",
                          whiteSpace: "nowrap",
                          color: "#374151",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                        }}
                      >
                        <div
                          style={{
                            color: "#111827",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {review.employee_name || "-"}
                        </div>

                        <div
                          style={{
                            marginTop: "2px",
                            color: "#6b7280",
                            fontSize: "10px",
                          }}
                        >
                          {review.employee_id ||
                            `Employee #${review.employee}`}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                          color: "#374151",
                          fontSize: "11px",
                        }}
                      >
                        {review.review_period}
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                          color: "#374151",
                          fontSize: "11px",
                        }}
                      >
                        {formatDate(review.review_date)}
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                          maxWidth: "210px",
                          color: "#4b5563",
                          fontSize: "11px",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {review.strengths || "-"}
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                          maxWidth: "210px",
                          color: "#4b5563",
                          fontSize: "11px",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {review.areas_for_improvement || "-"}
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                          maxWidth: "210px",
                          color: "#4b5563",
                          fontSize: "11px",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {review.manager_comments || "-"}
                      </td>

                      <td
                        style={{
                          padding: "9px 10px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          verticalAlign: "top",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            disabled={
                              isSubmitting ||
                              deletingId !== null
                            }
                            onClick={() =>
                              openEditForm(review)
                            }
                            style={{
                              ...editButtonStyle,
                              cursor:
                                isSubmitting ||
                                deletingId !== null
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                isSubmitting ||
                                deletingId !== null
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === review.id
                            }
                            onClick={() =>
                              void handleDelete(
                                review.id,
                              )
                            }
                            style={{
                              ...dangerButtonStyle,
                              cursor:
                                deletingId === review.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                deletingId === review.id
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {deletingId === review.id
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

        <style>
          {`
            @media (max-width: 900px) {
              .performance-responsive-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </section>
    </main>
  )
}

export default Performance