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

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const loadDashboard = async (
    showRefreshState = false,
  ) => {
    try {
      if (showRefreshState) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

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
      setIsRefreshing(false)
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
          fontSize: "14px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              margin: "0 auto 12px",
              animation:
                "dashboardSpin 0.8s linear infinite",
            }}
          />

          Loading dashboard...
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

  const userRoleCounts =
    userMetrics?.roles ?? {}

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

  const adminStats = [
    {
      label: "Total Employees",
      value: totalEmployees,
      description: "All employee records",
      icon: "EMP",
      accent: "#2563eb",
      background: "#eff6ff",
      border: "#dbeafe",
    },
    {
      label: "Active Employees",
      value: activeEmployees,
      description: `${activePercentage}% of workforce`,
      icon: "ACT",
      accent: "#16a34a",
      background: "#f0fdf4",
      border: "#dcfce7",
    },
    {
      label: "Inactive Employees",
      value: inactiveEmployees,
      description: `${inactivePercentage}% of workforce`,
      icon: "INA",
      accent: "#d97706",
      background: "#fffbeb",
      border: "#fef3c7",
    },
    {
      label: "Total Users",
      value: totalUsers,
      description: "Registered system users",
      icon: "USR",
      accent: "#7c3aed",
      background: "#f5f3ff",
      border: "#ede9fe",
    },
  ]

  const employeeStatusStats = [
    {
      label: "Active",
      value: activeEmployees,
      percentage:
        totalEmployees > 0
          ? Math.round(
              (activeEmployees /
                totalEmployees) *
                100,
            )
          : 0,
      accent: "#16a34a",
    },
    {
      label: "Inactive",
      value: inactiveEmployees,
      percentage:
        totalEmployees > 0
          ? Math.round(
              (inactiveEmployees /
                totalEmployees) *
                100,
            )
          : 0,
      accent: "#f59e0b",
    },
    {
      label: "Resigned",
      value: resignedEmployees,
      percentage:
        totalEmployees > 0
          ? Math.round(
              (resignedEmployees /
                totalEmployees) *
                100,
            )
          : 0,
      accent: "#64748b",
    },
    {
      label: "Terminated",
      value: terminatedEmployees,
      percentage:
        totalEmployees > 0
          ? Math.round(
              (terminatedEmployees /
                totalEmployees) *
                100,
            )
          : 0,
      accent: "#dc2626",
    },
  ]

  const roleEntries = Object.entries(
    userRoleCounts,
  ).sort(([, first], [, second]) => second - first)

  const quickActions = visibleModules.filter(
    (item) =>
      [
        "Employees",
        "Departments",
        "Attendance",
        "Leave",
        "Payroll",
        "Recruitment",
      ].includes(item.label),
  )

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f6f8fc",
        padding: "24px",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: "#172033",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 9px",
              borderRadius: "6px",
              background: "#eef3ff",
              color: "#315efb",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "9px",
            }}
          >
            Admin Dashboard
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.2,
              fontWeight: 750,
              color: "#172033",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {displayName}
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "#7c8798",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Here's an overview of your HR
            management system.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "10px",
              padding: "9px 12px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {displayName
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  marginBottom: "3px",
                }}
              >
                Current role
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {currentRole}
              </div>
            </div>

            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                marginLeft: "4px",
              }}
              title="System operational"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={isRefreshing}
            style={{
              border: "1px solid #dbe3ef",
              background: "#ffffff",
              color: "#2563eb",
              borderRadius: "8px",
              padding: "10px 13px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: isRefreshing
                ? "not-allowed"
                : "pointer",
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <section
          style={{
            marginBottom: "20px",
            padding: "12px 15px",
            background: "#fff5f5",
            border: "1px solid #fecaca",
            borderRadius: "9px",
            color: "#b91c1c",
            fontSize: "13px",
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
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {adminStats.map((stat) => (
          <article
            key={stat.label}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid #e5eaf1",
              borderRadius: "11px",
              padding: "18px",
              minHeight: "125px",
              boxSizing: "border-box",
              boxShadow:
                "0 2px 8px rgba(15, 23, 42, 0.025)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "4px",
                height: "100%",
                background: stat.accent,
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
                    fontSize: "11px",
                    color: "#7c8798",
                    fontWeight: 650,
                    marginBottom: "9px",
                  }}
                >
                  {stat.label}
                </div>

                <div
                  style={{
                    fontSize: "29px",
                    lineHeight: 1,
                    color: "#172033",
                    fontWeight: 750,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {stat.value}
                </div>

                <div
                  style={{
                    marginTop: "9px",
                    fontSize: "10px",
                    color: "#9aa4b2",
                  }}
                >
                  {stat.description}
                </div>
              </div>

              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: stat.background,
                  border: `1px solid ${stat.border}`,
                  color: stat.accent,
                  fontSize: "9px",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.45fr) minmax(300px, 0.85fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <article
          style={{
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "11px",
            padding: "20px",
            minWidth: 0,
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.025)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                Workforce Overview
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "11px",
                  color: "#8a94a6",
                }}
              >
                Current employee status across the
                organization
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/employees")
              }
              style={{
                border: "1px solid #dbe3ef",
                background: "#ffffff",
                color: "#2563eb",
                borderRadius: "7px",
                padding: "7px 10px",
                fontSize: "11px",
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
                "minmax(135px, 0.7fr) minmax(220px, 1fr)",
              gap: "28px",
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
                  width: "145px",
                  height: "145px",
                  borderRadius: "50%",
                  background: `conic-gradient(
                    #2563eb 0% ${activePercentage}%,
                    #e8edf5 ${activePercentage}% 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "105px",
                    height: "105px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "27px",
                      lineHeight: 1,
                      color: "#172033",
                      fontWeight: 750,
                    }}
                  >
                    {activePercentage}%
                  </strong>

                  <span
                    style={{
                      marginTop: "6px",
                      fontSize: "10px",
                      color: "#8a94a6",
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div>
              {employeeStatusStats.map(
                (status, index) => (
                  <div
                    key={status.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                      padding: "11px 0",
                      borderBottom:
                        index <
                        employeeStatusStats.length -
                          1
                          ? "1px solid #edf0f5"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background:
                            status.accent,
                        }}
                      />

                      <span
                        style={{
                          fontSize: "12px",
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
                        gap: "9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                        }}
                      >
                        {status.percentage}%
                      </span>

                      <strong
                        style={{
                          minWidth: "25px",
                          textAlign: "right",
                          fontSize: "13px",
                          color: status.accent,
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
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "11px",
            padding: "20px",
            minWidth: 0,
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.025)",
          }}
        >
          <div style={{ marginBottom: "18px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              User Distribution
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "11px",
                color: "#8a94a6",
              }}
            >
              System users grouped by role
            </p>
          </div>

          {roleEntries.length > 0 ? (
            <div>
              {roleEntries.map(
                ([role, count], index) => {
                  const percentage =
                    totalUsers > 0
                      ? Math.round(
                          (count /
                            totalUsers) *
                            100,
                        )
                      : 0

                  return (
                    <div
                      key={role}
                      style={{
                        padding: "11px 0",
                        borderBottom:
                          index <
                          roleEntries.length - 1
                            ? "1px solid #edf0f5"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          marginBottom: "7px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                          }}
                        >
                          {roleLabels[role] ||
                            role}
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                            color: "#334155",
                          }}
                        >
                          {count}
                        </strong>
                      </div>

                      <div
                        style={{
                          height: "6px",
                          background: "#eef2f7",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background:
                              "#6366f1",
                            borderRadius:
                              "999px",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "9px",
                          color: "#94a3b8",
                          textAlign: "right",
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
                color: "#94a3b8",
                fontSize: "11px",
                border:
                  "1px dashed #dbe3ef",
                borderRadius: "8px",
              }}
            >
              No user role data available.
            </div>
          )}
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.25fr) minmax(300px, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <article
          style={{
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "11px",
            padding: "20px",
            minWidth: 0,
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.025)",
          }}
        >
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              Quick Actions
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "11px",
                color: "#8a94a6",
              }}
            >
              Frequently used HR management
              functions
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
                  minHeight: "67px",
                  padding: "10px",
                  border:
                    "1px solid #e7ebf2",
                  borderRadius: "8px",
                  background: "#fafbfc",
                  cursor: "pointer",
                  textAlign: "left",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.borderColor =
                    "#bfdbfe"
                  event.currentTarget.style.background =
                    "#f8fbff"
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor =
                    "#e7ebf2"
                  event.currentTarget.style.background =
                    "#fafbfc"
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: 800,
                    flexShrink: 0,
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
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "9px",
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
            background: "#ffffff",
            border: "1px solid #e5eaf1",
            borderRadius: "11px",
            padding: "20px",
            minWidth: 0,
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.025)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                Workforce Actions
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "11px",
                  color: "#8a94a6",
                }}
              >
                Employee lifecycle overview
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/employees")
              }
              style={{
                border: "none",
                background: "transparent",
                color: "#2563eb",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Manage
            </button>
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
                padding: "13px",
                border:
                  "1px solid #dcfce7",
                borderRadius: "8px",
                background: "#f7fff9",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "#16a34a",
                  fontWeight: 700,
                  marginBottom: "5px",
                }}
              >
                ACTIVE
              </div>

              <strong
                style={{
                  fontSize: "22px",
                  color: "#172033",
                }}
              >
                {activeEmployees}
              </strong>
            </div>

            <div
              style={{
                padding: "13px",
                border:
                  "1px solid #fef3c7",
                borderRadius: "8px",
                background: "#fffdf6",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "#d97706",
                  fontWeight: 700,
                  marginBottom: "5px",
                }}
              >
                INACTIVE
              </div>

              <strong
                style={{
                  fontSize: "22px",
                  color: "#172033",
                }}
              >
                {inactiveEmployees}
              </strong>
            </div>

            <div
              style={{
                padding: "13px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#fafbfc",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: "5px",
                }}
              >
                RESIGNED
              </div>

              <strong
                style={{
                  fontSize: "22px",
                  color: "#172033",
                }}
              >
                {resignedEmployees}
              </strong>
            </div>

            <div
              style={{
                padding: "13px",
                border:
                  "1px solid #fee2e2",
                borderRadius: "8px",
                background: "#fffafa",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "#dc2626",
                  fontWeight: 700,
                  marginBottom: "5px",
                }}
              >
                TERMINATED
              </div>

              <strong
                style={{
                  fontSize: "22px",
                  color: "#172033",
                }}
              >
                {terminatedEmployees}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5eaf1",
          borderRadius: "11px",
          padding: "20px",
          boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.025)",
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
                fontSize: "16px",
                fontWeight: 750,
                color: "#172033",
              }}
            >
              HRMS Modules
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: "11px",
                color: "#8a94a6",
              }}
            >
              Access the HR management modules
              available for your role
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
              fontSize: "10px",
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
                "repeat(auto-fill, minmax(190px, 1fr))",
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
                  minHeight: "64px",
                  padding: "10px 12px",
                  border:
                    "1px solid #e7ebf2",
                  borderRadius: "8px",
                  background: "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  boxSizing: "border-box",
                  transition:
                    "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(-2px)"
                  event.currentTarget.style.borderColor =
                    "#bfdbfe"
                  event.currentTarget.style.boxShadow =
                    "0 5px 14px rgba(15, 23, 42, 0.06)"
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(0)"
                  event.currentTarget.style.borderColor =
                    "#e7ebf2"
                  event.currentTarget.style.boxShadow =
                    "none"
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: 800,
                    flexShrink: 0,
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
                      justifyContent:
                        "space-between",
                      gap: "7px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#334155",
                        whiteSpace:
                          "nowrap",
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>

                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "14px",
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
                      fontSize: "9px",
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
              border:
                "1px dashed #dbe3ef",
              borderRadius: "8px",
              background: "#fafbfc",
              color: "#8a94a6",
              fontSize: "12px",
            }}
          >
            No modules are available for
            your current role.
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
          padding: "13px 16px",
          background: "#ffffff",
          border: "1px solid #e7ebf2",
          borderRadius: "9px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "12px",
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
            background: "#f1f5f9",
            borderRadius: "6px",
            color: "#475569",
            fontSize: "11px",
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