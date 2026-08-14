import {
  useEffect,
  useState,
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
            justifyContent:
              "space-between",
            alignItems: "center",
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
              Announcements
            </h1>

            <p
              style={{
                color: "#6b7280",
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
                "#2563eb",
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
              padding: "14px",
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
              <label>
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
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                  }}
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
                <label>
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
              )}

              <label>
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

              <label
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "8px",
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
              Announcement List
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
              }}
            >
              Loading announcements...
            </p>
          ) : announcements.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: "#6b7280",
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
              }}
            >
              <thead>
                <tr>
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
                          "1px solid #e5e7eb",
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
                            "1px solid #f3f4f6",
                        }}
                      >
                        <strong>
                          {
                            announcement.title
                          }
                        </strong>

                        <div
                          style={{
                            marginTop:
                              "6px",
                            color:
                              "#6b7280",
                            maxWidth:
                              "280px",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                              "#dc2626",
                            color:
                              "#ffffff",
                            cursor:
                              "pointer",
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