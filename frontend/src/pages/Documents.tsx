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

import { useTheme } from "../context/ThemeContext"

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

function Documents() {
  const { isDarkMode } = useTheme()

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

  const theme = {
    pageBackground: isDarkMode
      ? "#111827"
      : "#f5f7fa",

    cardBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    text: isDarkMode
      ? "#f9fafb"
      : "#111827",

    mutedText: isDarkMode
      ? "#9ca3af"
      : "#6b7280",

    border: isDarkMode
      ? "#374151"
      : "#e5e7eb",

    rowBorder: isDarkMode
      ? "#374151"
      : "#f3f4f6",

    inputBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

    inputText: isDarkMode
      ? "#f9fafb"
      : "#111827",

    secondaryButtonBackground:
      isDarkMode
        ? "#374151"
        : "#ffffff",

    errorBackground: isDarkMode
      ? "#451a1a"
      : "#fee2e2",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground: isDarkMode
      ? "#14532d"
      : "#dcfce7",

    successText: isDarkMode
      ? "#bbf7d0"
      : "#166534",

    tableHeaderBackground: isDarkMode
      ? "#111827"
      : "#f9fafb",
  }

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "10px",
    boxSizing: "border-box",
    backgroundColor:
      theme.inputBackground,
    color: theme.inputText,
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
  }

  const fileInputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "8px 0",
    boxSizing: "border-box",
    backgroundColor:
      theme.inputBackground,
    color: theme.inputText,
    border: "none",
  }

  const buttonStyle: CSSProperties = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
  }

  const cancelButtonStyle: CSSProperties = {
    padding: "10px 18px",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    backgroundColor:
      theme.secondaryButtonBackground,
    color: theme.text,
    cursor: "pointer",
  }

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
    setForm({
      ...emptyForm,
    })
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
              Documents
            </h1>

            <p
              style={{
                color: theme.mutedText,
                marginBottom: 0,
              }}
            >
              Manage employee documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm({
                ...emptyForm,
              })
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              ...buttonStyle,
              padding: "10px 16px",
            }}
          >
            Upload Document
          </button>
        </header>

        {error && (
          <section
            style={{
              padding: "14px",
              marginBottom: "20px",
              backgroundColor:
                theme.errorBackground,
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
              color: theme.text,
              padding: "24px",
              borderRadius: "10px",
              marginBottom: "24px",
              boxShadow:
                isDarkMode
                  ? "0 1px 3px rgba(0, 0, 0, 0.35)"
                  : "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: theme.text,
              }}
            >
              Upload Employee Document
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
                  color: theme.text,
                }}
              >
                Employee ID

                <input
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
              </label>

              <label
                style={{
                  color: theme.text,
                }}
              >
                Document Title

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
                  color: theme.text,
                }}
              >
                Document Type

                <select
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
              </label>

              <label
                style={{
                  color: theme.text,
                }}
              >
                Document File

                <input
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
                  style={fileInputStyle}
                />
              </label>

              <label
                style={{
                  color: theme.text,
                }}
              >
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
                  style={inputStyle}
                />
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
                    ...buttonStyle,
                    opacity:
                      isSubmitting
                        ? 0.7
                        : 1,
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Uploading..."
                    : "Upload Document"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={cancelButtonStyle}
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
            color: theme.text,
            borderRadius: "10px",
            overflow: "auto",
            boxShadow:
              isDarkMode
                ? "0 1px 3px rgba(0, 0, 0, 0.25)"
                : "none",
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
              Employee Documents
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
                color: theme.mutedText,
              }}
            >
              Loading documents...
            </p>
          ) : documents.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: theme.mutedText,
              }}
            >
              No documents found.
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
                <tr
                  style={{
                    backgroundColor:
                      theme.tableHeaderBackground,
                  }}
                >
                  {[
                    "Employee",
                    "Title",
                    "Type",
                    "Description",
                    "Uploaded At",
                    "File",
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
                        color: theme.text,
                      }}
                    >
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
                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color: theme.text,
                        }}
                      >
                        Employee #
                        {
                          document.employee
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color: theme.text,
                        }}
                      >
                        {document.title}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color: theme.text,
                        }}
                      >
                        {formatDocumentType(
                          document.document_type,
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          maxWidth:
                            "250px",
                          color: theme.text,
                        }}
                      >
                        {document.description ||
                          "-"}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                          color: theme.text,
                        }}
                      >
                        {new Date(
                          document.uploaded_at,
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                        }}
                      >
                        {document.file ? (
                          <a
                            href={
                              document.file
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color:
                                "#60a5fa",
                            }}
                          >
                            View File
                          </a>
                        ) : (
                          <span
                            style={{
                              color:
                                theme.mutedText,
                            }}
                          >
                            -
                          </span>
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            `1px solid ${theme.rowBorder}`,
                        }}
                      >
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
                              deletingId ===
                              document.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              deletingId ===
                              document.id
                                ? 0.7
                                : 1,
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
          )}
        </section>
      </section>
    </main>
  )
}

export default Documents