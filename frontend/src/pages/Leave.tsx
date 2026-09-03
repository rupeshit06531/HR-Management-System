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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "18px",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#111827",
}

const containerStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "5px",
}

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "13px",
  outline: "none",
}

const primaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "7px 13px",
  border: "none",
  borderRadius: "6px",
  background: "#111827",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
}

const secondaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "7px 13px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
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

  const totalLeaves = leaves.length

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status.toLowerCase() ===
      "pending",
  ).length

  const approvedLeaves = leaves.filter(
    (leave) =>
      leave.status.toLowerCase() ===
      "approved",
  ).length

  return (
    <main style={pageStyle}>
      <style>
        {`
          .leave-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 14px;
          }

          .leave-kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }

          .leave-kpi {
            padding: 12px 14px;
          }

          .leave-kpi-label {
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .leave-kpi-value {
            margin-top: 3px;
            font-size: 22px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .leave-content {
            display: grid;
            grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
            gap: 12px;
            align-items: start;
          }

          .leave-card {
            padding: 14px;
          }

          .leave-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .leave-card-title {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: #111827;
          }

          .leave-card-subtitle {
            margin: 3px 0 0;
            font-size: 11px;
            color: #6b7280;
          }

          .leave-form {
            display: grid;
            gap: 10px;
          }

          .leave-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .leave-field {
            min-width: 0;
          }

          .leave-textarea {
            min-height: 82px;
            resize: vertical;
          }

          .leave-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
            padding-top: 2px;
          }

          .leave-table-wrap {
            overflow-x: auto;
          }

          .leave-table {
            width: 100%;
            min-width: 820px;
            border-collapse: collapse;
            font-size: 12px;
          }

          .leave-table th {
            padding: 8px 9px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            color: #6b7280;
            font-size: 10px;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
          }

          .leave-table td {
            padding: 9px;
            border-bottom: 1px solid #eef0f3;
            color: #374151;
            vertical-align: middle;
          }

          .leave-table tbody tr:last-child td {
            border-bottom: none;
          }

          .leave-table tbody tr:hover {
            background: #fafafa;
          }

          .leave-type {
            font-weight: 700;
            color: #111827;
          }

          .leave-reason {
            max-width: 220px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .leave-status {
            display: inline-flex;
            align-items: center;
            min-height: 22px;
            padding: 3px 8px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #374151;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .leave-actions {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .leave-action {
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .leave-action-edit {
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #374151;
          }

          .leave-action-delete {
            border: 1px solid #dc2626;
            background: #dc2626;
            color: #ffffff;
          }

          .leave-empty {
            padding: 26px 12px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }

          .leave-alert {
            margin-bottom: 10px;
            padding: 9px 11px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .leave-alert-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .leave-alert-success {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          .leave-loading {
            padding: 26px 12px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }

          @media (max-width: 900px) {
            .leave-content {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .leave-kpis {
              grid-template-columns: 1fr;
            }

            .leave-form-grid {
              grid-template-columns: 1fr;
            }

            .leave-header {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section style={containerStyle}>
        <header className="leave-header">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "3px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                HRMS
              </span>

              <span
                style={{
                  color: "#d1d5db",
                  fontSize: "11px",
                }}
              >
                /
              </span>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Leave
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                lineHeight: 1.2,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              Leave Management
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Submit and manage your leave requests.
            </p>
          </div>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              style={secondaryButtonStyle}
            >
              Cancel Edit
            </button>
          )}
        </header>

        {error && (
          <div className="leave-alert leave-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="leave-alert leave-alert-success">
            {success}
          </div>
        )}

        <section className="leave-kpis">
          <div
            className="leave-kpi"
            style={cardStyle}
          >
            <div className="leave-kpi-label">
              Total Requests
            </div>

            <div className="leave-kpi-value">
              {totalLeaves}
            </div>
          </div>

          <div
            className="leave-kpi"
            style={cardStyle}
          >
            <div className="leave-kpi-label">
              Pending
            </div>

            <div className="leave-kpi-value">
              {pendingLeaves}
            </div>
          </div>

          <div
            className="leave-kpi"
            style={cardStyle}
          >
            <div className="leave-kpi-label">
              Approved
            </div>

            <div className="leave-kpi-value">
              {approvedLeaves}
            </div>
          </div>
        </section>

        <section className="leave-content">
          <section
            className="leave-card"
            style={cardStyle}
          >
            <div className="leave-card-header">
              <div>
                <h2 className="leave-card-title">
                  {editingId !== null
                    ? "Edit Leave Request"
                    : "Apply for Leave"}
                </h2>

                <p className="leave-card-subtitle">
                  {editingId !== null
                    ? "Update the selected leave request."
                    : "Submit a new leave request."}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="leave-form"
            >
              <div className="leave-field">
                <label
                  htmlFor="leave-type"
                  style={labelStyle}
                >
                  Leave Type
                </label>

                <select
                  id="leave-type"
                  value={form.leave_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      leave_type:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {leaveTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="leave-form-grid">
                <div className="leave-field">
                  <label
                    htmlFor="leave-start-date"
                    style={labelStyle}
                  >
                    Start Date
                  </label>

                  <input
                    id="leave-start-date"
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_date:
                          event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div className="leave-field">
                  <label
                    htmlFor="leave-end-date"
                    style={labelStyle}
                  >
                    End Date
                  </label>

                  <input
                    id="leave-end-date"
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_date:
                          event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="leave-field">
                <label
                  htmlFor="leave-reason"
                  style={labelStyle}
                >
                  Reason
                </label>

                <textarea
                  id="leave-reason"
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reason:
                        event.target.value,
                    }))
                  }
                  rows={4}
                  className="leave-textarea"
                  style={inputStyle}
                />
              </div>

              <div className="leave-form-actions">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      isSubmitting ? 0.65 : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isSubmitting
                    ? editingId !== null
                      ? "Updating..."
                      : "Submitting..."
                    : editingId !== null
                      ? "Update Request"
                      : "Submit Request"}
                </button>
              </div>
            </form>
          </section>

          <section
            className="leave-card"
            style={cardStyle}
          >
            <div className="leave-card-header">
              <div>
                <h2 className="leave-card-title">
                  My Leave Requests
                </h2>

                <p className="leave-card-subtitle">
                  View, edit and manage submitted requests.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="leave-loading">
                Loading leave records...
              </div>
            ) : leaves.length === 0 ? (
              <div className="leave-empty">
                No leave records found.
              </div>
            ) : (
              <div className="leave-table-wrap">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>
                          <span className="leave-type">
                            {formatLeaveType(
                              leave.leave_type,
                            )}
                          </span>
                        </td>

                        <td>
                          {leave.start_date}
                        </td>

                        <td>
                          {leave.end_date}
                        </td>

                        <td>
                          <span className="leave-status">
                            {formatLeaveType(
                              leave.status,
                            )}
                          </span>
                        </td>

                        <td>
                          <div
                            className="leave-reason"
                            title={leave.reason}
                          >
                            {leave.reason}
                          </div>
                        </td>

                        <td>
                          <div className="leave-actions">
                            <button
                              type="button"
                              className="leave-action leave-action-edit"
                              onClick={() =>
                                handleEdit(
                                  leave,
                                )
                              }
                              disabled={
                                deletingId ===
                                leave.id
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="leave-action leave-action-delete"
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
                                opacity:
                                  deletingId ===
                                  leave.id
                                    ? 0.65
                                    : 1,
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  )
}

export default Leave