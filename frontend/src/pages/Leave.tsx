import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createLeave,
  deleteLeave,
  getLeaves,
  updateLeave,
  type CreateLeaveRequest,
  type LeaveRecord,
} from "../api/leave"

import { useTheme } from "../context/ThemeContext"

const leaveTypes = [
  {
    value: "casual",
    label: "Casual Leave",
  },
  {
    value: "sick",
    label: "Sick Leave",
  },
  {
    value: "earned",
    label: "Earned Leave",
  },
  {
    value: "unpaid",
    label: "Unpaid Leave",
  },
]

const emptyForm: CreateLeaveRequest = {
  leave_type: "casual",
  start_date: "",
  end_date: "",
  reason: "",
}

function Leave() {
  const { isDarkMode } = useTheme()

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<CreateLeaveRequest>(
      emptyForm,
    )

  const theme = {
    pageBackground: isDarkMode
      ? "#111827"
      : "#f5f7fb",

    cardBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    inputBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

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

    rowBorder: isDarkMode
      ? "#374151"
      : "#f3f4f6",

    tableHeader: isDarkMode
      ? "#111827"
      : "#f9fafb",

    primaryButton: isDarkMode
      ? "#2563eb"
      : "#2563eb",

    primaryButtonText:
      "#ffffff",

    secondaryButtonBackground:
      isDarkMode
        ? "#374151"
        : "#f3f4f6",

    secondaryButtonText:
      isDarkMode
        ? "#f9fafb"
        : "#111827",

    errorBackground: isDarkMode
      ? "#451a1a"
      : "#fee2e2",

    errorBorder: isDarkMode
      ? "#7f1d1d"
      : "#fecaca",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground:
      isDarkMode
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
    padding: "10px",
    boxSizing: "border-box",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    background: theme.inputBackground,
    color: theme.text,
    fontSize: "14px",
  }

  const primaryButtonStyle: CSSProperties = {
    padding: "12px 18px",
    background: theme.primaryButton,
    color: theme.primaryButtonText,
    border: "none",
    borderRadius: "6px",
    cursor: isSubmitting
      ? "not-allowed"
      : "pointer",
    opacity: isSubmitting ? 0.7 : 1,
  }

  const secondaryButtonStyle: CSSProperties = {
    padding: "8px 14px",
    background:
      theme.secondaryButtonBackground,
    color: theme.secondaryButtonText,
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    cursor: "pointer",
  }

  const loadLeaves = async () => {
    try {
      setError("")

      const response =
        await getLeaves()

      const data = Array.isArray(response)
        ? response
        : response.results

      setLeaves(data)
    } catch {
      setError(
        "Unable to load leave records.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLeaves()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (
      !form.start_date ||
      !form.end_date ||
      !form.reason.trim()
    ) {
      setError(
        "Start date, end date and reason are required.",
      )
      return
    }

    if (form.end_date < form.start_date) {
      setError(
        "End date cannot be before start date.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      if (editingId !== null) {
        await updateLeave(
          editingId,
          {
            leave_type:
              form.leave_type,
            start_date:
              form.start_date,
            end_date:
              form.end_date,
            reason:
              form.reason.trim(),
          },
        )

        setSuccess(
          "Leave request updated successfully.",
        )
      } else {
        await createLeave({
          leave_type:
            form.leave_type,
          start_date:
            form.start_date,
          end_date:
            form.end_date,
          reason:
            form.reason.trim(),
        })

        setSuccess(
          "Leave request submitted successfully.",
        )
      }

      resetForm()
      await loadLeaves()
    } catch (error) {
      console.error(
        "Leave submission error:",
        error,
      )

      if (
        error &&
        typeof error === "object" &&
        "response" in error
      ) {
        const response = (
          error as {
            response?: {
              data?: unknown
              status?: number
            }
          }
        ).response

        setError(
          `Unable to ${
            editingId !== null
              ? "update"
              : "submit"
          } leave request. Status: ${
            response?.status ??
            "unknown"
          }. ${
            response?.data
              ? JSON.stringify(
                  response.data,
                )
              : "Please try again."
          }`,
        )
      } else {
        setError(
          `Unable to ${
            editingId !== null
              ? "update"
              : "submit"
          } leave request.`,
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (
    leave: LeaveRecord,
  ) => {
    setError("")
    setSuccess("")

    setEditingId(leave.id)

    setForm({
      leave_type:
        leave.leave_type,
      start_date:
        leave.start_date,
      end_date:
        leave.end_date,
      reason:
        leave.reason,
    })
  }

  const handleDelete = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this leave request?",
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      await deleteLeave(id)

      setLeaves((current) =>
        current.filter(
          (leave) =>
            leave.id !== id,
        ),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess(
        "Leave request deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete leave request.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatLeaveType = (
    value: string,
  ) => {
    return value
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        fontFamily:
          "Arial, sans-serif",
        background:
          theme.pageBackground,
        color: theme.text,
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            color: theme.text,
          }}
        >
          Leave Management
        </h1>

        <p
          style={{
            marginTop: 0,
            color: theme.secondaryText,
          }}
        >
          Submit and manage your
          leave requests.
        </p>

        {error && (
          <p
            style={{
              padding: "12px",
              background:
                theme.errorBackground,
              border: `1px solid ${theme.errorBorder}`,
              borderRadius: "6px",
              color:
                theme.errorText,
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              padding: "12px",
              background:
                theme.successBackground,
              border: `1px solid ${theme.successBorder}`,
              borderRadius: "6px",
              color:
                theme.successText,
            }}
          >
            {success}
          </p>
        )}

        <section
          style={{
            background:
              theme.cardBackground,
            padding: "24px",
            borderRadius: "10px",
            marginTop: "24px",
            border: `1px solid ${theme.border}`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              {editingId !== null
                ? "Edit Leave Request"
                : "Apply for Leave"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={
                  resetForm
                }
                style={
                  secondaryButtonStyle
                }
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              display: "grid",
              gap: "16px",
              maxWidth: "600px",
              marginTop: "20px",
            }}
          >
            <label
              style={{
                color: theme.secondaryText,
              }}
            >
              Leave Type

              <select
                value={
                  form.leave_type
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      leave_type:
                        event.target
                          .value,
                    }),
                  )
                }
                style={inputStyle}
              >
                {leaveTypes.map(
                  (type) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label
              style={{
                color: theme.secondaryText,
              }}
            >
              Start Date

              <input
                type="date"
                value={
                  form.start_date
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      start_date:
                        event.target
                          .value,
                    }),
                  )
                }
                style={inputStyle}
              />
            </label>

            <label
              style={{
                color: theme.secondaryText,
              }}
            >
              End Date

              <input
                type="date"
                value={
                  form.end_date
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      end_date:
                        event.target
                          .value,
                    }),
                  )
                }
                style={inputStyle}
              />
            </label>

            <label
              style={{
                color: theme.secondaryText,
              }}
            >
              Reason

              <textarea
                value={
                  form.reason
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      reason:
                        event.target
                          .value,
                    }),
                  )
                }
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily:
                    "Arial, sans-serif",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              style={
                primaryButtonStyle
              }
            >
              {isSubmitting
                ? editingId !== null
                  ? "Updating..."
                  : "Submitting..."
                : editingId !== null
                  ? "Update Leave Request"
                  : "Submit Leave Request"}
            </button>
          </form>
        </section>

        <section
          style={{
            background:
              theme.cardBackground,
            padding: "24px",
            borderRadius: "10px",
            marginTop: "24px",
            border: `1px solid ${theme.border}`,
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: theme.text,
            }}
          >
            My Leave Requests
          </h2>

          {isLoading ? (
            <p
              style={{
                color: theme.secondaryText,
              }}
            >
              Loading...
            </p>
          ) : leaves.length === 0 ? (
            <p
              style={{
                color: theme.mutedText,
              }}
            >
              No leave records
              found.
            </p>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "850px",
                  color: theme.text,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        theme.tableHeader,
                    }}
                  >
                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      Type
                    </th>

                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      Start
                    </th>

                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      End
                    </th>

                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      Status
                    </th>

                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      Reason
                    </th>

                    <th
                      align="left"
                      style={{
                        padding:
                          "12px",
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.secondaryText,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map(
                    (leave) => (
                      <tr
                        key={
                          leave.id
                        }
                        style={{
                          borderBottom: `1px solid ${theme.rowBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                          }}
                        >
                          {formatLeaveType(
                            leave.leave_type,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                          }}
                        >
                          {
                            leave.start_date
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                          }}
                        >
                          {
                            leave.end_date
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "4px 8px",
                              borderRadius:
                                "999px",
                              background:
                                isDarkMode
                                  ? "#374151"
                                  : "#f3f4f6",
                              color:
                                theme.text,
                              fontSize:
                                "13px",
                            }}
                          >
                            {formatLeaveType(
                              leave.status,
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                            maxWidth:
                              "280px",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {
                            leave.reason
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "12px",
                            verticalAlign:
                              "top",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  leave,
                                )
                              }
                              disabled={
                                deletingId ===
                                leave.id
                              }
                              style={{
                                ...secondaryButtonStyle,
                                padding:
                                  "7px 12px",
                                cursor:
                                  deletingId ===
                                  leave.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  deletingId ===
                                  leave.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  leave.id,
                                )
                              }
                              disabled={
                                deletingId ===
                                leave.id
                              }
                              style={{
                                padding:
                                  "7px 12px",
                                background:
                                  "#dc2626",
                                color:
                                  "#ffffff",
                                border:
                                  "none",
                                borderRadius:
                                  "5px",
                                cursor:
                                  deletingId ===
                                  leave.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  deletingId ===
                                  leave.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              {deletingId ===
                              leave.id
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

export default Leave