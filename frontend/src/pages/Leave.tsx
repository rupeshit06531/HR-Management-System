import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createLeave,
  deleteLeave,
  getLeaves,
  updateLeave,
  updateLeaveStatus,
  type CreateLeaveRequest,
  type LeaveRecord,
} from "../api/leave"

import { useTheme } from "../context/theme-context"
import { useConfirm } from "../context/confirmation-context"
import { useAuth } from "../context/auth-context"

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
  const confirm = useConfirm()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const canManageLeaves =
    user?.role === "HR" || user?.role === "SUPER_ADMIN"

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([])

  const [totalLeaveCount, setTotalLeaveCount] = useState(0)
  const [nextPage, setNextPage] = useState(2)
  const [hasMoreLeaves, setHasMoreLeaves] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const leaveRequestIdRef = useRef(0)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<CreateLeaveRequest>(
      emptyForm,
    )

  const theme = {
    pageBackground: "var(--app-bg)",
    cardBackground: "var(--surface)",
    inputBackground: "var(--surface)",
    text: "var(--text-primary)",
    secondaryText: "var(--text-secondary)",
    mutedText: "var(--text-muted)",
    border: "var(--border)",
    rowBorder: "var(--border-light)",
    tableHeader: "var(--surface-subtle)",
    primaryButton: "var(--app-primary)",
    primaryButtonText: "var(--white)",
    secondaryButtonBackground: "var(--surface-subtle)",
    secondaryButtonText: "var(--text-primary)",
    errorBackground: isDarkMode ? "#2a1515" : "var(--danger-50)",
    errorBorder: isDarkMode ? "#5f2929" : "var(--danger-100)",
    errorText: isDarkMode ? "#fca5a5" : "var(--danger-700)",
    successBackground: isDarkMode ? "#10251b" : "var(--success-50)",
    successBorder: isDarkMode ? "#23583b" : "var(--success-100)",
    successText: isDarkMode ? "#86efac" : "var(--success-700)",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "10px",
    boxSizing: "border-box",
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    background: theme.inputBackground,
    color: theme.text,
    fontSize: "14px",
  }

  const primaryButtonStyle: CSSProperties = {
    padding: "12px 18px",
    background: theme.primaryButton,
    color: theme.primaryButtonText,
    border: "none",
    borderRadius: "10px",
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
    borderRadius: "10px",
    cursor: "pointer",
  }

  const loadLeaves = async (page = 1, append = false) => {
    const requestId = ++leaveRequestIdRef.current

    try {
      if (append) {
        setIsLoadingMore(true)
      } else if (page === 1) {
        setIsLoading(true)
      }
      setError("")

      const response =
        await getLeaves({ page })

      if (requestId !== leaveRequestIdRef.current) {
        return
      }

      const data = Array.isArray(response)
        ? response
        : response.results

      setLeaves((current) => append
        ? [
            ...current,
            ...data.filter(
              (item) => !current.some((existing) => existing.id === item.id),
            ),
          ]
        : data,
      )
      if (!Array.isArray(response)) {
        setTotalLeaveCount(response.count)
        setHasMoreLeaves(Boolean(response.next))
        setNextPage(page + 1)
      } else {
        setTotalLeaveCount(data.length)
        setHasMoreLeaves(false)
      }
    } catch {
      if (requestId === leaveRequestIdRef.current) {
        setError(
          "Unable to load leave records.",
        )
      }
    } finally {
      if (requestId === leaveRequestIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    void loadLeaves()

    return () => {
      leaveRequestIdRef.current += 1
    }
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
    const confirmed = await confirm({
      title: "Delete leave request?",
      message: "This leave request will be permanently deleted.",
      confirmLabel: "Delete request",
    })

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      await deleteLeave(id)

      await loadLeaves(1)

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

  const handleStatusChange = async (
    leave: LeaveRecord,
    status: "approved" | "rejected",
  ) => {
    try {
      setUpdatingStatusId(leave.id)
      setError("")
      setSuccess("")

      const updatedLeave = await updateLeaveStatus(leave.id, status)
      setLeaves((current) =>
        current.map((item) =>
          item.id === updatedLeave.id ? updatedLeave : item,
        ),
      )
      setSuccess(`Leave request ${status} successfully.`)
    } catch (statusError) {
      console.error("Leave status update error:", statusError)
      setError(`Unable to ${status} leave request. Please try again.`)
    } finally {
      setUpdatingStatusId(null)
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
      className="leave-page"
      style={{
        minHeight: "auto",
        padding: 0,
        fontFamily: "inherit",
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
              borderRadius: "10px",
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
              borderRadius: "10px",
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
            borderRadius: "14px",
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
                    "inherit",
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
            borderRadius: "14px",
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
          <p style={{ marginTop: "-10px", color: theme.mutedText, fontSize: "13px" }}>
            Showing {leaves.length} of {totalLeaveCount} requests
          </p>

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
                            {canManageLeaves && leave.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleStatusChange(leave, "approved")
                                  }
                                  disabled={updatingStatusId === leave.id}
                                  style={{
                                    ...secondaryButtonStyle,
                                    padding: "7px 12px",
                                    color: isDarkMode ? "#86efac" : "#15803d",
                                  }}
                                >
                                  {updatingStatusId === leave.id ? "Saving..." : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleStatusChange(leave, "rejected")
                                  }
                                  disabled={updatingStatusId === leave.id}
                                  style={{
                                    ...secondaryButtonStyle,
                                    padding: "7px 12px",
                                    color: isDarkMode ? "#fca5a5" : "#b91c1c",
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {canManageLeaves && leave.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(leave)}
                                  disabled={
                                    deletingId === leave.id ||
                                    updatingStatusId === leave.id
                                  }
                                  style={{
                                    ...secondaryButtonStyle,
                                    padding: "7px 12px",
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(leave.id)}
                                  disabled={
                                    deletingId === leave.id ||
                                    updatingStatusId === leave.id
                                  }
                                  style={{
                                    padding: "7px 12px",
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "5px",
                                  }}
                                >
                                  {deletingId === leave.id ? "Deleting..." : "Delete"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
          {hasMoreLeaves && !isLoading && (
            <div style={{ paddingTop: "18px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => void loadLeaves(nextPage, true)}
                disabled={isLoadingMore}
                style={{
                  ...secondaryButtonStyle,
                  cursor: isLoadingMore ? "wait" : "pointer",
                }}
              >
                {isLoadingMore ? "Loading..." : "Load more requests"}
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default Leave
