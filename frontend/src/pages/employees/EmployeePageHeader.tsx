import type { CSSProperties } from "react"

import type { EmployeeSummary } from "../../api/employees"

export interface EmployeePageHeaderTheme {
  blueBackground: string
  blueText: string
  textHeading: string
  textMuted: string
  textSubtle: string
  dangerText: string
  dangerBackground: string
  dangerBorder: string
  successText: string
  successBackground: string
  successBorder: string
}

interface EmployeePageHeaderProps {
  theme: EmployeePageHeaderTheme
  cardStyle: CSSProperties
  canManageEmployees: boolean
  employeeSummary: EmployeeSummary | null
  error: string | null
  success: string | null
  onAdd: () => void
}

function EmployeePageHeader({
  theme,
  cardStyle,
  canManageEmployees,
  employeeSummary,
  error,
  success,
  onAdd,
}: EmployeePageHeaderProps) {
  return (
    <>
      <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "22px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "26px",
                padding: "0 10px",
                borderRadius: "6px",
                background: theme.blueBackground,
                color: theme.blueText,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              HR Management / Employees
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                lineHeight: 1.2,
                fontWeight: 700,
                color: theme.textHeading,
              }}
            >
              Employees
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: theme.textMuted,
                fontSize: "13px",
              }}
            >
              Manage employee information, employment details, and workforce records.
            </p>
          </div>

          {canManageEmployees && <button
            type="button"
            onClick={handleAdd}
            style={{
              height: "40px",
              padding: "0 18px",
              border: "none",
              borderRadius: "7px",
              background: "var(--app-primary)",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow:
                "0 4px 10px rgba(49, 94, 251, 0.18)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                marginRight: "7px",
                borderRadius: "4px",
                background:
                  "rgba(255, 255, 255, 0.18)",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              +
            </span>
            Add Employee
          </button>}
        </header>

        <section
          className="employees-stats"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          {[
            {
              label: "Total Employees",
              value: employeeSummary?.total ?? "—",
              description:
                "In your organization or team",
            },
            {
              label: "Active Employees",
              value: employeeSummary?.active ?? "—",
              description:
                "Currently active employees",
            },
            {
              label: "Other Status",
              value: employeeSummary
                ? employeeSummary.inactive +
                  employeeSummary.resigned +
                  employeeSummary.terminated
                : "—",
              description:
                "Inactive, resigned or terminated",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  color: theme.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "25px",
                  fontWeight: 700,
                  color: theme.textHeading,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: "5px",
                  color: theme.textSubtle,
                  fontSize: "11px",
                }}
              >
                {item.description}
              </div>
            </div>
          ))}
        </section>

        {error && (
          <div
            role="alert"
            style={{
              ...cardStyle,
              padding: "12px 15px",
              marginBottom: "16px",
              color: theme.dangerText,
              background: theme.dangerBackground,
              borderColor: theme.dangerBorder,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              ...cardStyle,
              padding: "12px 15px",
              marginBottom: "16px",
              color: theme.successText,
              background: theme.successBackground,
              borderColor: theme.successBorder,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}
    </>
  )
}

export default EmployeePageHeader
