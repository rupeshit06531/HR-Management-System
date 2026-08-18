import {
  useEffect,
  useState,
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

const createEmptyForm = (): CreatePerformanceRequest => ({
  employee: 0,
  review_period: "Annual Review",
  strengths: "",
  areas_for_improvement: "",
  manager_comments: "",
  review_date: "",
})

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
    useState<CreatePerformanceRequest>(
      createEmptyForm(),
    )

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

    if (Number.isNaN(date.getTime())) {
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
        backgroundColor: "#f5f7fa",
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
                color: "#111827",
              }}
            >
              Performance
            </h1>

            <p
              style={{
                color: "#6b7280",
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
                "#2563eb",
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
                "#fee2e2",
              borderRadius: "8px",
              color: "#991b1b",
              border:
                "1px solid #fecaca",
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
              border:
                "1px solid #bbf7d0",
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
                    "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor:
                    "#ffffff",
                  cursor:
                    isSubmitting
                      ? "not-allowed"
                      : "pointer",
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
              <label>
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
                  disabled={isSubmitting}
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
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Employee strengths and achievements"
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                    resize: "vertical",
                  }}
                />
              </label>

              <label>
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
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                    resize: "vertical",
                  }}
                />
              </label>

              <label>
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
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
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
                      "#2563eb",
                    color:
                      "#ffffff",
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
                      "1px solid #d1d5db",
                    borderRadius:
                      "6px",
                    backgroundColor:
                      "#ffffff",
                    cursor:
                      isSubmitting
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

        <section
          style={{
            backgroundColor:
              "#ffffff",
            borderRadius: "10px",
            overflow: "auto",
            boxShadow:
              "0 1px 3px rgba(0, 0, 0, 0.05)",
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
              Performance Reviews
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "#6b7280",
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
                    "#6b7280",
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
                    "#2563eb",
                  color:
                    "#ffffff",
                  cursor:
                    "pointer",
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
                            "1px solid #e5e7eb",
                          backgroundColor:
                            "#f9fafb",
                          whiteSpace:
                            "nowrap",
                          fontSize:
                            "13px",
                          color:
                            "#374151",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
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
                              "#6b7280",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
                          whiteSpace:
                            "nowrap",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
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
                            "1px solid #f3f4f6",
                          verticalAlign:
                            "top",
                          maxWidth:
                            "220px",
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
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
                            "1px solid #f3f4f6",
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
                                "1px solid #2563eb",
                              borderRadius:
                                "6px",
                              backgroundColor:
                                "#ffffff",
                              color:
                                "#2563eb",
                              cursor:
                                isSubmitting ||
                                deletingId !==
                                  null
                                  ? "not-allowed"
                                  : "pointer",
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
                                "#dc2626",
                              color:
                                "#ffffff",
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
          )}
        </section>
      </section>
    </main>
  )
}

export default Performance