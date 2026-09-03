import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createCandidate,
  deleteCandidate,
  getCandidates,
  updateCandidate,
  type Candidate,
  type CandidateListResponse,
  type CandidatePayload,
} from "../api/recruitment"

const statuses = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
]

const emptyForm: CandidatePayload = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  department: 0,
  resume: null,
  interview_date: null,
  status: "APPLIED",
  interview_notes: "",
  hr_notes: "",
  experience_years: undefined,
  expected_salary: null,
  offer_date: null,
  joining_date: null,
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "16px 18px 24px",
  boxSizing: "border-box",
}

const containerStyle: CSSProperties = {
  maxWidth: "1500px",
  margin: "0 auto",
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
}

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  boxSizing: "border-box",
  fontSize: "13px",
  color: "#111827",
  background: "#ffffff",
  outline: "none",
}

const tableCellStyle: CSSProperties = {
  padding: "9px 11px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStatusStyle(status: string): CSSProperties {
  switch (status) {
    case "APPLIED":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      }
    case "SCREENING":
      return {
        background: "#fef3c7",
        color: "#92400e",
      }
    case "SHORTLISTED":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
      }
    case "INTERVIEW":
      return {
        background: "#e0f2fe",
        color: "#0369a1",
      }
    case "SELECTED":
      return {
        background: "#dcfce7",
        color: "#166534",
      }
    case "REJECTED":
      return {
        background: "#fee2e2",
        color: "#991b1b",
      }
    case "WITHDRAWN":
      return {
        background: "#f3f4f6",
        color: "#4b5563",
      }
    default:
      return {
        background: "#f3f4f6",
        color: "#374151",
      }
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function Recruitment() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CandidatePayload>(emptyForm)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getCandidates()

      if (Array.isArray(response)) {
        setCandidates(response)
      } else {
        const paginated = response as CandidateListResponse
        setCandidates(paginated.results ?? [])
      }
    } catch {
      setError("Unable to load candidates.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCandidates()
  }, [])

  const resetForm = () => {
    setForm({
      ...emptyForm,
      experience_years: undefined,
      expected_salary: null,
      interview_date: null,
      offer_date: null,
      joining_date: null,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setForm({
      ...emptyForm,
      experience_years: undefined,
      expected_salary: null,
      interview_date: null,
      offer_date: null,
      joining_date: null,
    })
    setEditingId(null)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const filteredCandidates = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return candidates.filter((candidate) => {
      if (
        statusFilter !== "ALL" &&
        candidate.status !== statusFilter
      ) {
        return false
      }

      if (!search) {
        return true
      }

      const searchableText = [
        candidate.first_name,
        candidate.last_name,
        candidate.full_name,
        candidate.email,
        candidate.phone,
        candidate.job_title,
        candidate.department_name,
        String(candidate.department),
        candidate.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(search)
    })
  }, [candidates, searchTerm, statusFilter])

  const totalCandidates = candidates.length

  const appliedCandidates = candidates.filter(
    (candidate) => candidate.status === "APPLIED",
  ).length

  const screeningCandidates = candidates.filter(
    (candidate) => candidate.status === "SCREENING",
  ).length

  const shortlistedCandidates = candidates.filter(
    (candidate) => candidate.status === "SHORTLISTED",
  ).length

  const interviewCandidates = candidates.filter(
    (candidate) => candidate.status === "INTERVIEW",
  ).length

  const selectedCandidates = candidates.filter(
    (candidate) => candidate.status === "SELECTED",
  ).length

  const rejectedCandidates = candidates.filter(
    (candidate) => candidate.status === "REJECTED",
  ).length

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.first_name.trim()) {
      setError("First name is required.")
      return
    }

    if (!form.email.trim()) {
      setError("Email is required.")
      return
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.")
      return
    }

    if (!form.job_title.trim()) {
      setError("Job title is required.")
      return
    }

    if (!form.department || form.department <= 0) {
      setError("Department ID is required.")
      return
    }

    if (
      form.experience_years !== undefined &&
      form.experience_years < 0
    ) {
      setError("Experience years cannot be negative.")
      return
    }

    if (
      form.expected_salary !== null &&
      form.expected_salary !== undefined &&
      Number(form.expected_salary) < 0
    ) {
      setError("Expected salary cannot be negative.")
      return
    }

    if (
      form.status === "INTERVIEW" &&
      !form.interview_date
    ) {
      setError(
        "Interview date is required for interview candidates.",
      )
      return
    }

    if (
      form.status !== "INTERVIEW" &&
      form.interview_date
    ) {
      setError(
        "Interview date is only allowed for interview candidates.",
      )
      return
    }

    if (form.status === "SELECTED") {
      if (!form.offer_date) {
        setError(
          "Offer date is required for selected candidates.",
        )
        return
      }

      if (!form.joining_date) {
        setError(
          "Joining date is required for selected candidates.",
        )
        return
      }

      if (
        form.offer_date &&
        form.joining_date &&
        form.joining_date < form.offer_date
      ) {
        setError("Joining date cannot be before offer date.")
        return
      }
    }

    try {
      setIsSubmitting(true)

      const payload: CandidatePayload = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        job_title: form.job_title.trim(),
        interview_notes: form.interview_notes.trim(),
        hr_notes: form.hr_notes.trim(),
        experience_years: form.experience_years,
        expected_salary: form.expected_salary,
        interview_date:
          form.status === "INTERVIEW"
            ? form.interview_date
            : null,
        offer_date:
          form.status === "SELECTED"
            ? form.offer_date
            : null,
        joining_date:
          form.status === "SELECTED"
            ? form.joining_date
            : null,
      }

      if (editingId !== null) {
        const updated = await updateCandidate(
          editingId,
          payload,
        )

        setCandidates((current) =>
          current.map((candidate) =>
            candidate.id === editingId
              ? updated
              : candidate,
          ),
        )

        setSuccess("Candidate updated successfully.")
      } else {
        const created = await createCandidate(payload)

        setCandidates((current) => [
          created,
          ...current,
        ])

        setSuccess("Candidate created successfully.")
      }

      resetForm()
    } catch (requestError: any) {
      const responseData = requestError?.response?.data

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const messages = Object.entries(responseData)
          .map(
            ([field, value]) =>
              `${field}: ${
                Array.isArray(value)
                  ? value.join(", ")
                  : String(value)
              }`,
          )
          .join(" ")

        setError(
          messages ||
            (editingId !== null
              ? "Unable to update candidate."
              : "Unable to create candidate."),
        )
      } else {
        setError(
          editingId !== null
            ? "Unable to update candidate."
            : "Unable to create candidate.",
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this candidate?",
      )
    ) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deleteCandidate(id)

      setCandidates((current) =>
        current.filter(
          (candidate) => candidate.id !== id,
        ),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess("Candidate deleted successfully.")
    } catch {
      setError("Unable to delete candidate.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (candidate: Candidate) => {
    setForm({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      job_title: candidate.job_title,
      department: candidate.department,
      resume: null,
      interview_date: candidate.interview_date,
      status: candidate.status,
      interview_notes: candidate.interview_notes,
      hr_notes: candidate.hr_notes,
      experience_years: candidate.experience_years,
      expected_salary: candidate.expected_salary,
      offer_date: candidate.offer_date,
      joining_date: candidate.joining_date,
    })

    setEditingId(candidate.id)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const stats = [
    {
      label: "Total Candidates",
      value: totalCandidates,
    },
    {
      label: "Interviews",
      value: interviewCandidates,
    },
    {
      label: "Selected",
      value: selectedCandidates,
    },
    {
      label: "Rejected",
      value: rejectedCandidates,
    },
  ]

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                color: "#2563eb",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "2px",
              }}
            >
              HRMS / Recruitment
            </div>

            <h1
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "22px",
                lineHeight: 1.2,
              }}
            >
              Recruitment
            </h1>

            <p
              style={{
                margin: "3px 0 0",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Manage candidates, interviews and hiring pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              minHeight: "34px",
              padding: "7px 13px",
              border: "none",
              borderRadius: "6px",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            + Add Candidate
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "10px",
              padding: "8px 11px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#991b1b",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "10px",
              padding: "8px 11px",
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              color: "#166534",
              fontSize: "12px",
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          {stats.map((stat) => (
            <article
              key={stat.label}
              style={{
                ...cardStyle,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "3px",
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  color: "#111827",
                  fontSize: "21px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
              </div>
            </article>
          ))}
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: "10px",
            padding: "9px 11px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
              gap: "7px",
            }}
          >
            {[
              ["Applied", appliedCandidates],
              ["Screening", screeningCandidates],
              ["Shortlisted", shortlistedCandidates],
              ["Interview", interviewCandidates],
              ["Selected", selectedCandidates],
              ["Rejected", rejectedCandidates],
              [
                "Displayed",
                filteredCandidates.length,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: "7px 8px",
                  borderRadius: "6px",
                  background: "#f8fafc",
                  border: "1px solid #eef2f7",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    color: "#111827",
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {showForm && (
          <section
            style={{
              ...cardStyle,
              padding: "12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "15px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Candidate"
                    : "Add Candidate"}
                </h2>

                <p
                  style={{
                    margin: "2px 0 0",
                    color: "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  Enter candidate information below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "9px",
              }}
            >
              <label style={labelStyle}>
                First Name
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Last Name
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Job Title
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      job_title: event.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Department ID
                <input
                  type="number"
                  min="1"
                  value={form.department || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      department: Number(
                        event.target.value,
                      ),
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Experience (Years)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.experience_years ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      experience_years:
                        event.target.value === ""
                          ? undefined
                          : Number(
                              event.target.value,
                            ),
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Expected Salary
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.expected_salary ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expected_salary:
                        event.target.value === ""
                          ? null
                          : event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Resume
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      resume:
                        event.target.files?.[0] ?? null,
                    }))
                  }
                  style={{
                    ...inputStyle,
                    padding: "5px",
                  }}
                />

                {editingId !== null &&
                  form.resume === null && (
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "10px",
                        fontWeight: 400,
                      }}
                    >
                      Leave empty to keep existing resume.
                    </span>
                  )}
              </label>

              <label style={labelStyle}>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                      interview_date:
                        event.target.value ===
                        "INTERVIEW"
                          ? current.interview_date
                          : null,
                      offer_date:
                        event.target.value ===
                        "SELECTED"
                          ? current.offer_date
                          : null,
                      joining_date:
                        event.target.value ===
                        "SELECTED"
                          ? current.joining_date
                          : null,
                    }))
                  }
                  style={inputStyle}
                >
                  {statuses.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              {form.status === "INTERVIEW" && (
                <label style={labelStyle}>
                  Interview Date
                  <input
                    type="datetime-local"
                    value={
                      form.interview_date
                        ? form.interview_date.slice(0, 16)
                        : ""
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        interview_date:
                          event.target.value || null,
                      }))
                    }
                    required
                    style={inputStyle}
                  />
                </label>
              )}

              {form.status === "SELECTED" && (
                <>
                  <label style={labelStyle}>
                    Offer Date
                    <input
                      type="date"
                      value={form.offer_date ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          offer_date:
                            event.target.value || null,
                        }))
                      }
                      required
                      style={inputStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Joining Date
                    <input
                      type="date"
                      value={form.joining_date ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          joining_date:
                            event.target.value || null,
                        }))
                      }
                      required
                      style={inputStyle}
                    />
                  </label>
                </>
              )}

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Interview Notes
                <textarea
                  value={form.interview_notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      interview_notes:
                        event.target.value,
                    }))
                  }
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "52px",
                  }}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                HR Notes
                <textarea
                  value={form.hr_notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hr_notes: event.target.value,
                    }))
                  }
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "52px",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: "7px",
                  paddingTop: "1px",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    minHeight: "34px",
                    padding: "7px 13px",
                    border: "none",
                    borderRadius: "6px",
                    background:
                      isSubmitting
                        ? "#93c5fd"
                        : "#2563eb",
                    color: "#ffffff",
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Candidate"
                      : "Save Candidate"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    minHeight: "34px",
                    padding: "7px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: "#ffffff",
                    color: "#374151",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={cardStyle}>
          <div
            style={{
              padding: "9px 11px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "14px",
                }}
              >
                Candidate Pipeline
              </h2>

              <p
                style={{
                  margin: "2px 0 0",
                  color: "#9ca3af",
                  fontSize: "10px",
                }}
              >
                {filteredCandidates.length} candidate
                {filteredCandidates.length === 1
                  ? ""
                  : "s"}{" "}
                displayed
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              <input
                type="search"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                style={{
                  width: "220px",
                  ...inputStyle,
                }}
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                style={{
                  width: "145px",
                  ...inputStyle,
                }}
              >
                <option value="ALL">All Statuses</option>

                {statuses.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "35px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Loading candidates...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <strong
                style={{
                  color: "#374151",
                  fontSize: "13px",
                }}
              >
                No candidates found
              </strong>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#9ca3af",
                  fontSize: "11px",
                }}
              >
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1150px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Candidate",
                      "Contact",
                      "Job",
                      "Department",
                      "Experience",
                      "Expected Salary",
                      "Applied",
                      "Interview",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "8px 11px",
                          textAlign: "left",
                          color: "#6b7280",
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom:
                            "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td style={tableCellStyle}>
                        <strong
                          style={{
                            color: "#111827",
                            fontSize: "12px",
                          }}
                        >
                          {candidate.full_name ||
                            `${candidate.first_name} ${candidate.last_name}`.trim()}
                        </strong>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            color: "#374151",
                            fontSize: "11px",
                          }}
                        >
                          {candidate.email}
                        </div>

                        <div
                          style={{
                            marginTop: "2px",
                            color: "#9ca3af",
                            fontSize: "10px",
                          }}
                        >
                          {candidate.phone}
                        </div>
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#374151",
                          fontSize: "11px",
                        }}
                      >
                        {candidate.job_title}
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#374151",
                          fontSize: "11px",
                        }}
                      >
                        {candidate.department_name ||
                          candidate.department}
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#6b7280",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {candidate.experience_years ?? 0} yrs
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#6b7280",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {candidate.expected_salary || "-"}
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#6b7280",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(candidate.application_date)}
                      </td>

                      <td
                        style={{
                          ...tableCellStyle,
                          color: "#6b7280",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(
                          candidate.interview_date,
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 7px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            ...getStatusStyle(
                              candidate.status,
                            ),
                          }}
                        >
                          {formatStatus(candidate.status)}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(candidate)
                            }
                            style={{
                              minHeight: "28px",
                              padding: "4px 8px",
                              border:
                                "1px solid #2563eb",
                              borderRadius: "5px",
                              background: "#ffffff",
                              color: "#2563eb",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === candidate.id
                            }
                            onClick={() =>
                              void handleDelete(
                                candidate.id,
                              )
                            }
                            style={{
                              minHeight: "28px",
                              padding: "4px 8px",
                              border: "none",
                              borderRadius: "5px",
                              background:
                                deletingId === candidate.id
                                  ? "#9ca3af"
                                  : "#dc2626",
                              color: "#ffffff",
                              cursor:
                                deletingId === candidate.id
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {deletingId === candidate.id
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
          )}
        </section>

        <style>
          {`
            @media (max-width: 1000px) {
              main section > div {
                max-width: 100%;
              }
            }

            @media (max-width: 800px) {
              main {
                padding: 12px !important;
              }
            }
          `}
        </style>
      </section>
    </main>
  )
}

export default Recruitment