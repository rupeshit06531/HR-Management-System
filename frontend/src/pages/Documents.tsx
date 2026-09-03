import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import {
  createDocument,
  deleteDocument,
  getDocuments,
  type CreateDocumentRequest,
  type DocumentListResponse,
  type DocumentRecord,
} from "../api/documents"

const documentTypes = [
  {
    value: "contract",
    label: "Contract",
  },
  {
    value: "id_proof",
    label: "ID Proof",
  },
  {
    value: "certificate",
    label: "Certificate",
  },
  {
    value: "resume",
    label: "Resume",
  },
  {
    value: "other",
    label: "Other",
  },
]

const emptyForm: Omit<
  CreateDocumentRequest,
  "file"
> & {
  file: File | null
} = {
  employee: 0,
  title: "",
  document_type: "other",
  file: null,
  description: "",
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

function Documents() {
  const [documents, setDocuments] = useState<
    DocumentRecord[]
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

  const [form, setForm] = useState(
    emptyForm,
  )

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response =
        await getDocuments()

      if (Array.isArray(response)) {
        setDocuments(response)
      } else {
        const paginated =
          response as DocumentListResponse

        setDocuments(
          paginated.results ?? [],
        )
      }
    } catch {
      setError(
        "Unable to load documents.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDocuments()
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

    if (
      !form.employee ||
      form.employee <= 0
    ) {
      setError(
        "Employee ID is required.",
      )
      return
    }

    if (!form.title.trim()) {
      setError(
        "Document title is required.",
      )
      return
    }

    if (!form.file) {
      setError(
        "Please select a document file.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreateDocumentRequest =
        {
          employee: form.employee,
          title: form.title.trim(),
          document_type:
            form.document_type,
          file: form.file,
          description:
            form.description.trim(),
        }

      const created =
        await createDocument(payload)

      setDocuments(
        (current) => [
          created,
          ...current,
        ],
      )

      setSuccess(
        "Document uploaded successfully.",
      )

      resetForm()
    } catch {
      setError(
        "Unable to upload document.",
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
        "Are you sure you want to delete this document?",
      )
    ) {
      return
    }

    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)

      await deleteDocument(id)

      setDocuments(
        (current) =>
          current.filter(
            (document) =>
              document.id !== id,
          ),
      )

      setSuccess(
        "Document deleted successfully.",
      )
    } catch {
      setError(
        "Unable to delete document.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatDocumentType = (
    value: string,
  ) => {
    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  }

  const totalDocuments =
    documents.length

  const contractDocuments =
    documents.filter(
      (document) =>
        document.document_type ===
        "contract",
    ).length

  const certificateDocuments =
    documents.filter(
      (document) =>
        document.document_type ===
        "certificate",
    ).length

  return (
    <main style={pageStyle}>
      <style>
        {`
          .documents-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 12px;
          }

          .documents-kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 12px;
          }

          .documents-kpi {
            padding: 12px 14px;
          }

          .documents-kpi-label {
            font-size: 10px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .documents-kpi-value {
            margin-top: 3px;
            font-size: 22px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .documents-form-card {
            padding: 14px;
            margin-bottom: 12px;
          }

          .documents-form-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .documents-form {
            display: grid;
            gap: 10px;
          }

          .documents-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .documents-field {
            min-width: 0;
          }

          .documents-file-input {
            width: 100%;
            box-sizing: border-box;
            padding: 7px 8px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #ffffff;
            color: #374151;
            font-size: 12px;
          }

          .documents-textarea {
            min-height: 78px;
            resize: vertical;
          }

          .documents-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
          }

          .documents-list-card {
            overflow: hidden;
          }

          .documents-list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
          }

          .documents-table-wrap {
            overflow-x: auto;
          }

          .documents-table {
            width: 100%;
            min-width: 1050px;
            border-collapse: collapse;
            font-size: 12px;
          }

          .documents-table th {
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

          .documents-table td {
            padding: 9px;
            border-bottom: 1px solid #eef0f3;
            color: #374151;
            vertical-align: middle;
          }

          .documents-table tbody tr:last-child td {
            border-bottom: none;
          }

          .documents-table tbody tr:hover {
            background: #fafafa;
          }

          .documents-title {
            max-width: 190px;
            overflow: hidden;
            color: #111827;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .documents-description {
            max-width: 220px;
            overflow: hidden;
            color: #6b7280;
            font-size: 11px;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .documents-type {
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
            white-space: nowrap;
          }

          .documents-employee {
            font-weight: 700;
            color: #374151;
            white-space: nowrap;
          }

          .documents-file-link {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 5px 9px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            background: #ffffff;
            color: #374151;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
          }

          .documents-delete {
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

          .documents-empty,
          .documents-loading {
            padding: 28px 14px;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }

          .documents-alert {
            margin-bottom: 10px;
            padding: 9px 11px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .documents-alert-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .documents-alert-success {
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #166534;
          }

          @media (max-width: 800px) {
            .documents-form-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .documents-kpis {
              grid-template-columns: 1fr;
            }

            .documents-header {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section style={containerStyle}>
        <header className="documents-header">
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
                Documents
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
              Documents
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Manage employee documents and files.
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
            + Upload Document
          </button>
        </header>

        {error && (
          <div className="documents-alert documents-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="documents-alert documents-alert-success">
            {success}
          </div>
        )}

        <section className="documents-kpis">
          <div
            className="documents-kpi"
            style={cardStyle}
          >
            <div className="documents-kpi-label">
              Total Documents
            </div>

            <div className="documents-kpi-value">
              {totalDocuments}
            </div>
          </div>

          <div
            className="documents-kpi"
            style={cardStyle}
          >
            <div className="documents-kpi-label">
              Contracts
            </div>

            <div className="documents-kpi-value">
              {contractDocuments}
            </div>
          </div>

          <div
            className="documents-kpi"
            style={cardStyle}
          >
            <div className="documents-kpi-label">
              Certificates
            </div>

            <div className="documents-kpi-value">
              {certificateDocuments}
            </div>
          </div>
        </section>

        {showForm && (
          <section
            className="documents-form-card"
            style={cardStyle}
          >
            <div className="documents-form-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Upload Employee Document
                </h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Add a document to an employee record.
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
              className="documents-form"
            >
              <div className="documents-form-grid">
                <div className="documents-field">
                  <label
                    htmlFor="document-employee"
                    style={labelStyle}
                  >
                    Employee ID
                  </label>

                  <input
                    id="document-employee"
                    type="number"
                    min="1"
                    value={
                      form.employee || ""
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          employee:
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
                </div>

                <div className="documents-field">
                  <label
                    htmlFor="document-title"
                    style={labelStyle}
                  >
                    Document Title
                  </label>

                  <input
                    id="document-title"
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
                </div>
              </div>

              <div className="documents-form-grid">
                <div className="documents-field">
                  <label
                    htmlFor="document-type"
                    style={labelStyle}
                  >
                    Document Type
                  </label>

                  <select
                    id="document-type"
                    value={
                      form.document_type
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          document_type:
                            event.target
                              .value,
                        }),
                      )
                    }
                    style={inputStyle}
                  >
                    {documentTypes.map(
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
                </div>

                <div className="documents-field">
                  <label
                    htmlFor="document-file"
                    style={labelStyle}
                  >
                    Document File
                  </label>

                  <input
                    id="document-file"
                    type="file"
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          file:
                            event.target
                              .files?.[0] ??
                            null,
                        }),
                      )
                    }
                    required
                    className="documents-file-input"
                  />
                </div>
              </div>

              <div className="documents-field">
                <label
                  htmlFor="document-description"
                  style={labelStyle}
                >
                  Description
                </label>

                <textarea
                  id="document-description"
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
                  rows={3}
                  className="documents-textarea"
                  style={inputStyle}
                />
              </div>

              <div className="documents-form-actions">
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
                    ? "Uploading..."
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          className="documents-list-card"
          style={cardStyle}
        >
          <div className="documents-list-header">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Employee Documents
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                Review uploaded employee files.
              </p>
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#6b7280",
              }}
            >
              {documents.length} records
            </span>
          </div>

          {isLoading ? (
            <div className="documents-loading">
              Loading documents...
            </div>
          ) : documents.length ===
            0 ? (
            <div className="documents-empty">
              No documents found.
            </div>
          ) : (
            <div className="documents-table-wrap">
              <table className="documents-table">
                <thead>
                  <tr>
                    {[
                      "Employee",
                      "Title",
                      "Type",
                      "Description",
                      "Uploaded At",
                      "File",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {documents.map(
                    (document) => (
                      <tr
                        key={
                          document.id
                        }
                      >
                        <td>
                          <span className="documents-employee">
                            Employee #
                            {
                              document.employee
                            }
                          </span>
                        </td>

                        <td>
                          <div
                            className="documents-title"
                            title={
                              document.title
                            }
                          >
                            {
                              document.title
                            }
                          </div>
                        </td>

                        <td>
                          <span className="documents-type">
                            {formatDocumentType(
                              document.document_type,
                            )}
                          </span>
                        </td>

                        <td>
                          <div
                            className="documents-description"
                            title={
                              document.description ||
                              "-"
                            }
                          >
                            {document.description ||
                              "-"}
                          </div>
                        </td>

                        <td>
                          {new Date(
                            document.uploaded_at,
                          ).toLocaleString()}
                        </td>

                        <td>
                          {document.file ? (
                            <a
                              href={
                                document.file
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="documents-file-link"
                            >
                              View File
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              document.id
                            }
                            onClick={() =>
                              void handleDelete(
                                document.id,
                              )
                            }
                            className="documents-delete"
                            style={{
                              opacity:
                                deletingId ===
                                document.id
                                  ? 0.65
                                  : 1,
                              cursor:
                                deletingId ===
                                document.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {deletingId ===
                            document.id
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

export default Documents