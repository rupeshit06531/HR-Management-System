import type { CSSProperties } from "react"

import type { Employee } from "../../api/employees"

export interface EmployeeDetailsTheme {
  cardBackgroundAlt: string
  border: string
  borderSoft: string
  inputBackground: string
  textHeading: string
  textSecondary: string
  textPrimary: string
  textSubtle: string
  blueText: string
}

interface EmployeeDetailsProps {
  theme: EmployeeDetailsTheme
  cardStyle: CSSProperties
  employee: Employee
  formatValue: (value: string) => string
  formatDate: (value: string) => string
  onClose: () => void
}

function EmployeeDetails({
  theme,
  cardStyle,
  employee,
  formatValue,
  formatDate,
  onClose,
}: EmployeeDetailsProps) {
  return (
    <section
              style={{
                ...cardStyle,
                marginBottom: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom:
                    `1px solid ${theme.border}`,
                  background:
                    theme.cardBackgroundAlt,
                }}
              >
                <div>
                  <div
                    style={{
                      color: theme.blueText,
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                    }}
                  >
                    EMPLOYEE DETAILS
                  </div>

                  <h2
                    style={{
                      margin: "5px 0 0",
                      color: theme.textHeading,
                      fontSize: "18px",
                    }}
                  >
                    {selectedEmployee.full_name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedEmployee(null)
                  }}
                  style={{
                    height: "34px",
                    padding: "0 12px",
                    border:
                      `1px solid ${theme.borderSoft}`,
                    borderRadius: "6px",
                    background:
                      theme.inputBackground,
                    color: theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "20px",
                  padding: "22px",
                }}
              >
                {[
                  [
                    "Employee ID",
                    selectedEmployee.employee_id,
                  ],
                  [
                    "Email",
                    selectedEmployee.user_email,
                  ],
                  [
                    "Department",
                    selectedEmployee.department_name ||
                      "-",
                  ],
                  [
                    "Designation",
                    selectedEmployee.designation_name ||
                      "-",
                  ],
                  [
                    "Manager",
                    selectedEmployee.manager_name ||
                      "-",
                  ],
                  [
                    "Joining Date",
                    formatDate(
                      selectedEmployee.joining_date,
                    ),
                  ],
                  [
                    "Employment Type",
                    selectedEmployee.employment_type_label ||
                      formatValue(
                        selectedEmployee.employment_type,
                      ),
                  ],
                  [
                    "Status",
                    formatValue(
                      selectedEmployee.employment_status,
                    ),
                  ],
                  [
                    "Date of Birth",
                    selectedEmployee.date_of_birth
                      ? formatDate(
                          selectedEmployee.date_of_birth,
                        )
                      : "-",
                  ],
                  [
                    "Emergency Contact",
                    selectedEmployee.emergency_contact ||
                      "-",
                  ],
                  [
                    "Address",
                    selectedEmployee.address ||
                      "-",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div
                      style={{
                        color: theme.textSubtle,
                        fontSize: "11px",
                        fontWeight: 600,
                        marginBottom: "5px",
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        color: theme.textPrimary,
                        fontSize: "13px",
                        fontWeight: 600,
                        wordBreak: "break-word",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
  )
}

export default EmployeeDetails
