
import {
  useEffect,
  useState,
  type FormEvent,
} from "react"

import {
  createPayroll,
  deletePayroll,
  getPayroll,
  updatePayroll,
  type Payroll,
  type PayrollPayload,
} from "../api/payroll"

interface PayrollForm {
  employee: number
  month: string
  basic_salary: string
  allowances: string
  deductions: string
  payment_status: "pending" | "paid"
  paid_at: string
}

const emptyForm: PayrollForm = {
  employee: 0,
  month: "",
  basic_salary: "",
  allowances: "0",
  deductions: "0",
  payment_status: "pending",
  paid_at: "",
}

function PayrollPage() {
  const [records, setRecords] = useState<Payroll[]>([])

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
    useState<PayrollForm>(emptyForm)

  const loadPayroll = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getPayroll()

      if (Array.isArray(response)) {
        setRecords(response)
      } else {
        setRecords(response.results ?? [])
      }
    } catch {
      setError(
        "Unable to load payroll records.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPayroll()
  }, [])

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const openEditForm = (record: Payroll) => {
    setForm({
      employee: record.employee,
      month: record.month.slice(0, 7),
      basic_salary: record.basic_salary,
      allowances: record.allowances,
      deductions: record.deductions,
      payment_status: record.payment_status,
      paid_at: record.paid_at
        ? record.paid_at.slice(0, 16)
        : "",
    })

    setEditingId(record.id)
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

    if (!form.month) {
      setError("Payroll month is required.")
      return
    }

    if (!form.basic_salary) {
      setError("Basic salary is required.")
      return
    }

    const basicSalary =
      Number(form.basic_salary)

    const allowances =
      Number(form.allowances || "0")

    const deductions =
      Number(form.deductions || "0")

    if (
      !Number.isFinite(basicSalary) ||
      basicSalary < 0
    ) {
      setError(
        "Basic salary must be a valid non-negative amount.",
      )
      return
    }

    if (
      !Number.isFinite(allowances) ||
      allowances < 0
    ) {
      setError(
        "Allowances must be a valid non-negative amount.",
      )
      return
    }

    if (
      !Number.isFinite(deductions) ||
      deductions < 0
    ) {
      setError(
        "Deductions must be a valid non-negative amount.",
      )
      return
    }

    if (
      form.payment_status === "paid" &&
      !form.paid_at
    ) {
      setError(
        "Paid date and time is required for paid payroll.",
      )
      return
    }

    if (
      form.payment_status === "pending" &&
      form.paid_at
    ) {
      setError(
        "Paid date and time must be empty for pending payroll.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: PayrollPayload = {
        employee: form.employee,

        month: `${form.month}-01`,

        basic_salary:
          form.basic_salary,

        allowances:
          form.allowances || "0",

        deductions:
          form.deductions || "0",

        payment_status:
          form.payment_status,

        ...(form.payment_status === "paid"
          ? {
              paid_at: new Date(
                form.paid_at,
              ).toISOString(),
            }
          : {}),
      }

      if (editingId !== null) {
        const updated =
          await updatePayroll(
            editingId,
            payload,
          )

        setRecords(
          (current) =>
            current.map(
              (record) =>
                record.id === editingId
                  ? updated
                  : record,
            ),
        )

        setSuccess(
          "Payroll record updated successfully.",
        )
      } else {
        const created =
          await createPayroll(payload)

        setRecords(
          (current) => [
            created,
            ...current,
          ],
        )

        setSuccess(
          "Payroll record created successfully.",
        )
      }

      resetForm()
    } catch {
      setError(
        editingId !== null
          ? "Unable to update payroll record."
          : "Unable to create payroll record.",
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
        "Are you sure you want to delete this payroll record?",
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deletePayroll(id)

      setRecords(
        (current) =>
          current.filter(
            (record) =>
              record.id !== id,
          ),
      )

      setSuccess(
        "Payroll record deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete payroll record.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (
    value: string,
  ) => {
    const amount = Number(value)

    if (!Number.isFinite(amount)) {
      return value
    }

    return `₹${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`
  }

  const formatStatus = (
    value: string,
  ) => {
    return value
      .replace("_", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  }

  const formatPaidAt = (
    value: string | null,
  ) => {
    if (!value) {
      return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
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
            justifyContent: "space-between",
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
              Payroll
            </h1>

            <p
              style={{
                color: "#6b7280",
                marginBottom: 0,
              }}
            >
              Manage employee payroll records
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Add Payroll
          </button>
        </header>

        {error && (
          <section
            style={{
              padding: "16px",
              marginBottom: "20px",
              backgroundColor: "#fee2e2",
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
              backgroundColor: "#dcfce7",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            {success}
          </section>
        )}

        {showForm && (
          <section
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2>
              {editingId !== null
                ? "Edit Payroll"
                : "Add Payroll"}
            </h2>

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
                            event.target.value,
                          ),
                      }),
                    )
                  }
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                Payroll Month

                <input
                  type="month"
                  value={form.month}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        month:
                          event.target.value,
                      }),
                    )
                  }
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                Basic Salary

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.basic_salary
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        basic_salary:
                          event.target.value,
                      }),
                    )
                  }
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                Allowances

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.allowances
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        allowances:
                          event.target.value,
                      }),
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                Deductions

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.deductions
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        deductions:
                          event.target.value,
                      }),
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                Payment Status

                <select
                  value={
                    form.payment_status
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        payment_status:
                          event.target
                            .value as
                            | "pending"
                            | "paid",
                        paid_at:
                          event.target
                            .value === "pending"
                            ? ""
                            : current.paid_at,
                      }),
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                  }}
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="paid">
                    Paid
                  </option>
                </select>
              </label>

              {form.payment_status ===
                "paid" && (
                <label>
                  Paid At

                  <input
                    type="datetime-local"
                    value={
                      form.paid_at
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          paid_at:
                            event.target
                              .value,
                        }),
                      )
                    }
                    required
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "6px",
                      padding: "10px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor:
                      "#2563eb",
                    color: "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Payroll"
                      : "Save Payroll"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 18px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor:
                      "#ffffff",
                    cursor: "pointer",
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
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            overflow: "auto",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom:
                "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              Payroll Records
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
              }}
            >
              Loading payroll...
            </p>
          ) : records.length === 0 ? (
            <p
              style={{
                padding: "24px",
                color: "#6b7280",
              }}
            >
              No payroll records found.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1300px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Month",
                    "Basic",
                    "Allowances",
                    "Deductions",
                    "Gross",
                    "Net Salary",
                    "Status",
                    "Paid At",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px",
                        textAlign:
                          [
                            "Basic",
                            "Allowances",
                            "Deductions",
                            "Gross",
                            "Net Salary",
                          ].includes(
                            heading,
                          )
                            ? "right"
                            : "left",
                        borderBottom:
                          "1px solid #e5e7eb",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >
                      <td
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        <strong>
                          {record.employee_name ||
                            "-"}
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "4px",
                          }}
                        >
                          {record.employee_id ||
                            `Employee #${record.employee}`}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {record.month}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatCurrency(
                          record.basic_salary,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatCurrency(
                          record.allowances,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatCurrency(
                          record.deductions,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatCurrency(
                          record.gross_salary,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #f3f4f6",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(
                          record.net_salary,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatStatus(
                          record.payment_status,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {formatPaidAt(
                          record.paid_at,
                        )}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
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
                              deletingId ===
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
                              border: "none",
                              borderRadius:
                                "6px",
                              backgroundColor:
                                "#dc2626",
                              color:
                                "#ffffff",
                              cursor:
                                deletingId ===
                                record.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {deletingId ===
                            record.id
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

export default PayrollPage