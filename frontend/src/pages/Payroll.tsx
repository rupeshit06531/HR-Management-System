import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createPayroll,
  deletePayroll,
  getPayroll,
  patchPayroll,
  type Payroll,
  type PayrollPayload,
} from "../api/payroll"

import {
  getEmployees,
  type Employee,
} from "../api/employees"

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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "18px",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#111827",
  boxSizing: "border-box",
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

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "34px",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "12px",
  outline: "none",
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#374151",
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

function PayrollPage() {
  const [records, setRecords] = useState<Payroll[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] =
    useState(true)

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

  const pageSize = 10

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize),
  )

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)

      const response = await getEmployees({
        employment_status: "ACTIVE",
        ordering: "full_name",
      })

      setEmployees(response.results ?? [])
    } catch {
      setError(
        "Unable to load active employees.",
      )
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const loadPayroll = async (
    page = currentPage,
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getPayroll({
        page,
        search:
          searchTerm.trim() || undefined,
        payment_status:
          statusFilter === "all"
            ? undefined
            : statusFilter,
        month:
          monthFilter || undefined,
        ordering:
          "-month,-created_at,-id",
      })

      setRecords(response.results ?? [])
      setTotalRecords(response.count ?? 0)
    } catch {
      setError(
        "Unable to load payroll records.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPayroll(currentPage)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    monthFilter,
  ])

  useEffect(() => {
    if (
      currentPage > totalPages &&
      totalPages > 0
    ) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
      setError("Please select an employee.")
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

    const basicSalary = Number(
      form.basic_salary,
    )

    const allowances = Number(
      form.allowances || "0",
    )

    const deductions = Number(
      form.deductions || "0",
    )

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
        basic_salary: form.basic_salary,
        allowances: form.allowances || "0",
        deductions: form.deductions || "0",
        payment_status: form.payment_status,
        paid_at:
          form.payment_status === "paid"
            ? new Date(
                form.paid_at,
              ).toISOString()
            : null,
      }

      if (editingId !== null) {
        await patchPayroll(
          editingId,
          payload,
        )

        await loadPayroll(currentPage)

        setSuccess(
          "Payroll record updated successfully.",
        )
      } else {
        await createPayroll(payload)

        setTotalRecords(
          (current) => current + 1,
        )

        if (currentPage !== 1) {
          setCurrentPage(1)
        } else {
          await loadPayroll(1)
        }

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
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

      const nextTotalRecords = Math.max(
        0,
        totalRecords - 1,
      )

      const nextTotalPages = Math.max(
        1,
        Math.ceil(
          nextTotalRecords / pageSize,
        ),
      )

      const nextPage =
        currentPage > nextTotalPages
          ? nextTotalPages
          : currentPage

      setTotalRecords(nextTotalRecords)

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
      } else {
        await loadPayroll(nextPage)
      }

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

  const formatCurrency = (value: string) => {
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

  const formatStatus = (value: string) => {
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

  const formatMonth = (value: string) => {
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

  const statistics = useMemo(() => {
    const paidRecords = records.filter(
      (record) =>
        record.payment_status === "paid",
    )

    const pendingRecords = records.filter(
      (record) =>
        record.payment_status === "pending",
    )

    const totalNetSalary = records.reduce(
      (total, record) =>
        total +
        Number(record.net_salary || 0),
      0,
    )

    const paidNetSalary = paidRecords.reduce(
      (total, record) =>
        total +
        Number(record.net_salary || 0),
      0,
    )

    return {
      paid: paidRecords.length,
      pending: pendingRecords.length,
      totalNetSalary,
      paidNetSalary,
    }
  }, [records])

  const rangeStart =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * pageSize + 1

  const rangeEnd = Math.min(
    currentPage * pageSize,
    totalRecords,
  )

  return (
    <main style={pageStyle}>
      <style>
        {`
          .payroll-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 12px;
          }

          .payroll-kpis {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }

          .payroll-kpi {
            padding: 12px 14px;
          }

          .payroll-kpi-label {
            font-size: 10px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .payroll-kpi-value {
            margin-top: 3px;
            font-size: 21px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .payroll-kpi-sub {
            margin-top: 4px;
            font-size: 10px;
            color: #9ca3af;
          }

          .payroll-form-card {
            padding: 14px;
            margin-bottom: 12px;
          }

          .payroll-form-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .payroll-form {
            display: grid;
            gap: 10px;
          }

          .payroll-form-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .payroll-field {
            min-width: 0;
          }

          .payroll-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
          }

          .payroll-list-card {
            overflow: hidden;
          }

          .payroll-list-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .payroll-filters {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 150px 150px;
            gap: 8px;
            width: min(650px, 100%);
          }

          .payroll-table-wrap {
            overflow-x: auto;
          }

          .payroll-table {
            width: 100%;
            min-width: 1200px;
            border-collapse: collapse;
            font-size: 11px;
          }

          .payroll-table th {
            padding: 8px 9px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            color: #6b7280;
            font-size: 9px;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
          }

          .payroll-table th.money,
          .payroll-table td.money {
            text-align: right;
          }

          .payroll-table td {
            padding: 9px;
            border-bottom: 1px solid #eef0f3;
            color: #374151;
            vertical-align: middle;
            white-space: nowrap;
          }

          .payroll-table tbody tr:last-child td {
            border-bottom: none;
          }

          .payroll-table tbody tr:hover {
            background: #fafafa;
          }

          .payroll-employee {
            max-width: 175px;
            overflow: hidden;
            color: #111827;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .payroll-employee-id {
            margin-top: 2px;
            color: #9ca3af;
            font-size: 10px;
          }

          .payroll-net {
            color: #111827;
            font-weight: 800;
          }

          .payroll-status {
            display: inline-flex;
            align-items: center;
            min-height: 21px;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .payroll-status-paid {
            background: #dcfce7;
            color: #166534;
          }

          .payroll-status-pending {
            background: #fef3c7;
            color: #92400e;
          }

          .payroll-actions {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .payroll-edit,
          .payroll-delete {
            min-height: 27px;
            padding: 5px 9px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
          }

          .payroll-edit {
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #374151;
          }

          .payroll-delete {
            border: 1px solid #dc2626;
            background: #dc2626;
            color: #ffffff;
          }

          .payroll-pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 14px;
            border-top: 1px solid #e5e7eb;
          }

          .payroll-pagination-info {
            color: #6b7280;
            font-size: 11px;
          }

          .payroll-pagination-actions {
            display: flex;
            gap: 6px;
          }

          .payroll-page-button {
            min-height: 29px;
            padding: 5px 10px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            background: #ffffff;
            color: #374151;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
          }

          .payroll-page-button:disabled {
            background: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
          }

          .payroll-alert {
            margin-bottom: 10px;
            padding: 9px 11px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .payroll-alert-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .payroll-alert-success {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          .payroll-empty,
          .payroll-loading {
            padding: 28px 14px;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }

          @media (max-width: 1000px) {
            .payroll-kpis {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .payroll-form-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .payroll-list-header {
              align-items: stretch;
              flex-direction: column;
            }

            .payroll-filters {
              width: 100%;
            }
          }

          @media (max-width: 650px) {
            .payroll-kpis {
              grid-template-columns: 1fr;
            }

            .payroll-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .payroll-form-grid,
            .payroll-filters {
              grid-template-columns: 1fr;
            }

            .payroll-pagination {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section style={containerStyle}>
        <header className="payroll-header">
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
                Payroll
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
              Payroll
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Manage employee salary,
              payments and payroll records.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={primaryButtonStyle}
          >
            + Add Payroll
          </button>
        </header>

        {error && (
          <section
            role="alert"
            className="payroll-alert payroll-alert-error"
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            className="payroll-alert payroll-alert-success"
          >
            {success}
          </section>
        )}

        <section className="payroll-kpis">
          <div
            className="payroll-kpi"
            style={cardStyle}
          >
            <div className="payroll-kpi-label">
              Total Records
            </div>

            <div className="payroll-kpi-value">
              {totalRecords}
            </div>
          </div>

          <div
            className="payroll-kpi"
            style={cardStyle}
          >
            <div className="payroll-kpi-label">
              Paid Records
            </div>

            <div className="payroll-kpi-value">
              {statistics.paid}
            </div>

            <div className="payroll-kpi-sub">
              Current page
            </div>
          </div>

          <div
            className="payroll-kpi"
            style={cardStyle}
          >
            <div className="payroll-kpi-label">
              Pending Records
            </div>

            <div className="payroll-kpi-value">
              {statistics.pending}
            </div>

            <div className="payroll-kpi-sub">
              Current page
            </div>
          </div>

          <div
            className="payroll-kpi"
            style={cardStyle}
          >
            <div className="payroll-kpi-label">
              Current Page Net Salary
            </div>

            <div className="payroll-kpi-value">
              {formatCurrency(
                String(
                  statistics.totalNetSalary,
                ),
              )}
            </div>

            <div className="payroll-kpi-sub">
              Paid:{" "}
              {formatCurrency(
                String(
                  statistics.paidNetSalary,
                ),
              )}
            </div>
          </div>
        </section>

        {showForm && (
          <section
            className="payroll-form-card"
            style={cardStyle}
          >
            <div className="payroll-form-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  {editingId !== null
                    ? "Edit Payroll"
                    : "Add Payroll"}
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Enter payroll details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  ...secondaryButtonStyle,
                  opacity: isSubmitting
                    ? 0.65
                    : 1,
                  cursor: isSubmitting
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="payroll-form"
            >
              <div className="payroll-form-grid">
                <div className="payroll-field">
                  <label
                    htmlFor="payroll-employee"
                    style={labelStyle}
                  >
                    Employee
                  </label>

                  <select
                    id="payroll-employee"
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
                      isLoadingEmployees ||
                      isSubmitting
                    }
                    style={{
                      ...inputStyle,
                      background:
                        isLoadingEmployees
                          ? "#f3f4f6"
                          : "#ffffff",
                    }}
                  >
                    <option value="">
                      {isLoadingEmployees
                        ? "Loading employees..."
                        : "Select employee"}
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.full_name} —{" "}
                          {employee.employee_id}
                        </option>
                      ),
                    )}
                  </select>

                  {!isLoadingEmployees &&
                    employees.length === 0 && (
                      <span
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: "#92400e",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        No active employees
                        available.
                      </span>
                    )}
                </div>

                <div className="payroll-field">
                  <label
                    htmlFor="payroll-month"
                    style={labelStyle}
                  >
                    Payroll Month
                  </label>

                  <input
                    id="payroll-month"
                    type="month"
                    value={form.month}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        month:
                          event.target.value,
                      }))
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="payroll-field">
                  <label
                    htmlFor="basic-salary"
                    style={labelStyle}
                  >
                    Basic Salary
                  </label>

                  <input
                    id="basic-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basic_salary}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        basic_salary:
                          event.target.value,
                      }))
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="payroll-field">
                  <label
                    htmlFor="allowances"
                    style={labelStyle}
                  >
                    Allowances
                  </label>

                  <input
                    id="allowances"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.allowances}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowances:
                          event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div className="payroll-field">
                  <label
                    htmlFor="deductions"
                    style={labelStyle}
                  >
                    Deductions
                  </label>

                  <input
                    id="deductions"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deductions}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deductions:
                          event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div className="payroll-field">
                  <label
                    htmlFor="payment-status"
                    style={labelStyle}
                  >
                    Payment Status
                  </label>

                  <select
                    id="payment-status"
                    value={form.payment_status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_status:
                          event.target.value as
                            | "pending"
                            | "paid",
                        paid_at:
                          event.target.value ===
                          "pending"
                            ? ""
                            : current.paid_at,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="paid">
                      Paid
                    </option>
                  </select>
                </div>

                {form.payment_status ===
                  "paid" && (
                  <div className="payroll-field">
                    <label
                      htmlFor="paid-at"
                      style={labelStyle}
                    >
                      Paid At
                    </label>

                    <input
                      id="paid-at"
                      type="datetime-local"
                      value={form.paid_at}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paid_at:
                            event.target.value,
                        }))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div className="payroll-form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    ...secondaryButtonStyle,
                    opacity: isSubmitting
                      ? 0.65
                      : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingEmployees ||
                    employees.length === 0
                  }
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      isSubmitting ||
                      isLoadingEmployees ||
                      employees.length === 0
                        ? 0.65
                        : 1,
                    cursor:
                      isSubmitting ||
                      isLoadingEmployees ||
                      employees.length === 0
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
              </div>
            </form>
          </section>
        )}

        <section
          className="payroll-list-card"
          style={cardStyle}
        >
          <div className="payroll-list-header">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Payroll Records
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                Showing {rangeStart} - {rangeEnd} of{" "}
                {totalRecords} records
              </p>
            </div>

            <div className="payroll-filters">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search employee..."
                aria-label="Search employee"
                style={inputStyle}
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "pending"
                      | "paid",
                  )
                }
                aria-label="Filter payment status"
                style={inputStyle}
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
                value={monthFilter}
                onChange={(event) =>
                  setMonthFilter(
                    event.target.value,
                  )
                }
                aria-label="Filter payroll month"
                style={inputStyle}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="payroll-loading">
              Loading payroll...
            </div>
          ) : records.length === 0 ? (
            <div className="payroll-empty">
              No payroll records found. Try
              changing the filters or add a new
              payroll record.
            </div>
          ) : (
            <>
              <div className="payroll-table-wrap">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      {[
                        {
                          label: "Employee",
                          className: "",
                        },
                        {
                          label: "Month",
                          className: "",
                        },
                        {
                          label: "Basic",
                          className: "money",
                        },
                        {
                          label: "Allowances",
                          className: "money",
                        },
                        {
                          label: "Deductions",
                          className: "money",
                        },
                        {
                          label: "Gross",
                          className: "money",
                        },
                        {
                          label: "Net Salary",
                          className: "money",
                        },
                        {
                          label: "Status",
                          className: "",
                        },
                        {
                          label: "Paid At",
                          className: "",
                        },
                        {
                          label: "Actions",
                          className: "",
                        },
                      ].map((heading) => (
                        <th
                          key={heading.label}
                          className={
                            heading.className
                          }
                        >
                          {heading.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div
                            className="payroll-employee"
                            title={
                              record.employee_name ||
                              "-"
                            }
                          >
                            {record.employee_name ||
                              "-"}
                          </div>

                          <div className="payroll-employee-id">
                            {record.employee_id ||
                              `Employee #${record.employee}`}
                          </div>
                        </td>

                        <td>
                          {formatMonth(
                            record.month,
                          )}
                        </td>

                        <td className="money">
                          {formatCurrency(
                            record.basic_salary,
                          )}
                        </td>

                        <td className="money">
                          {formatCurrency(
                            record.allowances,
                          )}
                        </td>

                        <td className="money">
                          {formatCurrency(
                            record.deductions,
                          )}
                        </td>

                        <td className="money">
                          {formatCurrency(
                            record.gross_salary,
                          )}
                        </td>

                        <td className="money payroll-net">
                          {formatCurrency(
                            record.net_salary,
                          )}
                        </td>

                        <td>
                          <span
                            className={`payroll-status ${
                              record.payment_status ===
                              "paid"
                                ? "payroll-status-paid"
                                : "payroll-status-pending"
                            }`}
                          >
                            {formatStatus(
                              record.payment_status,
                            )}
                          </span>
                        </td>

                        <td>
                          {formatPaidAt(
                            record.paid_at,
                          )}
                        </td>

                        <td>
                          <div className="payroll-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  record,
                                )
                              }
                              className="payroll-edit"
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
                              className="payroll-delete"
                              style={{
                                opacity:
                                  deletingId ===
                                  record.id
                                    ? 0.65
                                    : 1,
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
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="payroll-pagination">
                <span className="payroll-pagination-info">
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <div className="payroll-pagination-actions">
                  <button
                    type="button"
                    disabled={
                      isLoading ||
                      currentPage <= 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                    className="payroll-page-button"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      isLoading ||
                      currentPage >=
                        totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current + 1,
                          ),
                      )
                    }
                    className="payroll-page-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default PayrollPage