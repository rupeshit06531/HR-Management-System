import {
  useEffect,
  useMemo,
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const [searchTerm, setSearchTerm] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState<"all" | "pending" | "paid">(
      "all",
    )

  const [monthFilter, setMonthFilter] =
    useState("")

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
      payment_status:
        record.payment_status,
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

  const formatMonth = (
    value: string,
  ) => {
    if (!value) {
      return "-"
    }

    const date = new Date(
      `${value.slice(0, 7)}-01T00:00:00`,
    )

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "short",
        year: "numeric",
      },
    )
  }

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase()

    return records.filter((record) => {
      const employeeText = [
        record.employee_name ?? "",
        record.employee_id ?? "",
        String(record.employee),
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        employeeText.includes(
          normalizedSearch,
        )

      const matchesStatus =
        statusFilter === "all" ||
        record.payment_status ===
          statusFilter

      const matchesMonth =
        !monthFilter ||
        record.month.startsWith(
          monthFilter,
        )

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMonth
      )
    })
  }, [
    records,
    searchTerm,
    statusFilter,
    monthFilter,
  ])

  const statistics = useMemo(() => {
    const paidRecords =
      records.filter(
        (record) =>
          record.payment_status ===
          "paid",
      )

    const pendingRecords =
      records.filter(
        (record) =>
          record.payment_status ===
          "pending",
      )

    const totalNetSalary =
      records.reduce(
        (total, record) =>
          total +
          Number(record.net_salary || 0),
        0,
      )

    const paidNetSalary =
      paidRecords.reduce(
        (total, record) =>
          total +
          Number(record.net_salary || 0),
        0,
      )

    return {
      total: records.length,
      paid: paidRecords.length,
      pending: pendingRecords.length,
      totalNetSalary,
      paidNetSalary,
    }
  }, [records])

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fa",
        fontFamily:
          "Inter, Arial, sans-serif",
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
            justifyContent:
              "space-between",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "30px",
                fontWeight: 700,
              }}
            >
              Payroll
            </h1>

            <p
              style={{
                color: "#6b7280",
                margin:
                  "7px 0 0",
                fontSize: "15px",
              }}
            >
              Manage employee salary,
              payment and payroll records.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              padding:
                "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow:
                "0 2px 5px rgba(37, 99, 235, 0.25)",
            }}
          >
            + Add Payroll
          </button>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              padding:
                "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              padding:
                "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                "#f0fdf4",
              border:
                "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            {success}
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              backgroundColor:
                "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Total Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color: "#111827",
              }}
            >
              {statistics.total}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Paid Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color: "#166534",
              }}
            >
              {statistics.paid}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Pending Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color: "#92400e",
              }}
            >
              {statistics.pending}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Total Net Salary
            </div>

            <strong
              style={{
                fontSize: "22px",
                color: "#111827",
              }}
            >
              {formatCurrency(
                String(
                  statistics.totalNetSalary,
                ),
              )}
            </strong>
          </div>
        </section>

        {showForm && (
          <section
            style={{
              backgroundColor:
                "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              border:
                "1px solid #e5e7eb",
              boxShadow:
                "0 2px 6px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "16px",
                marginBottom:
                  "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color:
                      "#111827",
                    fontSize:
                      "20px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Payroll"
                    : "Add Payroll"}
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
                  Enter the payroll
                  details below.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  resetForm
                }
                disabled={
                  isSubmitting
                }
                style={{
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "#6b7280",
                  cursor:
                    isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  fontSize:
                    "22px",
                }}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              style={{
                display: "grid",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Employee ID

                  <input
                    type="number"
                    min="1"
                    value={
                      form.employee ||
                      ""
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          employee:
                            Number(
                              event
                                .target
                                .value,
                            ),
                        }),
                      )
                    }
                    required
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Payroll Month

                  <input
                    type="month"
                    value={
                      form.month
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          month:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    required
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Basic Salary

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.basic_salary
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          basic_salary:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    required
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Allowances

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.allowances
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          allowances:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Deductions

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.deductions
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          deductions:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <label
                  style={{
                    color:
                      "#374151",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Payment Status

                  <select
                    value={
                      form.payment_status
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          payment_status:
                            event
                              .target
                              .value as
                              | "pending"
                              | "paid",
                          paid_at:
                            event
                              .target
                              .value ===
                            "pending"
                              ? ""
                              : current.paid_at,
                        }),
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop:
                        "7px",
                      padding:
                        "11px 12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "7px",
                      backgroundColor:
                        "#ffffff",
                      boxSizing:
                        "border-box",
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
                  <label
                    style={{
                      color:
                        "#374151",
                      fontSize:
                        "14px",
                      fontWeight:
                        600,
                    }}
                  >
                    Paid At

                    <input
                      type="datetime-local"
                      value={
                        form.paid_at
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            paid_at:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      required
                      style={{
                        display:
                          "block",
                        width:
                          "100%",
                        marginTop:
                          "7px",
                        padding:
                          "11px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "7px",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>
                )}
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  flexWrap:
                    "wrap",
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
                      "7px",
                    backgroundColor:
                      isSubmitting
                        ? "#93c5fd"
                        : "#2563eb",
                    color:
                      "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      600,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !==
                        null
                      ? "Update Payroll"
                      : "Save Payroll"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "7px",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#374151",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      600,
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
            border:
              "1px solid #e5e7eb",
            overflow: "hidden",
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
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "16px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color:
                      "#111827",
                    fontSize:
                      "19px",
                  }}
                >
                  Payroll Records
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#6b7280",
                    fontSize:
                      "13px",
                  }}
                >
                  Showing{" "}
                  {
                    filteredRecords.length
                  }{" "}
                  of{" "}
                  {records.length}{" "}
                  records
                </p>
              </div>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "minmax(240px, 1fr) 170px 170px",
                gap: "10px",
                marginTop:
                  "18px",
              }}
            >
              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event,
                ) =>
                  setSearchTerm(
                    event.target
                      .value,
                  )
                }
                placeholder="Search employee..."
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "7px",
                  outline:
                    "none",
                  boxSizing:
                    "border-box",
                  width:
                    "100%",
                }}
              />

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "all"
                      | "pending"
                      | "paid",
                  )
                }
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "7px",
                  backgroundColor:
                    "#ffffff",
                }}
              >
                <option value="all">
                  All Status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="paid">
                  Paid
                </option>
              </select>

              <input
                type="month"
                value={
                  monthFilter
                }
                onChange={(
                  event,
                ) =>
                  setMonthFilter(
                    event.target
                      .value,
                  )
                }
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "7px",
                  backgroundColor:
                    "#ffffff",
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                padding:
                  "45px 24px",
                textAlign:
                  "center",
                color:
                  "#6b7280",
              }}
            >
              Loading payroll...
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div
              style={{
                padding:
                  "50px 24px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "36px",
                  marginBottom:
                    "10px",
                }}
              >
                ₹
              </div>

              <h3
                style={{
                  margin:
                    "0 0 6px",
                  color:
                    "#111827",
                }}
              >
                No payroll records
                found
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    "#6b7280",
                }}
              >
                Try changing the
                filters or add a
                new payroll record.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "1350px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor:
                        "#f9fafb",
                    }}
                  >
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
                    ].map(
                      (heading) => (
                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "13px 16px",
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
                            color:
                              "#4b5563",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            textTransform:
                              "uppercase",
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
                  {filteredRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              "1px solid #f3f4f6",
                            color:
                              "#111827",
                          }}
                        >
                          <strong>
                            {record.employee_name ||
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
                            {record.employee_id ||
                              `Employee #${record.employee}`}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                            color:
                              "#374151",
                          }}
                        >
                          {formatMonth(
                            record.month,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatCurrency(
                            record.basic_salary,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatCurrency(
                            record.allowances,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatCurrency(
                            record.deductions,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatCurrency(
                            record.gross_salary,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            textAlign:
                              "right",
                            borderBottom:
                              "1px solid #f3f4f6",
                            fontWeight:
                              700,
                            color:
                              "#111827",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatCurrency(
                            record.net_salary,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              "1px solid #f3f4f6",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              backgroundColor:
                                record.payment_status ===
                                "paid"
                                  ? "#dcfce7"
                                  : "#fef3c7",
                              color:
                                record.payment_status ===
                                "paid"
                                  ? "#166534"
                                  : "#92400e",
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                            }}
                          >
                            {formatStatus(
                              record.payment_status,
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              "1px solid #f3f4f6",
                            whiteSpace:
                              "nowrap",
                            color:
                              "#4b5563",
                          }}
                        >
                          {formatPaidAt(
                            record.paid_at,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
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
                                  deletingId ===
                                  record.id
                                    ? "#fca5a5"
                                    : "#dc2626",
                                color:
                                  "#ffffff",
                                cursor:
                                  deletingId ===
                                  record.id
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight:
                                  600,
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
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default PayrollPage