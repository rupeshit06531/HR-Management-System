import {
  useEffect,
  useState,
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

function Holidays() {
  const [holidays, setHolidays] =
    useState<Holiday[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<HolidayPayload>(emptyForm)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const loadHolidays = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getHolidays()

      if (Array.isArray(response)) {
        setHolidays(response)
      } else {
        const paginated =
          response as HolidayListResponse

        setHolidays(
          paginated.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load holidays.",
      )
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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.name.trim()) {
      setError(
        "Holiday name is required.",
      )
      return
    }

    if (!form.date) {
      setError(
        "Holiday date is required.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: HolidayPayload = {
        ...form,
        name: form.name.trim(),
        description:
          form.description.trim(),
      }

      if (editingId !== null) {
        const updated =
          await updateHoliday(
            editingId,
            payload,
          )

        setHolidays(
          (current) =>
            current.map(
              (holiday) =>
                holiday.id === editingId
                  ? updated
                  : holiday,
            ),
        )

        setSuccess(
          "Holiday updated successfully.",
        )
      } else {
        const created =
          await createHoliday(payload)

        setHolidays(
          (current) => [
            ...current,
            created,
          ],
        )

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

  const handleDelete = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
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

      setHolidays(
        (current) =>
          current.filter(
            (holiday) =>
              holiday.id !== id,
          ),
      )

      setSuccess(
        "Holiday deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete holiday.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatHolidayType = (
    value: string,
  ) => {
    const type =
      holidayTypes.find(
        (item) =>
          item.value === value,
      )

    return (
      type?.label ??
      value.replace(
        "_",
        " ",
      )
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fa",
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
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
              Holidays
            </h1>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Manage company holidays
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setEditingId(null)
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor:
                "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Add Holiday
          </button>
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

        {showForm && (
          <section
            style={{
              backgroundColor:
                "#ffffff",
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2>
              {editingId !== null
                ? "Edit Holiday"
                : "Add Holiday"}
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
                Holiday Name

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                Date

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        date:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
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
                          event.target
                            .value,
                      }),
                    )
                  }
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                  }}
                >
                  {holidayTypes.map(
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
                    marginTop: "6px",
                    padding: "10px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
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
                          event.target
                            .checked,
                      }),
                    )
                  }
                />{" "}
                Active
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
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
                      "#2563eb",
                    color:
                      "#ffffff",
                    cursor:
                      "pointer",
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
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "6px",
                    backgroundColor:
                      "#ffffff",
                    cursor:
                      "pointer",
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
            overflow: "auto",
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
            <h2
              style={{
                margin: 0,
              }}
            >
              Holiday Calendar
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
              }}
            >
              Loading holidays...
            </p>
          ) : holidays.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: "#6b7280",
              }}
            >
              No holidays found.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Name
                  </th>

                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Type
                  </th>

                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Description
                  </th>

                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: "14px",
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {holidays.map(
                  (holiday) => (
                    <tr
                      key={
                        holiday.id
                      }
                    >
                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {holiday.name}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {holiday.date}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {formatHolidayType(
                          holiday.holiday_type,
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {holiday.description ||
                          "-"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {holiday.is_active
                          ? "Active"
                          : "Inactive"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
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
                            onClick={() => {
                              setForm({
                                name:
                                  holiday.name,
                                date:
                                  holiday.date,
                                holiday_type:
                                  holiday.holiday_type,
                                description:
                                  holiday.description,
                                is_active:
                                  holiday.is_active,
                              })

                              setEditingId(
                                holiday.id,
                              )

                              setShowForm(
                                true,
                              )

                              setError(
                                null,
                              )

                              setSuccess(
                                null,
                              )
                            }}
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
                                "#dc2626",
                              color:
                                "#ffffff",
                              cursor:
                                "pointer",
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
          )}
        </section>
      </section>
    </main>
  )
}

export default Holidays