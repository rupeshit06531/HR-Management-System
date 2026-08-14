import {
  useEffect,
  useState,
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
          "#f5f7fb",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1>
          Leave Management
        </h1>

        <p>
          Submit and manage your
          leave requests.
        </p>

        {error && (
          <p
            style={{
              padding: "12px",
              background:
                "#fee2e2",
              borderRadius: "6px",
              color:
                "#991b1b",
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
                "#dcfce7",
              borderRadius: "6px",
              color:
                "#166534",
            }}
          >
            {success}
          </p>
        )}

        <section
          style={{
            background:
              "#ffffff",
            padding: "24px",
            borderRadius:
              "10px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >
            <h2>
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
                style={{
                  padding:
                    "8px 14px",
                  cursor:
                    "pointer",
                }}
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
            }}
          >
            <label>
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
                style={{
                  display:
                    "block",
                  width: "100%",
                  marginTop:
                    "6px",
                  padding:
                    "10px",
                }}
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

            <label>
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
                style={{
                  display:
                    "block",
                  width: "100%",
                  marginTop:
                    "6px",
                  padding:
                    "10px",
                }}
              />
            </label>

            <label>
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
                style={{
                  display:
                    "block",
                  width: "100%",
                  marginTop:
                    "6px",
                  padding:
                    "10px",
                }}
              />
            </label>

            <label>
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
                  display:
                    "block",
                  width: "100%",
                  marginTop:
                    "6px",
                  padding:
                    "10px",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              style={{
                padding:
                  "12px 18px",
                cursor:
                  isSubmitting
                    ? "not-allowed"
                    : "pointer",
              }}
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
              "#ffffff",
            padding: "24px",
            borderRadius:
              "10px",
            marginTop: "24px",
          }}
        >
          <h2>
            My Leave Requests
          </h2>

          {isLoading ? (
            <p>Loading...</p>
          ) : leaves.length === 0 ? (
            <p>
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
                }}
              >
                <thead>
                  <tr>
                    <th align="left">
                      Type
                    </th>

                    <th align="left">
                      Start
                    </th>

                    <th align="left">
                      End
                    </th>

                    <th align="left">
                      Status
                    </th>

                    <th align="left">
                      Reason
                    </th>

                    <th align="left">
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
                      >
                        <td>
                          {formatLeaveType(
                            leave.leave_type,
                          )}
                        </td>

                        <td>
                          {
                            leave.start_date
                          }
                        </td>

                        <td>
                          {
                            leave.end_date
                          }
                        </td>

                        <td>
                          {formatLeaveType(
                            leave.status,
                          )}
                        </td>

                        <td>
                          {
                            leave.reason
                          }
                        </td>

                        <td>
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
                                handleEdit(
                                  leave,
                                )
                              }
                              disabled={
                                deletingId ===
                                leave.id
                              }
                              style={{
                                padding:
                                  "7px 12px",
                                cursor:
                                  "pointer",
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