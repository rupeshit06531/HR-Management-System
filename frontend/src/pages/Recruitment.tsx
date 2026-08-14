import {
  useEffect,
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
  const [candidates, setCandidates] = useState<
    Candidate[]
  >([])

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
    useState<CandidatePayload>(
      emptyForm,
    )

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response =
        await getCandidates()

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

    if (!form.first_name.trim()) {
      setError(
        "First name is required.",
      )
      return
    }

    if (!form.email.trim()) {
      setError(
        "Email is required.",
      )
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

    try {
      setIsSubmitting(true)

      const payload: CandidatePayload =
        {
          ...form,
          first_name:
            form.first_name.trim(),
          last_name:
            form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          job_title:
            form.job_title.trim(),
          interview_notes:
            form.interview_notes.trim(),
          hr_notes:
            form.hr_notes.trim(),
        }

      if (editingId !== null) {
        const updated =
          await updateCandidate(
            editingId,
            payload,
          )

        setCandidates(
          (current) =>
            current.map(
              (candidate) =>
                candidate.id ===
                editingId
                  ? updated
                  : candidate,
            ),
        )

        setSuccess(
          "Candidate updated successfully.",
        )
      } else {
        const created =
          await createCandidate(
            payload,
          )

        setCandidates(
          (current) => [
            created,
            ...current,
          ],
        )

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

      setCandidates(
        (current) =>
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
          maxWidth: "1400px",
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
              Recruitment
            </h1>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Manage candidates and
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
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor:
                "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Add Candidate
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
              {editingId !== null
                ? "Edit Candidate"
                : "Add Candidate"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "16px",
                maxWidth: "800px",
              }}
            >
              <label>
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
                Department ID

                <input
                  type="number"
                  min="1"
                  value={
                    form.department || ""
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
                Resume

                <input
                  type="file"
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
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                  }}
                />
              </label>

              <label>
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
                          event.target
                            .value
                            ? event.target
                                .value
                            : null,
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

              <label>
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

              <label>
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
                      ? "Update Candidate"
                      : "Save Candidate"}
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
              Candidates
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
              }}
            >
              Loading candidates...
            </p>
          ) : candidates.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: "#6b7280",
              }}
            >
              No candidates found.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "1200px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Candidate",
                    "Contact",
                    "Job",
                    "Department",
                    "Application Date",
                    "Interview Date",
                    "Status",
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
                {candidates.map(
                  (candidate) => (
                    <tr
                      key={
                        candidate.id
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
                          {candidate.full_name ||
                            `${candidate.first_name} ${candidate.last_name}`}
                        </strong>
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        <div>
                          {candidate.email}
                        </div>
                        <div
                          style={{
                            color:
                              "#6b7280",
                            fontSize:
                              "13px",
                          }}
                        >
                          {candidate.phone}
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
                        {candidate.job_title}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        {candidate.department_name ||
                          candidate.department}
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
                          candidate.application_date
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
                        {candidate.interview_date
                          ? new Date(
                              candidate.interview_date,
                            ).toLocaleString()
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
                        {formatStatus(
                          candidate.status,
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
                                resume:
                                  null,
                                interview_date:
                                  candidate.interview_date,
                                status:
                                  candidate.status,
                                interview_notes:
                                  candidate.interview_notes,
                                hr_notes:
                                  candidate.hr_notes,
                              })

                              setEditingId(
                                candidate.id,
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
                              candidate.id
                            }
                            onClick={() =>
                              void handleDelete(
                                candidate.id,
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
          )}
        </section>
      </section>
    </main>
  )
}

export default Recruitment