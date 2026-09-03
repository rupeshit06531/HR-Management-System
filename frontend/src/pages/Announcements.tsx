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

  const totalAnnouncements =
    announcements.length

  const publishedAnnouncements =
    announcements.filter(
      (announcement) =>
        announcement.is_published,
    ).length

  const activeAnnouncements =
    announcements.filter(
      (announcement) =>
        announcement.is_active,
    ).length

  return (
    <main style={pageStyle}>
      <style>
        {`
          .announcement-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 12px;
          }

          .announcement-kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }

          .announcement-kpi {
            padding: 12px 14px;
          }

          .announcement-kpi-label {
            font-size: 10px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .announcement-kpi-value {
            margin-top: 3px;
            font-size: 22px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .announcement-form-card {
            padding: 14px;
            margin-bottom: 12px;
          }

          .announcement-form-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .announcement-form {
            display: grid;
            gap: 10px;
          }

          .announcement-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .announcement-field {
            min-width: 0;
          }

          .announcement-textarea {
            min-height: 86px;
            resize: vertical;
          }

          .announcement-checkbox {
            display: flex;
            align-items: center;
            gap: 7px;
            min-height: 32px;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
          }

          .announcement-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
          }

          .announcement-list-card {
            overflow: hidden;
          }

          .announcement-list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .announcement-table-wrap {
            overflow-x: auto;
          }

          .announcement-table {
            width: 100%;
            min-width: 1080px;
            border-collapse: collapse;
            font-size: 12px;
          }

          .announcement-table th {
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

          .announcement-table td {
            padding: 9px;
            border-bottom: 1px solid #eef0f3;
            color: #374151;
            vertical-align: middle;
          }

          .announcement-table tbody tr:last-child td {
            border-bottom: none;
          }

          .announcement-table tbody tr:hover {
            background: #fafafa;
          }

          .announcement-title {
            max-width: 190px;
            overflow: hidden;
            color: #111827;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .announcement-message {
            max-width: 230px;
            margin-top: 3px;
            overflow: hidden;
            color: #6b7280;
            font-size: 11px;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .announcement-status {
            display: inline-flex;
            align-items: center;
            min-height: 21px;
            padding: 3px 8px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #374151;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .announcement-audience {
            font-weight: 700;
            color: #374151;
          }

          .announcement-delete {
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

          .announcement-empty,
          .announcement-loading {
            padding: 28px 14px;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }

          .announcement-alert {
            margin-bottom: 10px;
            padding: 9px 11px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .announcement-alert-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .announcement-alert-success {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          @media (max-width: 800px) {
            .announcement-form-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .announcement-kpis {
              grid-template-columns: 1fr;
            }

            .announcement-header {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section style={containerStyle}>
        <header className="announcement-header">
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
                Announcements
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
              Announcements
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
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
            style={primaryButtonStyle}
          >
            + New Announcement
          </button>
        </header>

        {error && (
          <div className="announcement-alert announcement-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="announcement-alert announcement-alert-success">
            {success}
          </div>
        )}

        <section className="announcement-kpis">
          <div
            className="announcement-kpi"
            style={cardStyle}
          >
            <div className="announcement-kpi-label">
              Total Announcements
            </div>

            <div className="announcement-kpi-value">
              {totalAnnouncements}
            </div>
          </div>

          <div
            className="announcement-kpi"
            style={cardStyle}
          >
            <div className="announcement-kpi-label">
              Published
            </div>

            <div className="announcement-kpi-value">
              {publishedAnnouncements}
            </div>
          </div>

          <div
            className="announcement-kpi"
            style={cardStyle}
          >
            <div className="announcement-kpi-label">
              Active
            </div>

            <div className="announcement-kpi-value">
              {activeAnnouncements}
            </div>
          </div>
        </section>

        {showForm && (
          <section
            className="announcement-form-card"
            style={cardStyle}
          >
            <div className="announcement-form-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Create Announcement
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Publish an announcement to employees or a target group.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="announcement-form"
            >
              <div className="announcement-field">
                <label
                  htmlFor="announcement-title"
                  style={labelStyle}
                >
                  Title
                </label>

                <input
                  id="announcement-title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title:
                        event.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </div>

              <div className="announcement-field">
                <label
                  htmlFor="announcement-message"
                  style={labelStyle}
                >
                  Message
                </label>

                <textarea
                  id="announcement-message"
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message:
                        event.target.value,
                    }))
                  }
                  rows={4}
                  required
                  className="announcement-textarea"
                  style={inputStyle}
                />
              </div>

              <div className="announcement-form-grid">
                <div className="announcement-field">
                  <label
                    htmlFor="announcement-audience"
                    style={labelStyle}
                  >
                    Target Audience
                  </label>

                  <select
                    id="announcement-audience"
                    value={
                      form.target_audience
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target_audience:
                          event.target.value,
                        department: "",
                      }))
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
                </div>

                {form.target_audience ===
                  "DEPARTMENT" && (
                  <div className="announcement-field">
                    <label
                      htmlFor="announcement-department"
                      style={labelStyle}
                    >
                      Department ID
                    </label>

                    <input
                      id="announcement-department"
                      type="number"
                      min="1"
                      value={
                        form.department
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          department:
                            event.target.value,
                        }))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div className="announcement-form-grid">
                <div className="announcement-field">
                  <label
                    htmlFor="announcement-publish-date"
                    style={labelStyle}
                  >
                    Publish Date & Time
                  </label>

                  <input
                    id="announcement-publish-date"
                    type="datetime-local"
                    value={
                      form.publish_date
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        publish_date:
                          event.target.value,
                      }))
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div className="announcement-field">
                  <label
                    htmlFor="announcement-expiry-date"
                    style={labelStyle}
                  >
                    Expiry Date & Time
                  </label>

                  <input
                    id="announcement-expiry-date"
                    type="datetime-local"
                    value={
                      form.expiry_date
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expiry_date:
                          event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <label className="announcement-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active:
                        event.target.checked,
                    }))
                  }
                />

                Active
              </label>

              <div className="announcement-form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      isSubmitting ? 0.65 : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Creating..."
                    : "Create Announcement"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          className="announcement-list-card"
          style={cardStyle}
        >
          <div className="announcement-list-header">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Announcement List
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                Review published, scheduled and inactive announcements.
              </p>
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#6b7280",
              }}
            >
              {announcements.length} records
            </span>
          </div>

          {isLoading ? (
            <div className="announcement-loading">
              Loading announcements...
            </div>
          ) : announcements.length ===
            0 ? (
            <div className="announcement-empty">
              No announcements found.
            </div>
          ) : (
            <div className="announcement-table-wrap">
              <table className="announcement-table">
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
                      <th key={heading}>
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
                        <td>
                          <div
                            className="announcement-title"
                            title={
                              announcement.title
                            }
                          >
                            {
                              announcement.title
                            }
                          </div>

                          <div
                            className="announcement-message"
                            title={
                              announcement.message
                            }
                          >
                            {
                              announcement.message
                            }
                          </div>
                        </td>

                        <td>
                          <span className="announcement-audience">
                            {formatAudience(
                              announcement.target_audience,
                            )}
                          </span>
                        </td>

                        <td>
                          {
                            announcement.department_name ??
                            "-"
                          }
                        </td>

                        <td>
                          {formatDate(
                            announcement.publish_date,
                          )}
                        </td>

                        <td>
                          {announcement.expiry_date
                            ? formatDate(
                                announcement.expiry_date,
                              )
                            : "-"}
                        </td>

                        <td>
                          <span className="announcement-status">
                            {announcement.is_published
                              ? "Published"
                              : announcement.is_active
                                ? "Scheduled"
                                : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {
                            announcement.created_by_name ??
                            "-"
                          }
                        </td>

                        <td>
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
                            className="announcement-delete"
                            style={{
                              opacity:
                                deletingId ===
                                announcement.id
                                  ? 0.65
                                  : 1,
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
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default Announcements