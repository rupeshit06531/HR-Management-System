import type { CSSProperties } from "react"

import type { Department, Designation } from "../../api/departments"
import type { Employee } from "../../api/employees"

export interface EmployeeFiltersTheme {
  cardBackground: string
  inputBackground: string
  borderSoft: string
  textSecondary: string
  placeholder: string
}

interface EmployeeFiltersProps {
  theme: EmployeeFiltersTheme
  cardStyle: CSSProperties
  inputStyle: CSSProperties
  labelStyle: CSSProperties
  search: string
  departmentFilter: string
  designationFilter: string
  employmentTypeFilter: string
  statusFilter: string
  departments: Department[]
  designations: Designation[]
  employmentTypes: readonly string[]
  employmentStatuses: readonly string[]
  formatValue: (value: string) => string
  handleSearchChange: (value: string) => void
  handleDepartmentFilter: (value: string) => void
  setDesignationFilter: (value: string) => void
  setEmploymentTypeFilter: (value: string) => void
  setStatusFilter: (value: string) => void
  setPage: (page: number) => void
  clearFilters: () => void
  getDepartmentName?: (employee: Employee) => string
}

function EmployeeFilters({
  theme,
  cardStyle,
  inputStyle,
  labelStyle,
  search,
  departmentFilter,
  designationFilter,
  employmentTypeFilter,
  statusFilter,
  departments,
  designations,
  employmentTypes,
  employmentStatuses,
  formatValue,
  handleSearchChange,
  handleDepartmentFilter,
  setDesignationFilter,
  setEmploymentTypeFilter,
  setStatusFilter,
  setPage,
  clearFilters,
}: EmployeeFiltersProps) {
  return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2fr) repeat(4, minmax(145px, 1fr)) auto",
              gap: "10px",
              alignItems: "end",
            }}
          >
            <label style={labelStyle}>
              Search

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value,
                    )
                  }
                  placeholder="Search employee..."
                  style={{
                    ...inputStyle,
                    paddingLeft: "34px",
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "11px",
                    color: theme.placeholder,
                    fontSize: "13px",
                  }}
                >
                  Q
                </span>
              </div>
            </label>

            <label style={labelStyle}>
              Department

              <select
                value={departmentFilter}
                onChange={(event) =>
                  handleDepartmentFilter(
                    event.target.value,
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  All Departments
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
                value={designationFilter}
                onChange={(event) => {
                  setDesignationFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Designations
                </option>

                {designations
                  .filter(
                    (designation) =>
                      !departmentFilter ||
                      designation.department ===
                        Number(
                          departmentFilter,
                        ),
                  )
                  .map((designation) => (
                    <option
                      key={designation.id}
                      value={designation.id}
                    >
                      {designation.name}
                    </option>
                  ))}
              </select>
            </label>

            <label style={labelStyle}>
              Employment Type

              <select
                value={employmentTypeFilter}
                onChange={(event) => {
                  setEmploymentTypeFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Types
                </option>

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
              Status

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value,
                  )
                  setPage(1)
                }}
                style={inputStyle}
              >
                <option value="">
                  All Status
                </option>

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

            <button
              type="button"
              onClick={clearFilters}
              style={{
                height: "40px",
                padding: "0 13px",
                border:
                  `1px solid ${theme.borderSoft}`,
                borderRadius: "7px",
                background: theme.inputBackground,
                color: theme.textSecondary,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </button>
          </div>
        
  )
}

export default EmployeeFilters
