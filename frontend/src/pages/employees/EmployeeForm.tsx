import type {
  CSSProperties,
  Dispatch,
  FormEvent,
  SetStateAction,
} from "react"

import type { AuthUser } from "../../api/accounts"
import type {
  Department,
  Designation,
} from "../../api/departments"
import type {
  Employee,
  EmployeePayload,
} from "../../api/employees"

export interface EmployeeFormTheme {
  cardBackgroundAlt: string
  border: string
  borderSoft: string
  inputBackground: string
  textHeading: string
  textSecondary: string
  blueText: string
}

interface EmployeeFormProps {
  theme: EmployeeFormTheme
  cardStyle: CSSProperties
  inputStyle: CSSProperties
  labelStyle: CSSProperties
  editingId: number | null
  isSubmitting: boolean
  form: EmployeePayload
  setForm: Dispatch<SetStateAction<EmployeePayload>>
  users: AuthUser[]
  employees: Employee[]
  departments: Department[]
  filteredDesignations: Designation[]
  employmentTypes: readonly string[]
  employmentStatuses: readonly string[]
  formatValue: (value: string) => string
  getUserName: (userId: number) => string
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  resetForm: () => void
}

function EmployeeForm({
  theme,
  cardStyle,
  inputStyle,
  labelStyle,
  editingId,
  isSubmitting,
  form,
  setForm,
  users,
  employees,
  departments,
  filteredDesignations,
  employmentTypes,
  employmentStatuses,
  formatValue,
  getUserName,
  handleSubmit,
  resetForm,
}: EmployeeFormProps) {
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
                background: theme.cardBackgroundAlt,
              }}
            >
              <div>
                <div
                  style={{
                    color: theme.blueText,
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Employee Information
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: "17px",
                    color: theme.textHeading,
                  }}
                >
                  {editingId !== null
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  border:
                    `1px solid ${theme.borderSoft}`,
                  borderRadius: "6px",
                  background: theme.inputBackground,
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            <form
              className="employees-form"
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "16px",
                padding: "20px",
              }}
            >
              <label style={labelStyle}>
                User

                <select
                  value={form.user || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      user: Number(
                        event.target.value,
                      ),
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  <option value="">
                    Select user
                  </option>

                  {users
                    .filter(
                      (user) =>
                        user.is_active &&
                        (editingId !== null ||
                          !employees.some(
                            (employee) =>
                              employee.user ===
                              user.id,
                          )),
                    )
                    .map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {getUserName(user.id)} -{" "}
                        {user.username}
                      </option>
                    ))}
                </select>
              </label>

              <label style={labelStyle}>
                Employee ID

                <input
                  type="text"
                  value={form.employee_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employee_id:
                        event.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="EMP-001"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Department

                <select
                  value={
                    form.department ?? ""
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value
                        ? Number(
                            event.target.value,
                          )
                        : null

                    setForm((current) => ({
                      ...current,
                      department: value,
                      designation: null,
                    }))
                  }}
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Designation

                <select
                  value={
                    form.designation ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      designation:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }))
                  }
                  disabled={
                    isSubmitting ||
                    !form.department
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select designation
                  </option>

                  {filteredDesignations.map(
                    (designation) => (
                      <option
                        key={designation.id}
                        value={designation.id}
                      >
                        {designation.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Joining Date

                <input
                  type="date"
                  value={form.joining_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      joining_date:
                        event.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Employment Type

                <select
                  value={
                    form.employment_type
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_type:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  {employmentTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {formatValue(type)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Employment Status

                <select
                  value={
                    form.employment_status
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_status:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                >
                  {employmentStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatValue(status)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Manager ID

                <input
                  type="number"
                  min="1"
                  value={
                    form.manager ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      manager:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }))
                  }
                  disabled={isSubmitting}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Date of Birth

                <input
                  type="date"
                  value={
                    form.date_of_birth ?? ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date_of_birth:
                        event.target.value ||
                        null,
                    }))
                  }
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Emergency Contact

                <input
                  type="text"
                  value={
                    form.emergency_contact ??
                    ""
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emergency_contact:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  placeholder="Phone number"
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Address

                <textarea
                  value={form.address ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address:
                        event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Employee address"
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: "80px",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  paddingTop: "15px",
                  borderTop:
                    `1px solid ${theme.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    border:
                      `1px solid ${theme.borderSoft}`,
                    borderRadius: "7px",
                    background:
                      theme.inputBackground,
                    color: theme.textSecondary,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    height: "38px",
                    padding: "0 18px",
                    border: "none",
                    borderRadius: "7px",
                    background:
                      isSubmitting
                        ? "#647de0"
                        : "#315efb",
                    color: "#ffffff",
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
              </div>
            </form>
          </section>
  )
}

export default EmployeeForm
