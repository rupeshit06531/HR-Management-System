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

import { useTheme } from "../context/ThemeContext"

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
  const { isDarkMode } = useTheme()

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

  const theme = {
    pageBackground: isDarkMode
      ? "#111827"
      : "#f5f7fa",

    cardBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    inputBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

    disabledBackground: isDarkMode
      ? "#374151"
      : "#f3f4f6",

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

    inputBorder: isDarkMode
      ? "#4b5563"
      : "#d1d5db",

    rowBorder: isDarkMode
      ? "#374151"
      : "#f3f4f6",

    tableHeader: isDarkMode
      ? "#111827"
      : "#f9fafb",

    primary: "#2563eb",

    errorBackground: isDarkMode
      ? "#451a1a"
      : "#fef2f2",

    errorBorder: isDarkMode
      ? "#7f1d1d"
      : "#fecaca",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground: isDarkMode
      ? "#14351f"
      : "#f0fdf4",

    successBorder: isDarkMode
      ? "#166534"
      : "#bbf7d0",

    successText: isDarkMode
      ? "#86efac"
      : "#166534",

    paidBackground: isDarkMode
      ? "#14532d"
      : "#dcfce7",

    paidText: isDarkMode
      ? "#bbf7d0"
      : "#166534",

    pendingBackground: isDarkMode
      ? "#78350f"
      : "#fef3c7",

    pendingText: isDarkMode
      ? "#fde68a"
      : "#92400e",

    warningText: isDarkMode
      ? "#fbbf24"
      : "#92400e",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "7px",
    padding: "11px 12px",
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "7px",
    backgroundColor:
      theme.inputBackground,
    color: theme.text,
    boxSizing: "border-box",
    fontSize: "14px",
  }

  const filterStyle: CSSProperties = {
    padding: "10px 12px",
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "7px",
    backgroundColor:
      theme.inputBackground,
    color: theme.text,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
    fontSize: "14px",
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalRecords / pageSize,
      ),
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
    const timeoutId =
      window.setTimeout(() => {
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
  }, [
    currentPage,
    totalPages,
  ])

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

  const openEditForm = (
    record: Payroll,
  ) => {
    setForm({
      employee: record.employee,
      month:
        record.month.slice(0, 7),
      basic_salary:
        record.basic_salary,
      allowances:
        record.allowances,
      deductions:
        record.deductions,
      payment_status:
        record.payment_status,
      paid_at: record.paid_at
        ? record.paid_at.slice(
            0,
            16,
          )
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

    if (
      !form.employee ||
      form.employee <= 0
    ) {
      setError(
        "Please select an employee.",
      )
      return
    }

    if (!form.month) {
      setError(
        "Payroll month is required.",
      )
      return
    }

    if (!form.basic_salary) {
      setError(
        "Basic salary is required.",
      )
      return
    }

    const basicSalary =
      Number(form.basic_salary)

    const allowances =
      Number(
        form.allowances || "0",
      )

    const deductions =
      Number(
        form.deductions || "0",
      )

    if (
      !Number.isFinite(
        basicSalary,
      ) ||
      basicSalary < 0
    ) {
      setError(
        "Basic salary must be a valid non-negative amount.",
      )
      return
    }

    if (
      !Number.isFinite(
        allowances,
      ) ||
      allowances < 0
    ) {
      setError(
        "Allowances must be a valid non-negative amount.",
      )
      return
    }

    if (
      !Number.isFinite(
        deductions,
      ) ||
      deductions < 0
    ) {
      setError(
        "Deductions must be a valid non-negative amount.",
      )
      return
    }

    if (
      form.payment_status ===
        "paid" &&
      !form.paid_at
    ) {
      setError(
        "Paid date and time is required for paid payroll.",
      )
      return
    }

    if (
      form.payment_status ===
        "pending" &&
      form.paid_at
    ) {
      setError(
        "Paid date and time must be empty for pending payroll.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: PayrollPayload =
        {
          employee:
            form.employee,
          month: `${form.month}-01`,
          basic_salary:
            form.basic_salary,
          allowances:
            form.allowances || "0",
          deductions:
            form.deductions || "0",
          payment_status:
            form.payment_status,
          paid_at:
            form.payment_status ===
            "paid"
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

        await loadPayroll(
          currentPage,
        )

        setSuccess(
          "Payroll record updated successfully.",
        )
      } else {
        await createPayroll(
          payload,
        )

        setTotalRecords(
          (current) =>
            current + 1,
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

      const nextTotalRecords =
        Math.max(0, totalRecords - 1)

      const nextTotalPages =
        Math.max(
          1,
          Math.ceil(
            nextTotalRecords / pageSize,
          ),
        )

      const nextPage =
        currentPage > nextTotalPages
          ? nextTotalPages
          : currentPage

      setTotalRecords(
        nextTotalRecords,
      )

      if (
        nextPage !== currentPage
      ) {
        setCurrentPage(nextPage)
      } else {
        await loadPayroll(
          nextPage,
        )
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

  const formatCurrency = (
    value: string,
  ) => {
    const amount =
      Number(value)

    if (
      !Number.isFinite(amount)
    ) {
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

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
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

    const date =
      new Date(
        `${value.slice(
          0,
          7,
        )}-01T00:00:00`,
      )

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
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

  const statistics =
    useMemo(() => {
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
            Number(
              record.net_salary || 0,
            ),
          0,
        )

      const paidNetSalary =
        paidRecords.reduce(
          (total, record) =>
            total +
            Number(
              record.net_salary || 0,
            ),
          0,
        )

      return {
        paid: paidRecords.length,
        pending:
          pendingRecords.length,
        totalNetSalary,
        paidNetSalary,
      }
    }, [records])

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor:
          theme.pageBackground,
        color: theme.text,
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
                color: theme.text,
                fontSize: "30px",
                fontWeight: 700,
              }}
            >
              Payroll
            </h1>

            <p
              style={{
                color:
                  theme.mutedText,
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
            onClick={
              openCreateForm
            }
            style={{
              padding:
                "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                theme.primary,
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
                theme.errorBackground,
              border:
                `1px solid ${theme.errorBorder}`,
              borderRadius: "8px",
              color:
                theme.errorText,
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
                theme.successBackground,
              border:
                `1px solid ${theme.successBorder}`,
              borderRadius: "8px",
              color:
                theme.successText,
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
                theme.cardBackground,
              padding: "20px",
              borderRadius: "10px",
              border:
                `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                color:
                  theme.mutedText,
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Total Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color: theme.text,
              }}
            >
              {totalRecords}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                theme.cardBackground,
              padding: "20px",
              borderRadius: "10px",
              border:
                `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                color:
                  theme.mutedText,
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Paid Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color:
                  theme.paidText,
              }}
            >
              {statistics.paid}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                theme.cardBackground,
              padding: "20px",
              borderRadius: "10px",
              border:
                `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                color:
                  theme.mutedText,
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Pending Records
            </div>

            <strong
              style={{
                fontSize: "27px",
                color:
                  theme.pendingText,
              }}
            >
              {statistics.pending}
            </strong>
          </div>

          <div
            style={{
              backgroundColor:
                theme.cardBackground,
              padding: "20px",
              borderRadius: "10px",
              border:
                `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                color:
                  theme.mutedText,
                fontSize: "13px",
                marginBottom: "7px",
              }}
            >
              Current Page Net Salary
            </div>

            <strong
              style={{
                fontSize: "22px",
                color: theme.text,
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
                theme.cardBackground,
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              border:
                `1px solid ${theme.border}`,
              boxShadow:
                "0 2px 6px rgba(0, 0, 0, 0.12)",
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
                      theme.text,
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
                      theme.mutedText,
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
                    theme.mutedText,
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
                      theme.secondaryText,
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Employee

                  <select
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
                    disabled={
                      isLoadingEmployees ||
                      isSubmitting
                    }
                    style={{
                      ...inputStyle,
                      backgroundColor:
                        isLoadingEmployees
                          ? theme.disabledBackground
                          : theme.inputBackground,
                      cursor:
                        isLoadingEmployees ||
                        isSubmitting
                          ? "not-allowed"
                          : "pointer",
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
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {employee.full_name}{" "}
                          —{" "}
                          {employee.employee_id}
                        </option>
                      ),
                    )}
                  </select>

                  {!isLoadingEmployees &&
                    employees.length ===
                      0 && (
                      <span
                        style={{
                          display:
                            "block",
                          marginTop:
                            "6px",
                          color:
                            theme.warningText,
                          fontSize:
                            "12px",
                          fontWeight:
                            500,
                        }}
                      >
                        No active employees
                        available.
                      </span>
                    )}
                </label>

                <label
                  style={{
                    color:
                      theme.secondaryText,
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
                    style={
                      inputStyle
                    }
                  />
                </label>

                <label
                  style={{
                    color:
                      theme.secondaryText,
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
                    style={
                      inputStyle
                    }
                  />
                </label>

                <label
                  style={{
                    color:
                      theme.secondaryText,
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
                    style={
                      inputStyle
                    }
                  />
                </label>

                <label
                  style={{
                    color:
                      theme.secondaryText,
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
                    style={
                      inputStyle
                    }
                  />
                </label>

                <label
                  style={{
                    color:
                      theme.secondaryText,
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
                    style={
                      inputStyle
                    }
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
                        theme.secondaryText,
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
                      style={
                        inputStyle
                      }
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
                    isSubmitting ||
                    isLoadingEmployees ||
                    employees.length === 0
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border: "none",
                    borderRadius:
                      "7px",
                    backgroundColor:
                      isSubmitting ||
                      isLoadingEmployees ||
                      employees.length === 0
                        ? isDarkMode
                          ? "#374151"
                          : "#93c5fd"
                        : theme.primary,
                    color:
                      isSubmitting ||
                      isLoadingEmployees ||
                      employees.length === 0
                        ? theme.mutedText
                        : "#ffffff",
                    cursor:
                      isSubmitting ||
                      isLoadingEmployees ||
                      employees.length === 0
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
                      `1px solid ${theme.inputBorder}`,
                    borderRadius:
                      "7px",
                    backgroundColor:
                      isDarkMode
                        ? "#374151"
                        : "#ffffff",
                    color:
                      theme.text,
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
              theme.cardBackground,
            borderRadius: "10px",
            border:
              `1px solid ${theme.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding:
                "20px 24px",
              borderBottom:
                `1px solid ${theme.border}`,
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
                      theme.text,
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
                      theme.mutedText,
                    fontSize:
                      "13px",
                  }}
                >
                  Showing{" "}
                  {totalRecords === 0
                    ? 0
                    : (currentPage -
                        1) *
                        pageSize +
                      1}{" "}
                  -{" "}
                  {Math.min(
                    currentPage *
                      pageSize,
                    totalRecords,
                  )}{" "}
                  of{" "}
                  {totalRecords}{" "}
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
                style={
                  filterStyle
                }
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
                style={
                  filterStyle
                }
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
                style={
                  filterStyle
                }
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
                  theme.mutedText,
              }}
            >
              Loading payroll...
            </div>
          ) : records.length ===
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
                  color:
                    theme.mutedText,
                }}
              >
                ₹
              </div>

              <h3
                style={{
                  margin:
                    "0 0 6px",
                  color:
                    theme.text,
                }}
              >
                No payroll records
                found
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    theme.mutedText,
                }}
              >
                Try changing the
                filters or add a
                new payroll record.
              </p>
            </div>
          ) : (
            <>
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
                    color:
                      theme.text,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor:
                          theme.tableHeader,
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
                                theme.secondaryText,
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                              textTransform:
                                "uppercase",
                              borderBottom:
                                `1px solid ${theme.border}`,
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
                                "15px 16px",
                              borderBottom:
                                `1px solid ${theme.rowBorder}`,
                              color:
                                theme.text,
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
                                  theme.mutedText,
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
                                `1px solid ${theme.rowBorder}`,
                              whiteSpace:
                                "nowrap",
                              color:
                                theme.secondaryText,
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
                                `1px solid ${theme.rowBorder}`,
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
                                `1px solid ${theme.rowBorder}`,
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
                                `1px solid ${theme.rowBorder}`,
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
                                `1px solid ${theme.rowBorder}`,
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
                                `1px solid ${theme.rowBorder}`,
                              fontWeight:
                                700,
                              color:
                                theme.text,
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
                                `1px solid ${theme.rowBorder}`,
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
                                    ? theme.paidBackground
                                    : theme.pendingBackground,
                                color:
                                  record.payment_status ===
                                  "paid"
                                    ? theme.paidText
                                    : theme.pendingText,
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
                                `1px solid ${theme.rowBorder}`,
                              whiteSpace:
                                "nowrap",
                              color:
                                theme.secondaryText,
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
                                `1px solid ${theme.rowBorder}`,
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
                                    `1px solid ${theme.primary}`,
                                  borderRadius:
                                    "6px",
                                  backgroundColor:
                                    isDarkMode
                                      ? "#1e3a8a"
                                      : "#ffffff",
                                  color:
                                    isDarkMode
                                      ? "#dbeafe"
                                      : theme.primary,
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
                                      ? isDarkMode
                                        ? "#7f1d1d"
                                        : "#fca5a5"
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

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                  padding:
                    "16px 24px",
                  borderTop:
                    `1px solid ${theme.border}`,
                  flexWrap:
                    "wrap",
                }}
              >
                <span
                  style={{
                    color:
                      theme.mutedText,
                    fontSize:
                      "14px",
                  }}
                >
                  Page{" "}
                  {currentPage}{" "}
                  of{" "}
                  {totalPages}
                </span>

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
                    style={{
                      padding:
                        "8px 14px",
                      border:
                        `1px solid ${theme.inputBorder}`,
                      borderRadius:
                        "7px",
                      backgroundColor:
                        currentPage <=
                        1
                          ? theme.disabledBackground
                          : isDarkMode
                            ? "#374151"
                            : "#ffffff",
                      color:
                        currentPage <=
                        1
                          ? theme.mutedText
                          : theme.text,
                      cursor:
                        currentPage <=
                        1
                          ? "not-allowed"
                          : "pointer",
                      fontWeight:
                        600,
                    }}
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
                            current +
                              1,
                          ),
                      )
                    }
                    style={{
                      padding:
                        "8px 14px",
                      border:
                        `1px solid ${theme.inputBorder}`,
                      borderRadius:
                        "7px",
                      backgroundColor:
                        currentPage >=
                        totalPages
                          ? theme.disabledBackground
                          : isDarkMode
                            ? "#374151"
                            : "#ffffff",
                      color:
                        currentPage >=
                        totalPages
                          ? theme.mutedText
                          : theme.text,
                      cursor:
                        currentPage >=
                        totalPages
                          ? "not-allowed"
                          : "pointer",
                      fontWeight:
                        600,
                    }}
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