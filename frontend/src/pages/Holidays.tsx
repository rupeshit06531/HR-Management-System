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
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "13px",
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

function Holidays() {
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
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm(emptyForm)
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
    <main style={pageStyle}>
      <style>
        {`
          .holidays-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 12px;
          }

          .holidays-kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }

          .holidays-kpi {
            padding: 12px 14px;
          }

          .holidays-kpi-label {
            font-size: 10px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .holidays-kpi-value {
            margin-top: 3px;
            font-size: 22px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .holidays-form-card {
            padding: 14px;
            margin-bottom: 12px;
          }

          .holidays-form-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .holidays-form {
            display: grid;
            gap: 10px;
          }

          .holidays-form-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .holidays-field {
            min-width: 0;
          }

          .holidays-textarea {
            min-height: 76px;
            resize: vertical;
          }

          .holidays-checkbox {
            display: flex;
            align-items: center;
            gap: 7px;
            min-height: 32px;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            cursor: pointer;
          }

          .holidays-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
          }

          .holidays-list-card {
            overflow: hidden;
          }

          .holidays-list-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .holidays-filters {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 170px 150px;
            gap: 8px;
            width: min(680px, 100%);
          }

          .holidays-table-wrap {
            overflow-x: auto;
          }

          .holidays-table {
            width: 100%;
            min-width: 920px;
            border-collapse: collapse;
            font-size: 12px;
          }

          .holidays-table th {
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

          .holidays-table td {
            padding: 9px;
            border-bottom: 1px solid #eef0f3;
            color: #374151;
            vertical-align: middle;
          }

          .holidays-table tbody tr:last-child td {
            border-bottom: none;
          }

          .holidays-table tbody tr:hover {
            background: #fafafa;
          }

          .holiday-name {
            max-width: 190px;
            overflow: hidden;
            color: #111827;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .holiday-description {
            max-width: 260px;
            overflow: hidden;
            color: #6b7280;
            font-size: 11px;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .holiday-date {
            color: #374151;
            font-weight: 700;
            white-space: nowrap;
          }

          .holiday-type,
          .holiday-status {
            display: inline-flex;
            align-items: center;
            min-height: 21px;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }

          .holiday-type {
            background: #f3f4f6;
            color: #374151;
          }

          .holiday-status-active {
            background: #dcfce7;
            color: #166534;
          }

          .holiday-status-inactive {
            background: #f3f4f6;
            color: #6b7280;
          }

          .holiday-actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .holiday-edit {
            min-height: 28px;
            padding: 5px 9px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            background: #ffffff;
            color: #374151;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .holiday-delete {
            min-height: 28px;
            padding: 5px 9px;
            border: 1px solid #dc2626;
            border-radius: 5px;
            background: #dc2626;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .holidays-empty,
          .holidays-loading {
            padding: 28px 14px;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }

          .holidays-alert {
            margin-bottom: 10px;
            padding: 9px 11px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .holidays-alert-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .holidays-alert-success {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          @media (max-width: 900px) {
            .holidays-form-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .holidays-list-header {
              align-items: stretch;
              flex-direction: column;
            }

            .holidays-filters {
              width: 100%;
            }
          }

          @media (max-width: 700px) {
            .holidays-kpis {
              grid-template-columns: 1fr;
            }

            .holidays-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .holidays-form-grid,
            .holidays-filters {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section style={containerStyle}>
        <header className="holidays-header">
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
                Holidays
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
              Holidays
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Manage the organization's holiday calendar.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={primaryButtonStyle}
          >
            + Add Holiday
          </button>
        </header>

        {error && (
          <section
            role="alert"
            className="holidays-alert holidays-alert-error"
          >
            {error}
          </section>
        )}

        {success && (
          <section
            role="status"
            className="holidays-alert holidays-alert-success"
          >
            {success}
          </section>
        )}

        <section className="holidays-kpis">
          <div
            className="holidays-kpi"
            style={cardStyle}
          >
            <div className="holidays-kpi-label">
              Total Holidays
            </div>

            <div className="holidays-kpi-value">
              {holidays.length}
            </div>
          </div>

          <div
            className="holidays-kpi"
            style={cardStyle}
          >
            <div className="holidays-kpi-label">
              Active Holidays
            </div>

            <div className="holidays-kpi-value">
              {activeCount}
            </div>
          </div>

          <div
            className="holidays-kpi"
            style={cardStyle}
          >
            <div className="holidays-kpi-label">
              Inactive Holidays
            </div>

            <div className="holidays-kpi-value">
              {inactiveCount}
            </div>
          </div>
        </section>

        {showForm && (
          <section
            className="holidays-form-card"
            style={cardStyle}
          >
            <div className="holidays-form-header">
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
                    ? "Edit Holiday"
                    : "Add Holiday"}
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Enter the holiday details below.
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
              className="holidays-form"
            >
              <div className="holidays-form-grid">
                <div className="holidays-field">
                  <label
                    htmlFor="holiday-name"
                    style={labelStyle}
                  >
                    Holiday Name
                  </label>

                  <input
                    id="holiday-name"
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
                </div>

                <div className="holidays-field">
                  <label
                    htmlFor="holiday-date"
                    style={labelStyle}
                  >
                    Date
                  </label>

                  <input
                    id="holiday-date"
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
                </div>

                <div className="holidays-field">
                  <label
                    htmlFor="holiday-type"
                    style={labelStyle}
                  >
                    Holiday Type
                  </label>

                  <select
                    id="holiday-type"
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
                </div>
              </div>

              <div className="holidays-field">
                <label
                  htmlFor="holiday-description"
                  style={labelStyle}
                >
                  Description
                </label>

                <textarea
                  id="holiday-description"
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
                  rows={3}
                  placeholder="Optional holiday description"
                  className="holidays-textarea"
                  style={inputStyle}
                />
              </div>

              <label className="holidays-checkbox">
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

              <div className="holidays-form-actions">
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
                  disabled={isSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isSubmitting
                      ? 0.65
                      : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Holiday"
                      : "Save Holiday"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          className="holidays-list-card"
          style={cardStyle}
        >
          <div className="holidays-list-header">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Holiday Calendar
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                {filteredHolidays.length} of{" "}
                {holidays.length} holidays
              </p>
            </div>

            <div className="holidays-filters">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search holidays..."
                aria-label="Search holidays"
                style={inputStyle}
              />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value,
                  )
                }
                aria-label="Filter holiday type"
                style={inputStyle}
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
                aria-label="Filter holiday status"
                style={inputStyle}
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
            <div className="holidays-loading">
              Loading holidays...
            </div>
          ) : filteredHolidays.length ===
            0 ? (
            <div className="holidays-empty">
              No holidays found.
            </div>
          ) : (
            <div className="holidays-table-wrap">
              <table className="holidays-table">
                <thead>
                  <tr>
                    {[
                      "Name",
                      "Date",
                      "Type",
                      "Description",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading}>
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
                        <td>
                          <div
                            className="holiday-name"
                            title={
                              holiday.name
                            }
                          >
                            {holiday.name}
                          </div>
                        </td>

                        <td>
                          <span className="holiday-date">
                            {formatDate(
                              holiday.date,
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="holiday-type">
                            {formatHolidayType(
                              holiday.holiday_type,
                            )}
                          </span>
                        </td>

                        <td>
                          <div
                            className="holiday-description"
                            title={
                              holiday.description ||
                              "-"
                            }
                          >
                            {holiday.description ||
                              "-"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`holiday-status ${
                              holiday.is_active
                                ? "holiday-status-active"
                                : "holiday-status-inactive"
                            }`}
                          >
                            {holiday.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="holiday-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  holiday,
                                )
                              }
                              className="holiday-edit"
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
                              className="holiday-delete"
                              style={{
                                opacity:
                                  deletingId ===
                                  holiday.id
                                    ? 0.65
                                    : 1,
                                cursor:
                                  deletingId ===
                                  holiday.id
                                    ? "not-allowed"
                                    : "pointer",
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