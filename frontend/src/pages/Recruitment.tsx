import {
  useEffect,
  useMemo,
  useState,
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

  const [form, setForm] =
    useState<CandidatePayload>(emptyForm)

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
        const paginated =
          response as CandidateListResponse

        setCandidates(
          paginated.results ?? [],
        )
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
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const filteredCandidates = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

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

  const totalCandidates = candidates.length

  const selectedCandidates = candidates.filter(
    (candidate) =>
      candidate.status === "SELECTED",
  ).length

  const interviewCandidates = candidates.filter(
    (candidate) =>
      candidate.status === "INTERVIEW",
  ).length

  const rejectedCandidates = candidates.filter(
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

    if (
      !form.department ||
      form.department <= 0
    ) {
      setError("Department ID is required.")
      return
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
        interview_notes:
          form.interview_notes.trim(),
        hr_notes: form.hr_notes.trim(),
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
    } catch {
      setError(
        editingId !== null
          ? "Unable to update candidate."
          : "Unable to create candidate.",
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
      setError("Unable to delete candidate.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (
    candidate: Candidate,
  ) => {
    setForm({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      job_title: candidate.job_title,
      department: candidate.department,
      resume: null,
      interview_date:
        candidate.interview_date,
      status: candidate.status,
      interview_notes:
        candidate.interview_notes,
      hr_notes: candidate.hr_notes,
    })

    setEditingId(candidate.id)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const formatStatus = (
    value: string,
  ) => {
    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  }

  const getStatusStyle = (
    status: string,
  ) => {
    if (status === "SELECTED") {
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
      }
    }

    if (status === "REJECTED") {
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
      }
    }

    if (status === "INTERVIEW") {
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
      }
    }

    if (status === "SHORTLISTED") {
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
      }
    }

    return {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    }
  }

  const inputStyle = {
    width: "100%",
    marginTop: "7px",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    boxSizing: "border-box" as const,
    fontSize: "14px",
    outline: "none",
  }

  const labelStyle = {
    display: "block",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px",
        backgroundColor: "#f8fafc",
        fontFamily:
          "Arial, sans-serif",
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
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "7px",
              }}
            >
              HR Management System
            </div>

            <h1
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "30px",
              }}
            >
              Recruitment
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: "#6b7280",
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
              setForm(emptyForm)
              setEditingId(null)
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
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
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "14px",
            }}
          >
            {error}
          </section>
        )}

        {success && (
          <section
            style={{
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
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
          ].map((stat) => (
            <article
              key={stat.label}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "18px",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  color: "#111827",
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
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
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
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom: "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "20px",
                  }}
                >
                  {editingId !== null
                    ? "Edit Candidate"
                    : "Add Candidate"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#6b7280",
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
                style={{
                  border: "none",
                  backgroundColor:
                    "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
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
              <label style={labelStyle}>
                First Name
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      first_name:
                        event.target.value,
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
                      last_name:
                        event.target.value,
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
                      email:
                        event.target.value,
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
                      phone:
                        event.target.value,
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
                      job_title:
                        event.target.value,
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
                  value={
                    form.department || ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      department:
                        Number(
                          event.target.value,
                        ),
                    }))
                  }
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Resume
                <input
                  type="file"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      resume:
                        event.target.files?.[0] ??
                        null,
                    }))
                  }
                  style={{
                    ...inputStyle,
                    padding: "8px",
                  }}
                />
              </label>

              <label style={labelStyle}>
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
                    setForm((current) => ({
                      ...current,
                      interview_date:
                        event.target.value
                          ? event.target.value
                          : null,
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status:
                        event.target.value,
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
                    setForm((current) => ({
                      ...current,
                      interview_notes:
                        event.target.value,
                    }))
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
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
                  value={form.hr_notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hr_notes:
                        event.target.value,
                    }))
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
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
                  disabled={isSubmitting}
                  style={{
                    padding:
                      "11px 20px",
                    border: "none",
                    borderRadius: "7px",
                    backgroundColor:
                      isSubmitting
                        ? "#93c5fd"
                        : "#2563eb",
                    color: "#ffffff",
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 700,
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
                    padding:
                      "11px 20px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "7px",
                    backgroundColor:
                      "#ffffff",
                    color: "#374151",
                    cursor: "pointer",
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
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom:
                "1px solid #e5e7eb",
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
                marginBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "19px",
                  }}
                >
                  Candidate Pipeline
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {filteredCandidates.length}{" "}
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
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="search"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  style={{
                    width: "240px",
                    padding:
                      "9px 12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "7px",
                    boxSizing:
                      "border-box",
                    fontSize: "14px",
                  }}
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  style={{
                    padding:
                      "9px 12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "7px",
                    backgroundColor:
                      "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  <option value="ALL">
                    All Statuses
                  </option>

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
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "45px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Loading candidates...
            </div>
          ) : filteredCandidates.length ===
            0 ? (
            <div
              style={{
                padding: "55px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "10px",
                }}
              >
                👤
              </div>

              <strong
                style={{
                  color: "#374151",
                }}
              >
                No candidates found
              </strong>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Try changing your
                search or filter.
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
                  minWidth: "1150px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor:
                        "#f8fafc",
                    }}
                  >
                    {[
                      "Candidate",
                      "Contact",
                      "Job",
                      "Department",
                      "Applied",
                      "Interview",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "13px 14px",
                          textAlign:
                            "left",
                          color:
                            "#6b7280",
                          fontSize:
                            "12px",
                          fontWeight: 700,
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            "0.04em",
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
                              "1px solid #f3f4f6",
                          }}
                        >
                          <strong
                            style={{
                              color:
                                "#111827",
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
                              "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#374151",
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
                                "#9ca3af",
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
                              "1px solid #f3f4f6",
                            color:
                              "#374151",
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
                              "1px solid #f3f4f6",
                            color:
                              "#374151",
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
                              "1px solid #f3f4f6",
                            color:
                              "#6b7280",
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
                              "1px solid #f3f4f6",
                            color:
                              "#6b7280",
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
                              "1px solid #f3f4f6",
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
                              "1px solid #f3f4f6",
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
                                  "1px solid #2563eb",
                                borderRadius:
                                  "6px",
                                backgroundColor:
                                  "#ffffff",
                                color:
                                  "#2563eb",
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