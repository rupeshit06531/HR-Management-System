import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  type AnnouncementListResponse,
  type AnnouncementRecord,
  type CreateAnnouncementRequest,
} from "../api/announcements"

import { useTheme } from "../context/ThemeContext"

const targetAudiences = [
  {
    value: "ALL",
    label: "All Employees",
  },
  {
    value: "MANAGERS",
    label: "Managers",
  },
  {
    value: "DEPARTMENT",
    label: "Specific Department",
  },
]

const emptyForm = {
  title: "",
  message: "",
  target_audience: "ALL",
  department: "",
  publish_date: "",
  expiry_date: "",
  is_active: true,
}

function Announcements() {
  const { isDarkMode } = useTheme()

  const [announcements, setAnnouncements] =
    useState<AnnouncementRecord[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const [form, setForm] =
    useState(emptyForm)

  const theme = {
    pageBackground: isDarkMode
      ? "#0f172a"
      : "#f5f7fa",

    cardBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

    inputBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

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
      ? "#263244"
      : "#f3f4f6",

    tableHeader: isDarkMode
      ? "#1f2937"
      : "#f8fafc",

    secondaryButton: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    primary: "#2563eb",

    primaryDisabled: isDarkMode
      ? "#60a5fa"
      : "#93c5fd",

    errorBackground: isDarkMode
      ? "#450a0a"
      : "#fee2e2",

    errorBorder: isDarkMode
      ? "#7f1d1d"
      : "#fecaca",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground: isDarkMode
      ? "#052e16"
      : "#dcfce7",

    successBorder: isDarkMode
      ? "#166534"
      : "#bbf7d0",

    successText: isDarkMode
      ? "#86efac"
      : "#166534",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "10px",
    boxSizing: "border-box",
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "6px",
    backgroundColor: theme.inputBackground,
    color: theme.text,
  }

  const loadAnnouncements =
    async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response =
          await getAnnouncements()

        if (Array.isArray(response)) {
          setAnnouncements(response)
        } else {
          const paginated =
            response as AnnouncementListResponse

          setAnnouncements(
            paginated.results ?? [],
          )
        }
      } catch {
        setError(
          "Unable to load announcements.",
        )
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    void loadAnnouncements()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.title.trim()) {
      setError(
        "Announcement title is required.",
      )
      return
    }

    if (!form.message.trim()) {
      setError(
        "Announcement message is required.",
      )
      return
    }

    if (!form.publish_date) {
      setError(
        "Publish date is required.",
      )
      return
    }

    if (
      form.target_audience ===
        "DEPARTMENT" &&
      !form.department
    ) {
      setError(
        "Department is required for department announcements.",
      )
      return
    }

    if (
      form.expiry_date &&
      form.expiry_date <=
        form.publish_date
    ) {
      setError(
        "Expiry date must be after publish date.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreateAnnouncementRequest =
        {
          title: form.title.trim(),
          message: form.message.trim(),
          target_audience:
            form.target_audience,
          department:
            form.target_audience ===
              "DEPARTMENT" &&
            form.department
              ? Number(form.department)
              : null,
          publish_date:
            new Date(
              form.publish_date,
            ).toISOString(),
          expiry_date:
            form.expiry_date
              ? new Date(
                  form.expiry_date,
                ).toISOString()
              : null,
          is_active: form.is_active,
        }

      const created =
        await createAnnouncement(
          payload,
        )

      setAnnouncements(
        (current) => [
          created,
          ...current,
        ],
      )

      setSuccess(
        "Announcement created successfully.",
      )

      resetForm()
    } catch {
      setError(
        "Unable to create announcement.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (
    id: number,
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this announcement?",
      )
    ) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deleteAnnouncement(id)

      setAnnouncements(
        (current) =>
          current.filter(
            (announcement) =>
              announcement.id !== id,
          ),
      )

      setSuccess(
        "Announcement deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete announcement.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatAudience = (
    value: string,
  ) => {
    if (value === "ALL") {
      return "All Employees"
    }

    if (value === "MANAGERS") {
      return "Managers"
    }

    if (value === "DEPARTMENT") {
      return "Specific Department"
    }

    return value
  }

  const formatDate = (
    value: string,
  ) => {
    return new Date(
      value,
    ).toLocaleString()
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor:
          theme.pageBackground,
        color: theme.text,
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
        transition:
          "background-color 0.2s ease, color 0.2s ease",
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
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              Announcements
            </h1>

            <p
              style={{
                color: theme.mutedText,
              }}
            >
              Create and manage company announcements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor:
                theme.primary,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            New Announcement
          </button>
        </header>

        {error && (
          <section
            style={{
              padding: "14px",
              marginBottom: "20px",
              backgroundColor:
                theme.errorBackground,
              border: `1px solid ${theme.errorBorder}`,
              borderRadius: "8px",
              color: theme.errorText,
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            style={{
              padding: "14px",
              marginBottom: "20px",
              backgroundColor:
                theme.successBackground,
              border: `1px solid ${theme.successBorder}`,
              borderRadius: "8px",
              color: theme.successText,
            }}
          >
            {success}
          </section>
        )}

        {showForm && (
          <section
            style={{
              backgroundColor:
                theme.cardBackground,
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              border: `1px solid ${theme.border}`,
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2
              style={{
                color: theme.text,
                marginTop: 0,
              }}
            >
              Create Announcement
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "16px",
                maxWidth: "700px",
              }}
            >
              <label
                style={{
                  color: theme.secondaryText,
                }}
              >
                Title

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target
                            .value,
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
                }}
              >
                Message

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        message:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={5}
                  required
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  color: theme.secondaryText,
                }}
              >
                Target Audience

                <select
                  value={
                    form.target_audience
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        target_audience:
                          event.target
                            .value,
                        department:
                          "",
                      }),
                    )
                  }
                  style={inputStyle}
                >
                  {targetAudiences.map(
                    (audience) => (
                      <option
                        key={
                          audience.value
                        }
                        value={
                          audience.value
                        }
                      >
                        {audience.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {form.target_audience ===
                "DEPARTMENT" && (
                <label
                  style={{
                    color:
                      theme.secondaryText,
                  }}
                >
                  Department ID

                  <input
                    type="number"
                    min="1"
                    value={
                      form.department
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          department:
                            event.target
                              .value,
                        }),
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>
              )}

              <label
                style={{
                  color: theme.secondaryText,
                }}
              >
                Publish Date & Time

                <input
                  type="datetime-local"
                  value={
                    form.publish_date
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        publish_date:
                          event.target
                            .value,
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
                }}
              >
                Expiry Date & Time

                <input
                  type="datetime-local"
                  value={
                    form.expiry_date
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        expiry_date:
                          event.target
                            .value,
                      }),
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  color:
                    theme.secondaryText,
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
                          event.target
                            .checked,
                      }),
                    )
                  }
                />

                Active
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
                        ? theme.primaryDisabled
                        : theme.primary,
                    color:
                      "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Creating..."
                    : "Create Announcement"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      `1px solid ${theme.inputBorder}`,
                    borderRadius:
                      "6px",
                    backgroundColor:
                      theme.secondaryButton,
                    color:
                      theme.secondaryText,
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
              theme.cardBackground,
            border: `1px solid ${theme.border}`,
            borderRadius: "10px",
            overflow: "auto",
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
            <h2
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              Announcement List
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
                color: theme.secondaryText,
              }}
            >
              Loading announcements...
            </p>
          ) : announcements.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: theme.mutedText,
              }}
            >
              No announcements found.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "1000px",
                color: theme.text,
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
                    "Title",
                    "Audience",
                    "Department",
                    "Publish Date",
                    "Expiry Date",
                    "Status",
                    "Created By",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding:
                          "14px",
                        textAlign:
                          "left",
                        borderBottom:
                          `1px solid ${theme.border}`,
                        color:
                          theme.secondaryText,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {announcements.map(
                  (announcement) => (
                    <tr
                      key={
                        announcement.id
                      }
                    >
                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              theme.text,
                          }}
                        >
                          {
                            announcement.title
                          }
                        </strong>

                        <div
                          style={{
                            marginTop:
                              "6px",
                            color:
                              theme.mutedText,
                            maxWidth:
                              "280px",
                            lineHeight:
                              1.5,
                          }}
                        >
                          {
                            announcement.message
                          }
                        </div>
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {formatAudience(
                          announcement.target_audience,
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {
                          announcement.department_name ??
                          "-"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {formatDate(
                          announcement.publish_date,
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {announcement.expiry_date
                          ? formatDate(
                              announcement.expiry_date,
                            )
                          : "-"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {announcement.is_published
                          ? "Published"
                          : announcement.is_active
                            ? "Scheduled"
                            : "Inactive"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color:
                            theme.secondaryText,
                          verticalAlign:
                            "top",
                        }}
                      >
                        {
                          announcement.created_by_name ??
                          "-"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          verticalAlign:
                            "top",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            announcement.id
                          }
                          onClick={() =>
                            void handleDelete(
                              announcement.id,
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
                              announcement.id
                                ? isDarkMode
                                  ? "#7f1d1d"
                                  : "#f87171"
                                : "#dc2626",
                            color:
                              "#ffffff",
                            cursor:
                              deletingId ===
                              announcement.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {deletingId ===
                          announcement.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
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

export default Announcements