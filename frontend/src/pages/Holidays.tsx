import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
  type Holiday,
  type HolidayListResponse,
  type HolidayPayload,
} from "../api/holidays"

import { useTheme } from "../context/ThemeContext"

const holidayTypes = [
  {
    value: "NATIONAL",
    label: "National Holiday",
  },
  {
    value: "FESTIVAL",
    label: "Festival Holiday",
  },
  {
    value: "COMPANY",
    label: "Company Holiday",
  },
  {
    value: "OPTIONAL",
    label: "Optional Holiday",
  },
]

const emptyForm: HolidayPayload = {
  name: "",
  date: "",
  holiday_type: "COMPANY",
  description: "",
  is_active: true,
}

function Holidays() {
  const { isDarkMode } = useTheme()

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<HolidayPayload>(emptyForm)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const theme = {
    pageBackground: isDarkMode ? "#111827" : "#f5f7fa",
    cardBackground: isDarkMode ? "#1f2937" : "#ffffff",
    inputBackground: isDarkMode ? "#111827" : "#ffffff",
    text: isDarkMode ? "#f9fafb" : "#111827",
    secondaryText: isDarkMode ? "#d1d5db" : "#374151",
    mutedText: isDarkMode ? "#9ca3af" : "#6b7280",
    border: isDarkMode ? "#374151" : "#e5e7eb",
    rowBorder: isDarkMode ? "#374151" : "#f3f4f6",
    tableHeader: isDarkMode ? "#111827" : "#f9fafb",
    errorBackground: isDarkMode ? "#451a1a" : "#fef2f2",
    errorBorder: isDarkMode ? "#7f1d1d" : "#fecaca",
    errorText: isDarkMode ? "#fca5a5" : "#991b1b",
    successBackground: isDarkMode ? "#14532d" : "#f0fdf4",
    successBorder: isDarkMode ? "#166534" : "#bbf7d0",
    successText: isDarkMode ? "#bbf7d0" : "#166534",
    secondaryButtonBackground: isDarkMode
      ? "#374151"
      : "#ffffff",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "7px",
    padding: "11px 12px",
    border: `1px solid ${theme.border}`,
    borderRadius: "7px",
    boxSizing: "border-box",
    backgroundColor: theme.inputBackground,
    color: theme.text,
    outline: "none",
  }

  const filterStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${theme.border}`,
    borderRadius: "7px",
    backgroundColor: theme.inputBackground,
    color: theme.text,
    boxSizing: "border-box",
  }

  const loadHolidays = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getHolidays()

      if (Array.isArray(response)) {
        setHolidays(response)
      } else {
        const paginated = response as HolidayListResponse
        setHolidays(paginated.results ?? [])
      }
    } catch {
      setError("Unable to load holidays.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadHolidays()
  }, [])

  const resetForm = () => {
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const openEditForm = (holiday: Holiday) => {
    setForm({
      name: holiday.name,
      date: holiday.date,
      holiday_type: holiday.holiday_type,
      description: holiday.description ?? "",
      is_active: holiday.is_active,
    })

    setEditingId(holiday.id)
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

    if (!form.name.trim()) {
      setError("Holiday name is required.")
      return
    }

    if (!form.date) {
      setError("Holiday date is required.")
      return
    }

    try {
      setIsSubmitting(true)

      const payload: HolidayPayload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      }

      if (editingId !== null) {
        const updated = await updateHoliday(
          editingId,
          payload,
        )

        setHolidays((current) =>
          current.map((holiday) =>
            holiday.id === editingId
              ? updated
              : holiday,
          ),
        )

        setSuccess(
          "Holiday updated successfully.",
        )
      } else {
        const created = await createHoliday(payload)

        setHolidays((current) => [
          created,
          ...current,
        ])

        setSuccess(
          "Holiday created successfully.",
        )
      }

      resetForm()
    } catch {
      setError(
        editingId !== null
          ? "Unable to update holiday."
          : "Unable to create holiday.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this holiday?",
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deleteHoliday(id)

      setHolidays((current) =>
        current.filter(
          (holiday) => holiday.id !== id,
        ),
      )

      setSuccess(
        "Holiday deleted successfully.",
      )
    } catch {
      setError("Unable to delete holiday.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatHolidayType = (value: string) => {
    const type = holidayTypes.find(
      (item) => item.value === value,
    )

    return (
      type?.label ??
      value.replace("_", " ")
    )
  }

  const formatDate = (date: string) => {
    if (!date) {
      return "-"
    }

    const parsedDate = new Date(
      `${date}T00:00:00`,
    )

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    )
  }

  const filteredHolidays = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return holidays.filter((holiday) => {
      const matchesSearch =
        !normalizedSearch ||
        holiday.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (holiday.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesType =
        typeFilter === "ALL" ||
        holiday.holiday_type === typeFilter

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE"
          ? holiday.is_active
          : !holiday.is_active)

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      )
    })
  }, [
    holidays,
    searchTerm,
    typeFilter,
    statusFilter,
  ])

  const activeCount = holidays.filter(
    (holiday) => holiday.is_active,
  ).length

  const inactiveCount =
    holidays.length - activeCount

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
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
              Holidays
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: theme.mutedText,
                fontSize: "15px",
              }}
            >
              Manage and maintain the
              organization's holiday calendar.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow:
                "0 2px 5px rgba(37, 99, 235, 0.25)",
            }}
          >
            + Add Holiday
          </button>
        </header>

        {error && (
          <section
            role="alert"
            style={{
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                theme.errorBackground,
              border:
                `1px solid ${theme.errorBorder}`,
              borderRadius: "8px",
              color: theme.errorText,
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            style={{
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                theme.successBackground,
              border:
                `1px solid ${theme.successBorder}`,
              borderRadius: "8px",
              color: theme.successText,
            }}
          >
            {success}
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total Holidays",
              value: holidays.length,
              valueColor: theme.text,
            },
            {
              label: "Active Holidays",
              value: activeCount,
              valueColor: isDarkMode
                ? "#86efac"
                : "#166534",
            },
            {
              label: "Inactive Holidays",
              value: inactiveCount,
              valueColor: theme.mutedText,
            },
          ].map((card) => (
            <div
              key={card.label}
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
                  color: theme.mutedText,
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                {card.label}
              </div>

              <strong
                style={{
                  fontSize: "28px",
                  color: card.valueColor,
                }}
              >
                {card.value}
              </strong>
            </div>
          ))}
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
                isDarkMode
                  ? "0 2px 6px rgba(0, 0, 0, 0.3)"
                  : "0 2px 6px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                gap: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: theme.text,
                    fontSize: "20px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Holiday"
                    : "Add Holiday"}
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: theme.mutedText,
                    fontSize: "14px",
                  }}
                >
                  Enter the holiday details
                  below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  border: "none",
                  backgroundColor:
                    "transparent",
                  color: theme.mutedText,
                  cursor: isSubmitting
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "20px",
                }}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "18px",
              }}
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
                    color: theme.secondaryText,
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Holiday Name

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name:
                            event.target.value,
                        }),
                      )
                    }
                    required
                    placeholder="e.g. Independence Day"
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    color: theme.secondaryText,
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Date

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          date:
                            event.target.value,
                        }),
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    color: theme.secondaryText,
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Holiday Type

                  <select
                    value={
                      form.holiday_type
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          holiday_type:
                            event.target.value,
                        }),
                      )
                    }
                    style={inputStyle}
                  >
                    {holidayTypes.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <label
                style={{
                  color: theme.secondaryText,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Description

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  rows={4}
                  placeholder="Optional holiday description"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: theme.secondaryText,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target.checked,
                      }),
                    )
                  }
                />
                Active Holiday
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
                  disabled={isSubmitting}
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
                    color: "#ffffff",
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
                      ? "Update Holiday"
                      : "Save Holiday"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      `1px solid ${theme.border}`,
                    borderRadius:
                      "7px",
                    backgroundColor:
                      theme.secondaryButtonBackground,
                    color:
                      theme.text,
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
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
              padding: "20px 24px",
              borderBottom:
                `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: theme.text,
                    fontSize: "19px",
                  }}
                >
                  Holiday Calendar
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: theme.mutedText,
                    fontSize: "13px",
                  }}
                >
                  {filteredHolidays.length}{" "}
                  of {holidays.length} holidays
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 1fr) 180px 180px",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search holidays..."
                style={filterStyle}
              />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value,
                  )
                }
                style={filterStyle}
              >
                <option value="ALL">
                  All Types
                </option>

                {holidayTypes.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                style={filterStyle}
              >
                <option value="ALL">
                  All Status
                </option>
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: theme.mutedText,
              }}
            >
              Loading holidays...
            </div>
          ) : filteredHolidays.length ===
            0 ? (
            <div
              style={{
                padding: "50px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  marginBottom: "10px",
                }}
              >
                📅
              </div>

              <h3
                style={{
                  margin:
                    "0 0 6px",
                  color: theme.text,
                }}
              >
                No holidays found
              </h3>

              <p
                style={{
                  margin: 0,
                  color: theme.mutedText,
                }}
              >
                Try changing your filters
                or add a new holiday.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: "900px",
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
                      "Name",
                      "Date",
                      "Type",
                      "Description",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "13px 16px",
                          textAlign:
                            "left",
                          color:
                            theme.mutedText,
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
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredHolidays.map(
                    (holiday) => (
                      <tr
                        key={holiday.id}
                      >
                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.text,
                            fontWeight:
                              600,
                          }}
                        >
                          {holiday.name}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatDate(
                            holiday.date,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                          }}
                        >
                          {formatHolidayType(
                            holiday.holiday_type,
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 16px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.mutedText,
                            maxWidth:
                              "300px",
                          }}
                        >
                          {holiday.description ||
                            "-"}
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
                                holiday.is_active
                                  ? isDarkMode
                                    ? "#14532d"
                                    : "#dcfce7"
                                  : isDarkMode
                                    ? "#374151"
                                    : "#f3f4f6",
                              color:
                                holiday.is_active
                                  ? isDarkMode
                                    ? "#bbf7d0"
                                    : "#166534"
                                  : theme.mutedText,
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                            }}
                          >
                            {holiday.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
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
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  holiday,
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
                                  theme.secondaryButtonBackground,
                                color:
                                  isDarkMode
                                    ? "#60a5fa"
                                    : "#2563eb",
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
                                holiday.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  holiday.id,
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
                                  holiday.id
                                    ? "#fca5a5"
                                    : "#dc2626",
                                color:
                                  "#ffffff",
                                cursor:
                                  deletingId ===
                                  holiday.id
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight:
                                  600,
                              }}
                            >
                              {deletingId ===
                              holiday.id
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

export default Holidays