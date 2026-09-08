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

import { useTheme } from "../context/ThemeContext"

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

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function getStatusStyle(status: string) {
  switch (status) {
    case "APPLIED":
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
      }

    case "SCREENING":
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
      }

    case "SHORTLISTED":
      return {
        backgroundColor: "#ede9fe",
        color: "#6d28d9",
      }

    case "INTERVIEW":
      return {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
      }

    case "SELECTED":
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
      }

    case "REJECTED":
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
      }

    case "WITHDRAWN":
      return {
        backgroundColor: "#f3f4f6",
        color: "#4b5563",
      }

    default:
      return {
        backgroundColor: "#f3f4f6",
        color: "#374151",
      }
  }
}

function Recruitment() {
  const { isDarkMode } = useTheme()

  const colors = {
    pageBackground: isDarkMode
      ? "#0f172a"
      : "#f8fafc",

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

    subtleText: isDarkMode
      ? "#6b7280"
      : "#9ca3af",

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

    primary: "#2563eb",

    primaryDisabled: "#60a5fa",

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

    secondaryButtonBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    secondaryButtonText: isDarkMode
      ? "#e5e7eb"
      : "#374151",
  }

  const labelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: colors.secondaryText,
    fontSize: "13px",
    fontWeight: 600,
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "14px",
    color: colors.text,
    backgroundColor: colors.inputBackground,
    outline: "none",
  }

  const [candidates, setCandidates] =
    useState<Candidate[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

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
    useState<CandidatePayload>(emptyForm)

  const [searchTerm, setSearchTerm] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState("ALL")

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getCandidates()

      if (Array.isArray(response)) {
        setCandidates(response)
      } else {
        const paginated =
          response as CandidateListResponse

        setCandidates(
          paginated.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load candidates.",
      )
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

  const filteredCandidates = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase()

    return candidates.filter((candidate) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        candidate.status === statusFilter

      if (!matchesStatus) {
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
  }, [
    candidates,
    searchTerm,
    statusFilter,
  ])

  const totalCandidates =
    candidates.length

  const selectedCandidates =
    candidates.filter(
      (candidate) =>
        candidate.status === "SELECTED",
    ).length

  const interviewCandidates =
    candidates.filter(
      (candidate) =>
        candidate.status === "INTERVIEW",
    ).length

  const rejectedCandidates =
    candidates.filter(
      (candidate) =>
        candidate.status === "REJECTED",
    ).length

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.first_name.trim()) {
      setError(
        "First name is required.",
      )
      return
    }

    if (!form.email.trim()) {
      setError("Email is required.")
      return
    }

    if (!form.phone.trim()) {
      setError(
        "Phone number is required.",
      )
      return
    }

    if (!form.job_title.trim()) {
      setError(
        "Job title is required.",
      )
      return
    }

    if (
      !form.department ||
      form.department <= 0
    ) {
      setError(
        "Department ID is required.",
      )
      return
    }

    if (
      form.experience_years !==
        undefined &&
      form.experience_years < 0
    ) {
      setError(
        "Experience years cannot be negative.",
      )
      return
    }

    if (
      form.expected_salary !== null &&
      form.expected_salary !==
        undefined &&
      Number(form.expected_salary) < 0
    ) {
      setError(
        "Expected salary cannot be negative.",
      )
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
        form.joining_date <
          form.offer_date
      ) {
        setError(
          "Joining date cannot be before offer date.",
        )
        return
      }
    }

    try {
      setIsSubmitting(true)

      const payload: CandidatePayload = {
        ...form,

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        job_title:
          form.job_title.trim(),

        interview_notes:
          form.interview_notes.trim(),

        hr_notes:
          form.hr_notes.trim(),

        experience_years:
          form.experience_years,

        expected_salary:
          form.expected_salary,

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
        const updated =
          await updateCandidate(
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

        setSuccess(
          "Candidate updated successfully.",
        )
      } else {
        const created =
          await createCandidate(payload)

        setCandidates((current) => [
          created,
          ...current,
        ])

        setSuccess(
          "Candidate created successfully.",
        )
      }

      resetForm()
    } catch (requestError: any) {
      const responseData =
        requestError?.response?.data

      if (
        responseData &&
        typeof responseData ===
          "object"
      ) {
        const messages =
          Object.entries(
            responseData,
          )
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

  const handleDelete = async (
    id: number,
  ) => {
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
          (candidate) =>
            candidate.id !== id,
        ),
      )

      setSuccess(
        "Candidate deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete candidate.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (
    candidate: Candidate,
  ) => {
    setForm({
      first_name:
        candidate.first_name,

      last_name:
        candidate.last_name,

      email:
        candidate.email,

      phone:
        candidate.phone,

      job_title:
        candidate.job_title,

      department:
        candidate.department,

      resume: null,

      interview_date:
        candidate.interview_date,

      status:
        candidate.status,

      interview_notes:
        candidate.interview_notes,

      hr_notes:
        candidate.hr_notes,

      experience_years:
        candidate.experience_years,

      expected_salary:
        candidate.expected_salary,

      offer_date:
        candidate.offer_date,

      joining_date:
        candidate.joining_date,
    })

    setEditingId(candidate.id)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor:
          colors.pageBackground,
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: colors.primary,
                fontSize: "13px",
                fontWeight: 700,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                marginBottom: "7px",
              }}
            >
              HR Management System
            </div>

            <h1
              style={{
                margin: 0,
                color: colors.text,
                fontSize: "30px",
              }}
            >
              Recruitment
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: colors.mutedText,
                fontSize: "15px",
              }}
            >
              Manage candidates,
              interviews and
              recruitment applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm({
                ...emptyForm,
              })
              setEditingId(null)
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              padding:
                "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                colors.primary,
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            + Add Candidate
          </button>
        </header>

        {error && (
          <section
            style={{
              padding:
                "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                colors.errorBackground,
              border:
                `1px solid ${colors.errorBorder}`,
              borderRadius: "8px",
              color: colors.errorText,
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            style={{
              padding:
                "14px 16px",
              marginBottom: "20px",
              backgroundColor:
                colors.successBackground,
              border:
                `1px solid ${colors.successBorder}`,
              borderRadius: "8px",
              color: colors.successText,
              fontSize: "14px",
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
          {[
            {
              label: "Total Candidates",
              value:
                totalCandidates,
            },
            {
              label: "Interviews",
              value:
                interviewCandidates,
            },
            {
              label: "Selected",
              value:
                selectedCandidates,
            },
            {
              label: "Rejected",
              value:
                rejectedCandidates,
            },
          ].map((stat) => (
            <article
              key={stat.label}
              style={{
                backgroundColor:
                  colors.cardBackground,
                border:
                  `1px solid ${colors.border}`,
                borderRadius: "10px",
                padding: "18px",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  color: colors.mutedText,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom:
                    "8px",
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  color: colors.text,
                  fontSize: "27px",
                  fontWeight: 700,
                }}
              >
                {stat.value}
              </div>
            </article>
          ))}
        </section>

        {showForm && (
          <section
            style={{
              backgroundColor:
                colors.cardBackground,
              border:
                `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow:
                "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom:
                  "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontSize: "20px",
                  }}
                >
                  {editingId !==
                  null
                    ? "Edit Candidate"
                    : "Add Candidate"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: colors.mutedText,
                    fontSize: "13px",
                  }}
                >
                  Enter candidate
                  information below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
                style={{
                  border: "none",
                  backgroundColor:
                    "transparent",
                  color: colors.mutedText,
                  cursor: "pointer",
                  fontSize: "24px",
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
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
              }}
            >
              <label
                style={labelStyle}
              >
                First Name
                <input
                  type="text"
                  value={
                    form.first_name
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        first_name:
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
                style={labelStyle}
              >
                Last Name
                <input
                  type="text"
                  value={
                    form.last_name
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        last_name:
                          event.target
                            .value,
                      }),
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={labelStyle}
              >
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        email:
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
                style={labelStyle}
              >
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        phone:
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
                style={labelStyle}
              >
                Job Title
                <input
                  type="text"
                  value={
                    form.job_title
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        job_title:
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
                style={labelStyle}
              >
                Department ID
                <input
                  type="number"
                  min="1"
                  value={
                    form.department ||
                    ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        department:
                          Number(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label
                style={labelStyle}
              >
                Experience (Years)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.experience_years ??
                    ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        experience_years:
                          event.target
                            .value ===
                          ""
                            ? undefined
                            : Number(
                                event.target
                                  .value,
                              ),
                      }),
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={labelStyle}
              >
                Expected Salary
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.expected_salary ??
                    ""
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        expected_salary:
                          event.target
                            .value ===
                          ""
                            ? null
                            : event.target
                                .value,
                      }),
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={labelStyle}
              >
                Resume
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        resume:
                          event.target
                            .files?.[0] ??
                          null,
                      }),
                    )
                  }
                  style={{
                    ...inputStyle,
                    padding: "8px",
                  }}
                />

                {editingId !==
                  null &&
                  form.resume ===
                    null && (
                    <span
                      style={{
                        color:
                          colors.mutedText,
                        fontSize:
                          "12px",
                        fontWeight:
                          400,
                      }}
                    >
                      Leave empty to
                      keep the existing
                      resume.
                    </span>
                  )}
              </label>

              <label
                style={labelStyle}
              >
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        status:
                          event.target
                            .value,
                        interview_date:
                          event.target
                              .value ===
                            "INTERVIEW"
                            ? current.interview_date
                            : null,
                        offer_date:
                          event.target
                              .value ===
                            "SELECTED"
                            ? current.offer_date
                            : null,
                        joining_date:
                          event.target
                              .value ===
                            "SELECTED"
                            ? current.joining_date
                            : null,
                      }),
                    )
                  }
                  style={inputStyle}
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={
                          status.value
                        }
                        value={
                          status.value
                        }
                      >
                        {status.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {form.status ===
                "INTERVIEW" && (
                <label
                  style={labelStyle}
                >
                  Interview Date
                  <input
                    type="datetime-local"
                    value={
                      form.interview_date
                        ? form.interview_date.slice(
                            0,
                            16,
                          )
                        : ""
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          interview_date:
                            event
                              .target
                              .value
                              ? event
                                  .target
                                  .value
                              : null,
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

              {form.status ===
                "SELECTED" && (
                <>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Offer Date
                    <input
                      type="date"
                      value={
                        form.offer_date ??
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
                            offer_date:
                              event
                                .target
                                .value ||
                              null,
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
                    style={
                      labelStyle
                    }
                  >
                    Joining Date
                    <input
                      type="date"
                      value={
                        form.joining_date ??
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
                            joining_date:
                              event
                                .target
                                .value ||
                              null,
                          }),
                        )
                      }
                      required
                      style={
                        inputStyle
                      }
                    />
                  </label>
                </>
              )}

              <label
                style={{
                  ...labelStyle,
                  gridColumn:
                    "1 / -1",
                }}
              >
                Interview Notes
                <textarea
                  value={
                    form.interview_notes
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        interview_notes:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn:
                    "1 / -1",
                }}
              >
                HR Notes
                <textarea
                  value={
                    form.hr_notes
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        hr_notes:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                  display: "flex",
                  gap: "10px",
                  paddingTop: "4px",
                }}
              >
                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "11px 20px",
                    border: "none",
                    borderRadius:
                      "7px",
                    backgroundColor:
                      isSubmitting
                        ? colors.primaryDisabled
                        : colors.primary,
                    color:
                      "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !==
                        null
                      ? "Update Candidate"
                      : "Save Candidate"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  style={{
                    padding:
                      "11px 20px",
                    border:
                      `1px solid ${colors.inputBorder}`,
                    borderRadius:
                      "7px",
                    backgroundColor:
                      colors.secondaryButtonBackground,
                    color:
                      colors.secondaryButtonText,
                    cursor:
                      "pointer",
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
              colors.cardBackground,
            border:
              `1px solid ${colors.border}`,
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              padding:
                "20px 22px",
              borderBottom:
                `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom:
                  "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontSize:
                      "19px",
                  }}
                >
                  Candidate Pipeline
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      colors.mutedText,
                    fontSize:
                      "13px",
                  }}
                >
                  {
                    filteredCandidates.length
                  }{" "}
                  candidate
                  {filteredCandidates.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  displayed
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <input
                  type="search"
                  placeholder="Search candidates..."
                  value={
                    searchTerm
                  }
                  onChange={(event) =>
                    setSearchTerm(
                      event.target
                        .value,
                    )
                  }
                  style={{
                    ...inputStyle,
                    width:
                      "240px",
                    padding:
                      "9px 12px",
                  }}
                />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value,
                    )
                  }
                  style={{
                    ...inputStyle,
                    width:
                      "auto",
                    padding:
                      "9px 12px",
                  }}
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  {statuses.map(
                    (status) => (
                      <option
                        key={
                          status.value
                        }
                        value={
                          status.value
                        }
                      >
                        {status.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                padding:
                  "45px",
                textAlign:
                  "center",
                color:
                  colors.mutedText,
              }}
            >
              Loading candidates...
            </div>
          ) : filteredCandidates.length ===
            0 ? (
            <div
              style={{
                padding:
                  "55px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "32px",
                  marginBottom:
                    "10px",
                }}
              >
                👤
              </div>

              <strong
                style={{
                  color:
                    colors.secondaryText,
                }}
              >
                No candidates
                found
              </strong>

              <p
                style={{
                  color:
                    colors.mutedText,
                  fontSize:
                    "14px",
                }}
              >
                Try changing
                your search or
                filter.
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
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "1250px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor:
                        colors.tableHeader,
                    }}
                  >
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
                    ].map(
                      (heading) => (
                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "13px 14px",
                            textAlign:
                              "left",
                            color:
                              colors.mutedText,
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.04em",
                            borderBottom:
                              `1px solid ${colors.border}`,
                          }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredCandidates.map(
                    (candidate) => (
                      <tr
                        key={
                          candidate.id
                        }
                      >
                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                          }}
                        >
                          <strong
                            style={{
                              color:
                                colors.text,
                            }}
                          >
                            {candidate.full_name ||
                              `${candidate.first_name} ${candidate.last_name}`.trim()}
                          </strong>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                          }}
                        >
                          <div
                            style={{
                              color:
                                colors.secondaryText,
                              fontSize:
                                "14px",
                            }}
                          >
                            {
                              candidate.email
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                colors.subtleText,
                              fontSize:
                                "12px",
                            }}
                          >
                            {
                              candidate.phone
                            }
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.secondaryText,
                            fontSize:
                              "14px",
                          }}
                        >
                          {
                            candidate.job_title
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.secondaryText,
                            fontSize:
                              "14px",
                          }}
                        >
                          {candidate.department_name ||
                            candidate.department}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.mutedText,
                            fontSize:
                              "13px",
                          }}
                        >
                          {candidate.experience_years ?? 0}{" "}
                          yrs
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.mutedText,
                            fontSize:
                              "13px",
                          }}
                        >
                          {candidate.expected_salary
                            ? candidate.expected_salary
                            : "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.mutedText,
                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            candidate.application_date
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                            color:
                              colors.mutedText,
                            fontSize:
                              "13px",
                          }}
                        >
                          {candidate.interview_date
                            ? new Date(
                                candidate.interview_date,
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
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
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                              whiteSpace:
                                "nowrap",
                              ...getStatusStyle(
                                candidate.status,
                              ),
                            }}
                          >
                            {formatStatus(
                              candidate.status,
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            borderBottom:
                              `1px solid ${colors.rowBorder}`,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "7px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  candidate,
                                )
                              }
                              style={{
                                padding:
                                  "7px 11px",
                                border:
                                  `1px solid ${colors.primary}`,
                                borderRadius:
                                  "6px",
                                backgroundColor:
                                  colors.cardBackground,
                                color:
                                  colors.primary,
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                candidate.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  candidate.id,
                                )
                              }
                              style={{
                                padding:
                                  "7px 11px",
                                border:
                                  "none",
                                borderRadius:
                                  "6px",
                                backgroundColor:
                                  deletingId ===
                                  candidate.id
                                    ? "#9ca3af"
                                    : "#dc2626",
                                color:
                                  "#ffffff",
                                cursor:
                                  deletingId ===
                                  candidate.id
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {deletingId ===
                              candidate.id
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

export default Recruitment