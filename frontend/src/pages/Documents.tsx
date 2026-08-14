import {
  useEffect,
  useState,
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
              Documents
            </h1>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Manage employee documents.
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
            Upload Document
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
              <label>
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
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                    padding: "10px",
                  }}
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

              <label>
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
                  style={{
                    display:
                      "block",
                    width: "100%",
                    marginTop: "6px",
                  }}
                />
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
                    ? "Uploading..."
                    : "Upload Document"}
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
              Employee Documents
            </h2>
          </div>

          {isLoading ? (
            <p
              style={{
                padding: "24px",
              }}
            >
              Loading documents...
            </p>
          ) : documents.length ===
            0 ? (
            <p
              style={{
                padding: "24px",
                color: "#6b7280",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
                        }}
                      >
                        {document.title}
                      </td>

                      <td
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
                          maxWidth:
                            "250px",
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
                            "1px solid #f3f4f6",
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
                            "1px solid #f3f4f6",
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
                                "#2563eb",
                            }}
                          >
                            View File
                          </a>
                        ) : (
                          "-"
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
                              "pointer",
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