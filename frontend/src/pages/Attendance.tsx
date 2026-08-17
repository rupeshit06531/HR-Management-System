import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import { useNavigate } from "react-router-dom"

import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  updateAttendance,
  type Attendance as AttendanceRecord,
  type AttendancePayload,
} from "../api/attendance"

import {
  getEmployees,
  type Employee,
} from "../api/employees"

import { useAuth } from "../context/AuthContext"

const emptyForm: AttendancePayload = {
  employee: 0,
  date: "",
  check_in: "",
  check_out: "",
  status: "present",
  remarks: "",
}

function Attendance() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [records, setRecords] = useState<
    AttendanceRecord[]
  >([])

  const [employees, setEmployees] = useState<
    Employee[]
  >([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [isDeleting, setIsDeleting] =
    useState<number | null>(null)

  const [error, setError] = useState<
    string | null
  >(null)

  const [success, setSuccess] = useState<
    string | null
  >(null)

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<AttendancePayload>(
      emptyForm,
    )

  const canManageAttendance =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR" ||
    user?.role === "MANAGER"

  useEffect(() => {
    if (!user) {
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const attendanceResponse =
          await getAttendance()

        const attendanceData =
          Array.isArray(
            attendanceResponse,
          )
            ? attendanceResponse
            : attendanceResponse.results

        setRecords(attendanceData)

        if (canManageAttendance) {
          const employeesResponse =
            await getEmployees()

          const employeeData =
            Array.isArray(
              employeesResponse,
            )
              ? employeesResponse
              : employeesResponse.results

          setEmployees(employeeData)
        }
      } catch (error) {
        console.error(
          "Attendance loading error:",
          error,
        )

        setError(
          "Unable to load attendance records.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [user, canManageAttendance])

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >,
  ) => {
    const { name, value } =
      event.target

    setForm((current) => ({
      ...current,
      [name]:
        name === "employee"
          ? Number(value)
          : value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleAddClick = () => {
    setError(null)
    setSuccess(null)
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (
    record: AttendanceRecord,
  ) => {
    setError(null)
    setSuccess(null)

    setEditingId(record.id)

    setForm({
      employee: record.employee,
      date: record.date,
      check_in:
        record.check_in ?? "",
      check_out:
        record.check_out ?? "",
      status: record.status,
      remarks:
        record.remarks ?? "",
    })

    setShowForm(true)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      if (!form.employee) {
        setError(
          "Please select an employee.",
        )
        return
      }

      if (!form.date) {
        setError(
          "Please select an attendance date.",
        )
        return
      }

      const payload: AttendancePayload = {
        employee: form.employee,
        date: form.date,
        check_in:
          form.check_in || null,
        check_out:
          form.check_out || null,
        status: form.status,
        remarks:
          form.remarks || "",
      }

      if (editingId !== null) {
        const updated =
          await updateAttendance(
            editingId,
            payload,
          )

        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? updated
              : record,
          ),
        )

        setSuccess(
          "Attendance record updated successfully.",
        )
      } else {
        const created =
          await createAttendance(
            payload,
          )

        setRecords((current) => [
          created,
          ...current,
        ])

        setSuccess(
          "Attendance record created successfully.",
        )
      }

      resetForm()
    } catch (error) {
      console.error(
        "Attendance submission error:",
        error,
      )

      setError(
        editingId !== null
          ? "Unable to update attendance record."
          : "Unable to create attendance record.",
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
        "Are you sure you want to delete this attendance record?",
      )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(id)
      setError(null)
      setSuccess(null)

      await deleteAttendance(id)

      setRecords((current) =>
        current.filter(
          (record) =>
            record.id !== id,
        ),
      )

      setSuccess(
        "Attendance record deleted successfully.",
      )
    } catch (error) {
      console.error(
        "Attendance delete error:",
        error,
      )

      setError(
        "Unable to delete attendance record.",
      )
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <p>Loading attendance...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        boxSizing: "border-box",
        backgroundColor: "#f5f7fa",
        fontFamily:
          "Arial, sans-serif",
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
            Attendance
          </h1>

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#6b7280",
            }}
          >
            {canManageAttendance
              ? "Manage employee attendance records"
              : "View your attendance records"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          {canManageAttendance && (
            <button
              type="button"
              onClick={
                handleAddClick
              }
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
              Add Attendance
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
              )
            }
            style={{
              padding:
                "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor:
                "#1f2937",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
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

      {showForm &&
        canManageAttendance && (
          <section
            style={{
              backgroundColor:
                "#ffffff",
              borderRadius: "10px",
              padding: "24px",
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
                marginBottom:
                  "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                }}
              >
                {editingId !== null
                  ? "Edit Attendance"
                  : "Add Attendance"}
              </h2>

              <button
                type="button"
                onClick={
                  resetForm
                }
                style={{
                  padding:
                    "8px 14px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "6px",
                  backgroundColor:
                    "#ffffff",
                  color:
                    "#374151",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Employee

                  <select
                    name="employee"
                    value={
                      form.employee || ""
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                    }}
                  >
                    <option value="">
                      Select employee
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
                          {
                            employee.employee_id
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Date

                  <input
                    type="date"
                    name="date"
                    value={
                      form.date
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Check In

                  <input
                    type="time"
                    name="check_in"
                    value={
                      form.check_in ??
                      ""
                    }
                    onChange={
                      handleInputChange
                    }
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Check Out

                  <input
                    type="time"
                    name="check_out"
                    value={
                      form.check_out ??
                      ""
                    }
                    onChange={
                      handleInputChange
                    }
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Status

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                    }}
                  >
                    <option value="present">
                      Present
                    </option>

                    <option value="absent">
                      Absent
                    </option>

                    <option value="late">
                      Late
                    </option>

                    <option value="half_day">
                      Half Day
                    </option>
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Remarks

                  <textarea
                    name="remarks"
                    value={
                      form.remarks ??
                      ""
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={3}
                    style={{
                      padding:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "6px",
                      resize:
                        "vertical",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  marginTop:
                    "20px",
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
                        ? "#9ca3af"
                        : "#16a34a",
                    color:
                      "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Attendance"
                      : "Save Attendance"}
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
          padding: "24px",
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.08)",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#111827",
            }}
          >
            Attendance Records
          </h2>

          <span
            style={{
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Total:{" "}
            {records.length}
          </span>
        </div>

        {records.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding:
                "24px 0",
              color: "#6b7280",
              textAlign:
                "center",
            }}
          >
            No attendance
            records found.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth:
                canManageAttendance
                  ? "1000px"
                  : "800px",
            }}
          >
            <thead>
              <tr>
                {[
                  "ID",
                  "Employee",
                  "Employee ID",
                  "Date",
                  "Check In",
                  "Check Out",
                  "Status",
                  "Remarks",
                  ...(canManageAttendance
                    ? ["Actions"]
                    : []),
                ].map(
                  (heading) => (
                    <th
                      key={
                        heading
                      }
                      style={{
                        textAlign:
                          "left",
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #e5e7eb",
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
              {records.map(
                (record) => (
                  <tr
                    key={
                      record.id
                    }
                  >
                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.id}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.employee_name ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.employee_id ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.date}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.check_in ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.check_out ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {record.status.replace(
                        "_",
                        " ",
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                        borderBottom:
                          "1px solid #f0f0f0",
                      }}
                    >
                      {record.remarks ||
                        "-"}
                    </td>

                    {canManageAttendance && (
                      <td
                        style={{
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid #f0f0f0",
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
                              handleEdit(
                                record,
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
                              isDeleting ===
                              record.id
                            }
                            onClick={() =>
                              void handleDelete(
                                record.id,
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
                                isDeleting ===
                                record.id
                                  ? "#9ca3af"
                                  : "#dc2626",
                              color:
                                "#ffffff",
                              cursor:
                                isDeleting ===
                                record.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {isDeleting ===
                            record.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

export default Attendance