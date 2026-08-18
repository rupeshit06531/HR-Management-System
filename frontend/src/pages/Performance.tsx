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

const emptyForm: CreatePerformanceRequest = {
  employee: 0,
  review_period: "Annual Review",
  strengths: "",
  areas_for_improvement: "",
  manager_comments: "",
  review_date: "",
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "32px",
  background:
    "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  boxSizing: "border-box",
}

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.06)",
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 600,
}

const primaryButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "9px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
}

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  backgroundColor: "#ffffff",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
}

function formatDate(value: string) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function truncateText(
  value: string,
  maxLength = 90,
) {
  const text = value?.trim() || "-"

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}

function Performance() {
  const [reviews, setReviews] = useState<
    PerformanceReview[]
  >([])

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
    useState<CreatePerformanceRequest>({
      ...emptyForm,
    })

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

  useEffect(() => {
    void loadReviews()
  }, [])

  const resetForm = () => {
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm({
      ...emptyForm,
    })
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
      review_period: review.review_period,
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

  const reviewStats = useMemo(() => {
    const total = reviews.length

    const currentYear =
      new Date().getFullYear()

    const thisYear = reviews.filter(
      (review) => {
        const date = new Date(
          review.review_date,
        )

        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === currentYear
        )
      },
    ).length

    const withFeedback = reviews.filter(
      (review) =>
        Boolean(
          review.strengths?.trim() ||
            review.manager_comments?.trim(),
        ),
    ).length

    return {
      total,
      thisYear,
      withFeedback,
    }
  }, [reviews])

  return (
    <main style={pageStyle}>
      <section
        style={{
          maxWidth: "1450px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent:
              "space-between",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 10px",
                marginBottom: "10px",
                borderRadius: "999px",
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              PEOPLE & PERFORMANCE
            </div>

            <h1
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "30px",
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
              }}
            >
              Performance Management
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Manage employee reviews,
              feedback, strengths and
              development opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={primaryButtonStyle}
          >
            + Add Review
          </button>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              ...cardStyle,
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#fef2f2",
              borderColor: "#fecaca",
              color: "#991b1b",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "3px",
              }}
            >
              Action failed
            </strong>

            <span
              style={{
                fontSize: "14px",
              }}
            >
              {error}
            </span>
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              ...cardStyle,
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#f0fdf4",
              borderColor: "#bbf7d0",
              color: "#166534",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "3px",
              }}
            >
              Success
            </strong>

            <span
              style={{
                fontSize: "14px",
              }}
            >
              {success}
            </span>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: "20px",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Total Reviews
            </div>

            <div
              style={{
                marginTop: "8px",
                color: "#111827",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {reviewStats.total}
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#9ca3af",
                fontSize: "12px",
              }}
            >
              All performance records
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: "20px",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Reviews This Year
            </div>

            <div
              style={{
                marginTop: "8px",
                color: "#111827",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {reviewStats.thisYear}
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#9ca3af",
                fontSize: "12px",
              }}
            >
              Current calendar year
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: "20px",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Feedback Available
            </div>

            <div
              style={{
                marginTop: "8px",
                color: "#111827",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {reviewStats.withFeedback}
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#9ca3af",
                fontSize: "12px",
              }}
            >
              Reviews with written feedback
            </div>
          </div>
        </section>

        {showForm && (
          <section
            style={{
              ...cardStyle,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "16px",
                marginBottom: "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "20px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Performance Review"
                    : "Create Performance Review"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  Enter review details and
                  employee feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#6b7280",
                  cursor: isSubmitting
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "18px",
                }}
              >
                <label style={labelStyle}>
                  Employee ID
                  <input
                    type="number"
                    min="1"
                    value={
                      form.employee || ""
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          employee:
                            Number(
                              event.target
                                .value,
                            ),
                        }),
                      )
                    }
                    required
                    placeholder="Enter employee ID"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
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
                    placeholder="e.g. Annual Review"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
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
                    style={inputStyle}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "18px",
                  marginTop: "18px",
                }}
              >
                <label style={labelStyle}>
                  Strengths
                  <textarea
                    value={form.strengths}
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
                    rows={5}
                    placeholder="Describe key strengths and achievements..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                </label>

                <label style={labelStyle}>
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
                    rows={5}
                    placeholder="Describe development areas..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                </label>

                <label
                  style={{
                    ...labelStyle,
                    gridColumn:
                      "1 / -1",
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
                    rows={5}
                    placeholder="Add manager feedback, goals or follow-up notes..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent:
                    "flex-end",
                  marginTop: "22px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    ...secondaryButtonStyle,
                    opacity:
                      isSubmitting
                        ? 0.6
                        : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      isSubmitting
                        ? 0.7
                        : 1,
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
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
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "16px",
              padding: "20px 24px",
              borderBottom:
                "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "18px",
                }}
              >
                Performance Reviews
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Employee evaluation history
              </p>
            </div>

            <span
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {reviews.length}{" "}
              {reviews.length === 1
                ? "Review"
                : "Reviews"}
            </span>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#2563eb",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Loading performance reviews...
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                Please wait while records are
                loaded.
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  margin: "0 auto 14px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "16px",
                }}
              >
                No performance reviews
              </h3>

              <p
                style={{
                  margin:
                    "7px 0 18px",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Start by creating the first
                employee performance review.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                style={primaryButtonStyle}
              >
                + Add First Review
              </button>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "1250px",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor:
                        "#f8fafc",
                    }}
                  >
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
                          key={heading}
                          style={{
                            padding:
                              "13px 16px",
                            textAlign:
                              "left",
                            color:
                              "#4b5563",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.3px",
                            borderBottom:
                              "1px solid #e5e7eb",
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
                  {reviews.map(
                    (review) => (
                      <tr
                        key={
                          review.id
                        }
                        style={{
                          backgroundColor:
                            "#ffffff",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#111827",
                              fontWeight:
                                700,
                              fontSize:
                                "14px",
                            }}
                          >
                            {review.employee_name ||
                              "-"}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                "#6b7280",
                              fontSize:
                                "12px",
                            }}
                          >
                            {review.employee_id ||
                              `Employee #${review.employee}`}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "7px",
                              backgroundColor:
                                "#eff6ff",
                              color:
                                "#1d4ed8",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              review.review_period
                            }
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                            whiteSpace:
                              "nowrap",
                            color:
                              "#374151",
                            fontSize:
                              "13px",
                          }}
                        >
                          {formatDate(
                            review.review_date,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth:
                              "230px",
                            color:
                              "#4b5563",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.5,
                          }}
                          title={
                            review.strengths ||
                            "-"
                          }
                        >
                          {truncateText(
                            review.strengths,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth:
                              "230px",
                            color:
                              "#4b5563",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.5,
                          }}
                          title={
                            review.areas_for_improvement ||
                            "-"
                          }
                        >
                          {truncateText(
                            review.areas_for_improvement,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth:
                              "230px",
                            color:
                              "#4b5563",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.5,
                          }}
                          title={
                            review.manager_comments ||
                            "-"
                          }
                        >
                          {truncateText(
                            review.manager_comments,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "16px",
                            verticalAlign:
                              "top",
                            borderBottom:
                              "1px solid #f1f5f9",
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
                                openEditForm(
                                  review,
                                )
                              }
                              style={{
                                padding:
                                  "7px 11px",
                                border:
                                  "1px solid #2563eb",
                                borderRadius:
                                  "7px",
                                backgroundColor:
                                  "#ffffff",
                                color:
                                  "#2563eb",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
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
                                review.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  review.id,
                                )
                              }
                              style={{
                                padding:
                                  "7px 11px",
                                border:
                                  "1px solid #dc2626",
                                borderRadius:
                                  "7px",
                                backgroundColor:
                                  deletingId ===
                                  review.id
                                    ? "#fca5a5"
                                    : "#dc2626",
                                color:
                                  "#ffffff",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                                cursor:
                                  deletingId ===
                                  review.id
                                    ? "not-allowed"
                                    : "pointer",
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
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default Performance