import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"

import { getDashboard } from "../api/dashboard"
import { useAuth } from "../context/AuthContext"

interface ModuleItem {
  label: string
  path: string
  roles: string[]
  icon: string
}

const moduleItems: ModuleItem[] = [
  {
    label: "Employees",
    path: "/employees",
    roles: ["SUPER_ADMIN", "HR", "MANAGER"],
    icon: "EMP",
  },
  {
    label: "Departments",
    path: "/departments",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "DEP",
  },
  {
    label: "Attendance",
    path: "/attendance",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "ATT",
  },
  {
    label: "Leave",
    path: "/leave",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "LEV",
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "EMPLOYEE",
    ],
    icon: "PAY",
  },
  {
    label: "Performance",
    path: "/performance",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "PER",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "REC",
  },
  {
    label: "Documents",
    path: "/documents",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "DOC",
  },
  {
    label: "Announcements",
    path: "/announcements",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "ANN",
  },
  {
    label: "Holidays",
    path: "/holidays",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    icon: "HOL",
  },
]

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

function Dashboard() {
  const navigate = useNavigate()

  const {
    user,
    isLoading: authLoading,
  } = useAuth()

  const [dashboard, setDashboard] =
    useState<Awaited<
      ReturnType<typeof getDashboard>
    > | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getDashboard()

      setDashboard(data)
    } catch (requestError) {
      console.error(
        "Failed to load dashboard:",
        requestError,
      )

      setError(
        "Unable to load dashboard data. Please refresh the page.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      void loadDashboard()
    }
  }, [authLoading, user])

  const visibleModules = useMemo(() => {
    if (!user) {
      return []
    }

    return moduleItems.filter((item) =>
      item.roles.includes(user.role),
    )
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f8fc",
          color: "#64748b",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              margin: "0 auto 12px",
              animation:
                "dashboardSpin 0.8s linear infinite",
            }}
          />

          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Loading dashboard...
          </div>
        </div>

        <style>
          {`
            @keyframes dashboardSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName =
    user.first_name?.trim() ||
    user.username

  const currentRole =
    roleLabels[user.role] ||
    user.role

  const employeeMetrics =
    dashboard?.employees

  const userMetrics =
    dashboard?.users

  const employeeProfile =
    dashboard?.employee

  const totalEmployees =
    employeeMetrics?.total ?? 0

  const activeEmployees =
    employeeMetrics?.active ?? 0

  const inactiveEmployees =
    employeeMetrics?.inactive ?? 0

  const resignedEmployees =
    employeeMetrics?.resigned ?? 0

  const terminatedEmployees =
    employeeMetrics?.terminated ?? 0

  const totalUsers =
    userMetrics?.total ?? 0

  const activePercentage =
    totalEmployees > 0
      ? Math.round(
          (activeEmployees /
            totalEmployees) *
            100,
        )
      : 0

  const inactivePercentage =
    totalEmployees > 0
      ? Math.round(
          (inactiveEmployees /
            totalEmployees) *
            100,
        )
      : 0

  const resignedPercentage =
    totalEmployees > 0
      ? Math.round(
          (resignedEmployees /
            totalEmployees) *
            100,
        )
      : 0

  const terminatedPercentage =
    totalEmployees > 0
      ? Math.round(
          (terminatedEmployees /
            totalEmployees) *
            100,
        )
      : 0

  const roleDistribution = Object.entries(
    userMetrics?.roles ?? {},
  )

  const getRoleLabel = (role: string) =>
    roleLabels[role] || role

  const getRolePercentage = (count: number) =>
    totalUsers > 0
      ? Math.round(
          (count / totalUsers) * 100,
        )
      : 0

  const quickActionLabels = [
    "Employees",
    "Departments",
    "Attendance",
    "Leave",
    "Payroll",
    "Recruitment",
  ]

  const quickActions = visibleModules.filter(
    (item) =>
      quickActionLabels.includes(item.label),
  )

  const workforceStatuses = [
    {
      label: "Active",
      value: activeEmployees,
      percentage: activePercentage,
      short: "ACT",
      background: "#eff6ff",
      color: "#2563eb",
    },
    {
      label: "Inactive",
      value: inactiveEmployees,
      percentage: inactivePercentage,
      short: "INA",
      background: "#fffbeb",
      color: "#d97706",
    },
    {
      label: "Resigned",
      value: resignedEmployees,
      percentage: resignedPercentage,
      short: "RES",
      background: "#f5f3ff",
      color: "#7c3aed",
    },
    {
      label: "Terminated",
      value: terminatedEmployees,
      percentage: terminatedPercentage,
      short: "TER",
      background: "#fff1f2",
      color: "#e11d48",
    },
  ]

  if (
    user.role === "EMPLOYEE" ||
    user.role === "MANAGER"
  ) {
    const isEmployee = user.role === "EMPLOYEE"

    const personalName =
      employeeProfile?.full_name?.trim() ||
      displayName

    const initials =
      personalName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) =>
          part.charAt(0).toUpperCase(),
        )
        .join("") ||
      "U"

    const personalModules =
      visibleModules.filter((item) =>
        [
          "Attendance",
          "Leave",
          "Payroll",
          "Performance",
          "Documents",
          "Announcements",
          "Holidays",
        ].includes(item.label),
      )

    const personalCards = [
      {
        label: "Employee ID",
        value:
          employeeProfile?.employee_id ||
          "Not available",
        short: "ID",
        background: "#eff6ff",
        color: "#2563eb",
      },
      {
        label: "Department",
        value:
          employeeProfile?.department ||
          "Not assigned",
        short: "DEP",
        background: "#f0fdf4",
        color: "#16a34a",
      },
      {
        label: "Designation",
        value:
          employeeProfile?.designation ||
          "Not assigned",
        short: "DES",
        background: "#f5f3ff",
        color: "#7c3aed",
      },
      {
        label: "Employment Status",
        value:
          employeeProfile?.employment_status ||
          "Not available",
        short: "STS",
        background: "#fff7ed",
        color: "#ea580c",
      },
    ]

    return (
      <div
        style={{
          minHeight: "100%",
          background: "#f6f8fc",
          padding: "26px",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
          color: "#172033",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "9px",
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <span
                style={{
                  color: "#2563eb",
                }}
              >
                {isEmployee
                  ? "Employee"
                  : "Manager"}
              </span>

              <span
                style={{
                  color: "#cbd5e1",
                }}
              >
                /
              </span>

              <span>
                Dashboard
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "27px",
                lineHeight: 1.2,
                fontWeight: 750,
                letterSpacing: "-0.025em",
                color: "#172033",
              }}
            >
              Welcome back, {personalName}
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "#7c8798",
              }}
            >
              {isEmployee
                ? "Here's your personal HR workspace."
                : "Here's an overview of your team and HR workspace."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => void loadDashboard()}
              style={{
                border: "1px solid #dce3ed",
                background: "#ffffff",
                color: "#475569",
                borderRadius: "8px",
                padding: "9px 13px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: "190px",
                padding: "9px 12px",
                background: "#ffffff",
                border: "1px solid #e5eaf1",
                borderRadius: "9px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {initials}
              </div>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    marginBottom: "2px",
                    fontSize: "9px",
                    color: "#94a3b8",
                  }}
                >
                  Current role
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#334155",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentRole}
                </div>
              </div>

              <span
                title="System operational"
                style={{
                  width: "7px",
                  height: "7px",
                  marginLeft: "auto",
                  borderRadius: "50%",
                  background: "#22c55e",
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        </header>

        {error && (
          <section
            style={{
              marginBottom: "18px",
              padding: "11px 14px",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              background: "#fff5f5",
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {error}
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(205px, 1fr))",
            gap: "13px",
            marginBottom: "18px",
          }}
        >
          {personalCards.map((card) => (
            <article
              key={card.label}
              style={{
                position: "relative",
                minHeight: "124px",
                padding: "17px 18px 16px 20px",
                background: "#ffffff",
                border: "1px solid #e5eaf1",
                borderRadius: "10px",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "3px",
                  background: card.color,
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      marginBottom: "9px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#7c8798",
                    }}
                  >
                    {card.label}
                  </div>

                  <div
                    style={{
                      fontSize: "16px",
                      lineHeight: 1.25,
                      fontWeight: 750,
                      color: "#172033",
                      wordBreak: "break-word",
                    }}
                  >
                    {card.value}
                  </div>
                </div>

                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: card.background,
                    color: card.color,
                    fontSize: "9px",
                    fontWeight: 800,
                  }}
                >
                  {card.short}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
            gap: "16px",
            marginBottom: "18px",
          }}
        >
          <article
            style={{
              minWidth: 0,
              padding: "20px",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "10px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "17px",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: 750,
                    color: "#172033",
                  }}
                >
                  {personalName}
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "10px",
                    color: "#8a94a6",
                  }}
                >
                  {employeeProfile?.email ||
                    user.username}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  border: "1px solid #edf0f5",
                }}
              >
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#94a3b8",
                  }}
                >
                  Employment Type
                </div>

                <strong
                  style={{
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  {employeeProfile?.employment_type ||
                    "Not available"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  border: "1px solid #edf0f5",
                }}
              >
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#94a3b8",
                  }}
                >
                  Joining Date
                </div>

                <strong
                  style={{
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  {employeeProfile?.joining_date ||
                    "Not available"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  border: "1px solid #edf0f5",
                }}
              >
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#94a3b8",
                  }}
                >
                  Manager
                </div>

                <strong
                  style={{
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  {employeeProfile?.manager ||
                    "Not assigned"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  border: "1px solid #edf0f5",
                }}
              >
                <div
                  style={{
                    marginBottom: "5px",
                    fontSize: "9px",
                    color: "#94a3b8",
                  }}
                >
                  Status
                </div>

                <strong
                  style={{
                    fontSize: "11px",
                    color:
                      employeeProfile?.employment_status ===
                      "Active"
                        ? "#16a34a"
                        : "#d97706",
                  }}
                >
                  {employeeProfile?.employment_status ||
                    "Not available"}
                </strong>
              </div>
            </div>
          </article>

          <article
            style={{
              minWidth: 0,
              padding: "20px",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "10px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                marginBottom: "17px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                {isEmployee
                  ? "My HR Modules"
                  : "Team HR Modules"}
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "10px",
                  color: "#8a94a6",
                }}
              >
                Quick access to available HR functions
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "9px",
              }}
            >
              {personalModules.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    navigate(item.path)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minHeight: "52px",
                    padding: "8px",
                    border: "1px solid #e7ebf2",
                    borderRadius: "8px",
                    background: "#fafbfc",
                    cursor: "pointer",
                    textAlign: "left",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "7px",
                      fontWeight: 800,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "7px",
                        color: "#94a3b8",
                      }}
                    >
                      Open module
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </article>
        </section>

        {!isEmployee && (
          <section
            style={{
              marginBottom: "18px",
            }}
          >
            <article
              style={{
                padding: "20px",
                background: "#ffffff",
                border: "1px solid #e5eaf1",
                borderRadius: "10px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  marginBottom: "17px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 750,
                    color: "#172033",
                  }}
                >
                  Team Overview
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "10px",
                    color: "#8a94a6",
                  }}
                >
                  Current employee status within your team
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                {workforceStatuses.map(
                  (status) => (
                    <div
                      key={status.label}
                      style={{
                        padding: "13px",
                        borderRadius: "8px",
                        background:
                          status.background,
                        border: `1px solid ${status.background}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: status.color,
                        }}
                      >
                        {status.short}
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "7px",
                          fontSize: "22px",
                          lineHeight: 1,
                          color: "#172033",
                        }}
                      >
                        {status.value}
                      </strong>

                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "8px",
                          color: "#64748b",
                        }}
                      >
                        {status.label}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </article>
          </section>
        )}

        <section
          style={{
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                Available Modules
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "10px",
                  color: "#8a94a6",
                }}
              >
                Modules available for your current role
              </p>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: "6px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "9px",
                fontWeight: 700,
              }}
            >
              {visibleModules.length} Available
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(185px, 1fr))",
              gap: "10px",
            }}
          >
            {visibleModules.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() =>
                  navigate(item.path)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  width: "100%",
                  minHeight: "63px",
                  padding: "10px 12px",
                  border: "1px solid #e7ebf2",
                  borderRadius: "8px",
                  background: "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(-2px)"
                  event.currentTarget.style.borderColor =
                    "#bfdbfe"
                  event.currentTarget.style.background =
                    "#f8fbff"
                  event.currentTarget.style.boxShadow =
                    "0 5px 14px rgba(15, 23, 42, 0.06)"
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(0)"
                  event.currentTarget.style.borderColor =
                    "#e7ebf2"
                  event.currentTarget.style.background =
                    "#ffffff"
                  event.currentTarget.style.boxShadow =
                    "none"
                }}
              >
                <div
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "7px",
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#334155",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>

                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "8px",
                      color: "#94a3b8",
                    }}
                  >
                    Open module
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            marginTop: "16px",
            padding: "12px 15px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "9px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#7c8798",
            }}
          >
            Signed in as{" "}
            <strong
              style={{
                color: "#334155",
              }}
            >
              {personalName}
            </strong>
          </div>

          <div
            style={{
              padding: "5px 9px",
              borderRadius: "6px",
              background: "#f1f5f9",
              color: "#475569",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            {currentRole}
          </div>
        </section>
      </div>
    )
  }

  const kpiCards = [
    {
      label: "Total Employees",
      value: totalEmployees,
      description: "All employee records",
      short: "EMP",
      color: "#2563eb",
      background: "#eff6ff",
      border: "#dbeafe",
      trend: "Workforce",
    },
    {
      label: "Active Employees",
      value: activeEmployees,
      description: `${activePercentage}% of total workforce`,
      short: "ACT",
      color: "#16a34a",
      background: "#f0fdf4",
      border: "#dcfce7",
      trend: "Active",
    },
    {
      label: "Inactive Employees",
      value: inactiveEmployees,
      description: `${inactivePercentage}% of total workforce`,
      short: "INA",
      color: "#d97706",
      background: "#fffbeb",
      border: "#fef3c7",
      trend: "Inactive",
    },
    {
      label: "Total Users",
      value: totalUsers,
      description: "Registered system users",
      short: "USR",
      color: "#7c3aed",
      background: "#f5f3ff",
      border: "#ede9fe",
      trend: "System",
    },
  ]

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f6f8fc",
        padding: "26px",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: "#172033",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "9px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                color: "#2563eb",
              }}
            >
              Admin
            </span>

            <span
              style={{
                color: "#cbd5e1",
              }}
            >
              /
            </span>

            <span>
              Dashboard
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "27px",
              lineHeight: 1.2,
              fontWeight: 750,
              letterSpacing: "-0.025em",
              color: "#172033",
            }}
          >
            Welcome back, {displayName}
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "#7c8798",
            }}
          >
            Here's an overview of your HR management system.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => void loadDashboard()}
            style={{
              border: "1px solid #dce3ed",
              background: "#ffffff",
              color: "#475569",
              borderRadius: "8px",
              padding: "9px 13px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "190px",
              padding: "9px 12px",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "9px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {displayName
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  marginBottom: "2px",
                  fontSize: "9px",
                  color: "#94a3b8",
                }}
              >
                Current role
              </div>

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#334155",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentRole}
              </div>
            </div>

            <span
              title="System operational"
              style={{
                width: "7px",
                height: "7px",
                marginLeft: "auto",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </header>

      {error && (
        <section
          style={{
            marginBottom: "18px",
            padding: "11px 14px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            background: "#fff5f5",
            color: "#b91c1c",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {error}
        </section>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(205px, 1fr))",
          gap: "13px",
          marginBottom: "18px",
        }}
      >
        {kpiCards.map((card) => (
          <article
            key={card.label}
            style={{
              position: "relative",
              minHeight: "124px",
              padding: "17px 18px 16px 20px",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "10px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "3px",
                background: card.color,
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: "9px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#7c8798",
                  }}
                >
                  {card.label}
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    lineHeight: 1,
                    fontWeight: 750,
                    letterSpacing: "-0.03em",
                    color: "#172033",
                  }}
                >
                  {card.value}
                </div>

                <div
                  style={{
                    marginTop: "9px",
                    fontSize: "9px",
                    color: "#9aa4b2",
                  }}
                >
                  {card.description}
                </div>
              </div>

              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: card.background,
                  border: `1px solid ${card.border}`,
                  color: card.color,
                  fontSize: "9px",
                  fontWeight: 800,
                }}
              >
                {card.short}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.45fr) minmax(310px, 0.9fr)",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <article
          style={{
            minWidth: 0,
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
              marginBottom: "21px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "5px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 750,
                    color: "#172033",
                  }}
                >
                  Workforce Overview
                </h2>

                <span
                  style={{
                    padding: "3px 7px",
                    borderRadius: "5px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                  }}
                >
                  LIVE
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "#8a94a6",
                }}
              >
                Current employee status across the organization
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/employees")}
              style={{
                border: "1px solid #dbe3ef",
                background: "#ffffff",
                color: "#2563eb",
                borderRadius: "7px",
                padding: "7px 10px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View Employees
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(145px, 0.72fr) minmax(220px, 1fr)",
              gap: "30px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "136px",
                  height: "136px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `conic-gradient(
                    #2563eb 0% ${activePercentage}%,
                    #e9eef5 ${activePercentage}% 100%
                  )`,
                }}
              >
                <div
                  style={{
                    width: "98px",
                    height: "98px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    background: "#ffffff",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "25px",
                      lineHeight: 1,
                      fontWeight: 750,
                      color: "#172033",
                    }}
                  >
                    {activePercentage}%
                  </strong>

                  <span
                    style={{
                      marginTop: "6px",
                      fontSize: "9px",
                      color: "#8a94a6",
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div>
              {workforceStatuses.map(
                (status, index) => (
                  <div
                    key={status.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      padding: "10px 0",
                      borderBottom:
                        index <
                        workforceStatuses.length - 1
                          ? "1px solid #edf0f5"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          background:
                            status.color,
                        }}
                      />

                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#94a3b8",
                        }}
                      >
                        {status.percentage}%
                      </span>

                      <strong
                        style={{
                          minWidth: "24px",
                          textAlign: "right",
                          fontSize: "12px",
                          color: status.color,
                        }}
                      >
                        {status.value}
                      </strong>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </article>

        <article
          style={{
            minWidth: 0,
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              marginBottom: "17px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              User Distribution
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "10px",
                color: "#8a94a6",
              }}
            >
              System users grouped by role
            </p>
          </div>

          {roleDistribution.length > 0 ? (
            <div>
              {roleDistribution.map(
                ([role, count], index) => {
                  const percentage =
                    getRolePercentage(count)

                  return (
                    <div
                      key={role}
                      style={{
                        padding:
                          index === 0
                            ? "2px 0 10px"
                            : "10px 0",
                        borderBottom:
                          index <
                          roleDistribution.length - 1
                            ? "1px solid #edf0f5"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          marginBottom: "7px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {getRoleLabel(role)}
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                            color: "#172033",
                          }}
                        >
                          {count}
                        </strong>
                      </div>

                      <div
                        style={{
                          height: "5px",
                          overflow: "hidden",
                          borderRadius: "10px",
                          background: "#edf1f6",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            borderRadius: "10px",
                            background: "#2563eb",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          textAlign: "right",
                          fontSize: "8px",
                          color: "#94a3b8",
                        }}
                      >
                        {percentage}%
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "25px 10px",
                textAlign: "center",
                border: "1px dashed #dbe3ef",
                borderRadius: "7px",
                color: "#94a3b8",
                fontSize: "10px",
              }}
            >
              No user distribution data available.
            </div>
          )}
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.3fr) minmax(270px, 0.7fr)",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <article
          style={{
            minWidth: 0,
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              marginBottom: "17px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              Quick Actions
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "10px",
                color: "#8a94a6",
              }}
            >
              Frequently used HR management functions
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {quickActions.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() =>
                  navigate(item.path)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minHeight: "64px",
                  padding: "10px",
                  border: "1px solid #e7ebf2",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  cursor: "pointer",
                  textAlign: "left",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "8px",
                      color: "#94a3b8",
                    }}
                  >
                    Open module
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article
          style={{
            minWidth: 0,
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              marginBottom: "17px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              Workforce Actions
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "10px",
                color: "#8a94a6",
              }}
            >
              Employee lifecycle overview
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            {workforceStatuses.map(
              (status) => (
                <div
                  key={status.label}
                  style={{
                    padding: "11px",
                    borderRadius: "8px",
                    background:
                      status.background,
                    border: `1px solid ${status.background}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                      marginBottom: "7px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        color: status.color,
                      }}
                    >
                      {status.short}
                    </span>

                    <span
                      style={{
                        fontSize: "8px",
                        color: "#94a3b8",
                      }}
                    >
                      {status.percentage}%
                    </span>
                  </div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: "21px",
                      lineHeight: 1,
                      fontWeight: 750,
                      color: "#172033",
                    }}
                  >
                    {status.value}
                  </strong>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "8px",
                      color: "#64748b",
                    }}
                  >
                    {status.label}
                  </div>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section
        style={{
          padding: "20px",
          background: "#ffffff",
          border: "1px solid #e5eaf1",
          borderRadius: "10px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "15px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "5px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                HRMS Modules
              </h2>

              <span
                style={{
                  padding: "3px 7px",
                  borderRadius: "5px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  fontSize: "8px",
                  fontWeight: 800,
                }}
              >
                MODULES
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#8a94a6",
              }}
            >
              Access the HR management modules available for your role
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: "6px",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            {visibleModules.length} Available
          </span>
        </div>

        {visibleModules.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(185px, 1fr))",
              gap: "10px",
            }}
          >
            {visibleModules.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() =>
                  navigate(item.path)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  width: "100%",
                  minHeight: "63px",
                  padding: "10px 12px",
                  border: "1px solid #e7ebf2",
                  borderRadius: "8px",
                  background: "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(-2px)"
                  event.currentTarget.style.borderColor =
                    "#bfdbfe"
                  event.currentTarget.style.background =
                    "#f8fbff"
                  event.currentTarget.style.boxShadow =
                    "0 5px 14px rgba(15, 23, 42, 0.06)"
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(0)"
                  event.currentTarget.style.borderColor =
                    "#e7ebf2"
                  event.currentTarget.style.background =
                    "#ffffff"
                  event.currentTarget.style.boxShadow =
                    "none"
                }}
              >
                <div
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "7px",
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#334155",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>

                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "8px",
                      color: "#94a3b8",
                    }}
                  >
                    Open module
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "28px 15px",
              textAlign: "center",
              border: "1px dashed #dbe3ef",
              borderRadius: "8px",
              background: "#fafbfc",
              color: "#8a94a6",
              fontSize: "11px",
            }}
          >
            No modules are available for your current role.
          </div>
        )}
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
          marginTop: "16px",
          padding: "12px 15px",
          background: "#ffffff",
          border: "1px solid #e5eaf1",
          borderRadius: "9px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "#7c8798",
          }}
        >
          Signed in as{" "}
          <strong
            style={{
              color: "#334155",
            }}
          >
            {displayName}
          </strong>
        </div>

        <div
          style={{
            padding: "5px 9px",
            borderRadius: "6px",
            background: "#f1f5f9",
            color: "#475569",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          {currentRole}
        </div>
      </section>
    </div>
  )
}

export default Dashboard