import type { CSSProperties } from "react"

import type { Employee } from "../../api/employees"

export interface EmployeeDirectoryTheme {
  cardBackground: string
  cardBackgroundAlt: string
  border: string
  borderTable: string
  borderRow: string
  borderSoft: string
  inputBackground: string
  textHeading: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textSubtle: string
  disabledBackground: string
  disabledText: string
  avatarBackground: string
  avatarText: string
  blueBorder: string
  blueSoft: string
  blueText: string
  dangerBackground: string
  dangerBorder: string
  dangerText: string
}

interface EmployeeDirectoryProps {
  theme: EmployeeDirectoryTheme
  cardStyle: CSSProperties
  employees: Employee[]
  canManageEmployees: boolean
  isLoading: boolean
  deletingId: number | null
  totalEmployees: number
  page: number
  totalPages: number
  startRecord: number
  endRecord: number
  nextPage: string | null
  previousPage: string | null
  formatValue: (value: string) => string
  formatDate: (value: string) => string
  getInitials: (value: string) => string
  getDepartmentName: (employee: Employee) => string
  getDesignationName: (employee: Employee) => string
  getStatusStyle: (status: string) => CSSProperties
  handleView: (employee: Employee) => void
  handleEdit: (employee: Employee) => void
  handleDelete: (id: number) => void
  handlePrevious: () => void
  handleNext: () => void
}

function EmployeeDirectory({
  theme,
  cardStyle,
  employees,
  canManageEmployees,
  isLoading,
  deletingId,
  totalEmployees,
  page,
  totalPages,
  startRecord,
  endRecord,
  nextPage,
  previousPage,
  formatValue,
  formatDate,
  getInitials,
  getDepartmentName,
  getDesignationName,
  getStatusStyle,
  handleView,
  handleEdit,
  handleDelete,
  handlePrevious,
  handleNext,
}: EmployeeDirectoryProps) {
  return (
    <section
          className="employees-directory"
          style={{
            ...cardStyle,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
              padding: "16px 18px",
              borderBottom:
                `1px solid ${theme.border}`,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: theme.textHeading,
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Employee Directory
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  color: theme.textSubtle,
                  fontSize: "11px",
                }}
              >
                {totalEmployees} employee
                {totalEmployees === 1
                  ? ""
                  : "s"}{" "}
                found
              </p>
            </div>

            {isLoading && (
              <span
                style={{
                  color: theme.blueText,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Loading...
              </span>
            )}
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: theme.textMuted,
                fontSize: "13px",
              }}
            >
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: theme.textPrimary,
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                No employees found
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  color: theme.textSubtle,
                  fontSize: "12px",
                }}
              >
                Try changing your filters
                or add a new employee.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "1200px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          theme.cardBackgroundAlt,
                      }}
                    >
                      {[
                        "Employee",
                        "Employee ID",
                        "Department",
                        "Designation",
                        "Manager",
                        "Joining Date",
                        "Type",
                        "Status",
                        ...(canManageEmployees ? ["Actions"] : []),
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "11px 14px",
                            textAlign: "left",
                            borderBottom:
                              `1px solid ${theme.borderTable}`,
                            color: theme.textMuted,
                            fontSize: "10px",
                            fontWeight: 700,
                            whiteSpace:
                              "nowrap",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.035em",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map(
                      (employee) => (
                        <tr
                          key={employee.id}
                          style={{
                            background:
                              theme.cardBackground,
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    "36px",
                                  height:
                                    "36px",
                                  flexShrink: 0,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  borderRadius:
                                    "50%",
                                  background:
                                    theme.avatarBackground,
                                  color:
                                    theme.avatarText,
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                {getInitials(
                                  employee.full_name,
                                )}
                              </div>

                              <div>
                                <div
                                  style={{
                                    color:
                                      theme.textPrimary,
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    employee.full_name
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "3px",
                                    color:
                                      theme.textSubtle,
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  {
                                    employee.user_email
                                  }
                                </div>
                              </div>
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              employee.employee_id
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDepartmentName(
                              employee,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {getDesignationName(
                              employee,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                            }}
                          >
                            {employee.manager_name ||
                              "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatDate(
                              employee.joining_date,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                              color:
                                theme.textSecondary,
                              fontSize:
                                "12px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {employee.employment_type_label ||
                              formatValue(
                                employee.employment_type,
                              )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                height:
                                  "24px",
                                padding:
                                  "0 9px",
                                borderRadius:
                                  "12px",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  700,
                                whiteSpace:
                                  "nowrap",
                                ...getStatusStyle(
                                  employee.employment_status,
                                ),
                              }}
                            >
                              {employee.employment_status_label ||
                                formatValue(
                                  employee.employment_status,
                                )}
                            </span>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 14px",
                              borderBottom:
                                `1px solid ${theme.borderRow}`,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "6px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    employee,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.borderSoft}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.inputBackground,
                                  color:
                                    theme.textSecondary,
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                View
                              </button>

                              {canManageEmployees && <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    employee,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.blueBorder}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.blueSoft,
                                  color:
                                    theme.blueText,
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                Edit
                              </button>}

                              {canManageEmployees && <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  employee.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    employee.id,
                                  )
                                }
                                style={{
                                  height:
                                    "29px",
                                  padding:
                                    "0 9px",
                                  border:
                                    `1px solid ${theme.dangerBorder}`,
                                  borderRadius:
                                    "5px",
                                  background:
                                    theme.dangerBackground,
                                  color:
                                    theme.dangerText,
                                  cursor:
                                    deletingId ===
                                    employee.id
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {deletingId ===
                                employee.id
                                  ? "..."
                                  : "Delete"}
                              </button>}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                  padding: "13px 16px",
                  borderTop:
                    `1px solid ${theme.border}`,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    color: theme.textMuted,
                    fontSize: "11px",
                  }}
                >
                  Showing{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {startRecord}
                  </strong>{" "}
                  to{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {endRecord}
                  </strong>{" "}
                  of{" "}
                  <strong
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {totalEmployees}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      !previousPage ||
                      page <= 1
                    }
                    onClick={handlePrevious}
                    style={{
                      height: "32px",
                      padding: "0 11px",
                      border:
                        `1px solid ${theme.borderSoft}`,
                      borderRadius: "6px",
                      background:
                        !previousPage ||
                        page <= 1
                          ? theme.disabledBackground
                          : theme.inputBackground,
                      color:
                        !previousPage ||
                        page <= 1
                          ? theme.disabledText
                          : theme.textSecondary,
                      cursor:
                        !previousPage ||
                        page <= 1
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Previous
                  </button>

                  <span
                    style={{
                      minWidth: "32px",
                      height: "32px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      borderRadius: "6px",
                      background: "var(--app-primary)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {page}
                  </span>

                  <span
                    style={{
                      color: theme.textMuted,
                      fontSize: "11px",
                    }}
                  >
                    of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!nextPage}
                    onClick={handleNext}
                    style={{
                      height: "32px",
                      padding: "0 11px",
                      border:
                        `1px solid ${theme.borderSoft}`,
                      borderRadius: "6px",
                      background: !nextPage
                        ? theme.disabledBackground
                        : theme.inputBackground,
                      color: !nextPage
                        ? theme.disabledText
                        : theme.textSecondary,
                      cursor: !nextPage
                        ? "not-allowed"
                        : "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
  )
}

export default EmployeeDirectory
