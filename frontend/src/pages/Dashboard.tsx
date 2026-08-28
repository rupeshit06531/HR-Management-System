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

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getDashboard()

        if (isMounted) {
          setDashboard(data)
        }
      } catch (requestError) {
        console.error(
          "Failed to load dashboard:",
          requestError,
        )

        if (isMounted) {
          setError(
            "Unable to load dashboard data. Please refresh the page.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading && user) {
      void loadDashboard()
    }

    return () => {
      isMounted = false
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
          background: "#f5f7fb",
          color: "#64748b",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
          fontSize: "14px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f5f7fb",
        padding: "24px",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: "#172033",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "22px",
          padding: "2px 0",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              minHeight: "26px",
              padding: "0 10px",
              borderRadius: "6px",
              background: "#eef3ff",
              color: "#315efb",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            <span>Dashboard</span>

            <span
              style={{
                color: "#9db5f5",
              }}
            >
              /
            </span>

            <span>Overview</span>
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
            Here's what's happening with your organization today.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            background: "#ffffff",
            border: "1px solid #e7ebf2",
            borderRadius: "10px",
            padding: "10px 14px",
            minWidth: "205px",
            boxSizing: "border-box",
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
              flexShrink: 0,
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
                fontSize: "11px",
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
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentRole}
            </div>
          </div>

          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#22c55e",
              marginLeft: "auto",
              flexShrink: 0,
            }}
            title="System operational"
          />
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
        {[
          {
            label: "Total Employees",
            value: totalEmployees,
            short: "TE",
            description: "All employee records",
            color: "#2563eb",
            background: "#eff6ff",
            border: "#dbeafe",
          },
          {
            label: "Active Employees",
            value: activeEmployees,
            short: "AE",
            description: "Currently active",
            color: "#16a34a",
            background: "#f0fdf4",
            border: "#dcfce7",
          },
          {
            label: "Inactive Employees",
            value: inactiveEmployees,
            short: "IE",
            description: "Not currently active",
            color: "#d97706",
            background: "#fffbeb",
            border: "#fef3c7",
          },
          {
            label: "Total Users",
            value: totalUsers,
            short: "TU",
            description: "Registered system users",
            color: "#7c3aed",
            background: "#f5f3ff",
            border: "#ede9fe",
          },
        ].map((card) => (
          <article
            key={card.label}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid #e6eaf0",
              borderRadius: "10px",
              padding: "17px 18px",
              minHeight: "116px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "4px",
                height: "100%",
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
                    fontSize: "11px",
                    color: "#7c8798",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  {card.label}
                </div>

                <div
                  style={{
                    fontSize: "27px",
                    lineHeight: 1,
                    color: "#172033",
                    fontWeight: 750,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {card.value}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "10px",
                    color: "#9aa4b2",
                  }}
                >
                  {card.description}
                </div>
              </div>

              <div
                style={{
                  width: "39px",
                  height: "39px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.background,
                  border: `1px solid ${card.border}`,
                  color: card.color,
                  fontSize: "10px",
                  fontWeight: 800,
                  flexShrink: 0,
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
            "minmax(0, 1.5fr) minmax(280px, 1fr)",
          gap: "18px",
          marginBottom: "20px",
        }}
      >
        <article
          style={{
            background: "#ffffff",
            border: "1px solid #e7ebf2",
            borderRadius: "11px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
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
                  fontSize: "12px",
                  color: "#8a94a6",
                }}
              >
                Current employee status
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
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              View Employees
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "26px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "125px",
                height: "125px",
                borderRadius: "50%",
                background: `conic-gradient(
                  #2563eb 0% ${activePercentage}%,
                  #e8edf5 ${activePercentage}% 100%
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "91px",
                  height: "91px",
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
                    fontSize: "24px",
                    color: "#172033",
                  }}
                >
                  {activePercentage}%
                </strong>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#8a94a6",
                  }}
                >
                  Active
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "220px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "13px",
                  borderBottom:
                    "1px solid #edf0f5",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Total Employees
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#172033",
                  }}
                >
                  {totalEmployees}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "13px 0",
                  borderBottom:
                    "1px solid #edf0f5",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Active Employees
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#16a34a",
                  }}
                >
                  {activeEmployees}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "13px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Inactive Employees
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#f59e0b",
                  }}
                >
                  {inactiveEmployees}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article
          style={{
            background: "#ffffff",
            border: "1px solid #e7ebf2",
            borderRadius: "11px",
            padding: "20px",
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
              margin: "5px 0 17px",
              fontSize: "12px",
              color: "#8a94a6",
            }}
          >
            Frequently used HR functions
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {visibleModules
              .filter((item) =>
                [
                  "Employees",
                  "Attendance",
                  "Leave",
                  "Payroll",
                ].includes(item.label),
              )
              .map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    navigate(item.path)
                  }
                  style={{
                    border:
                      "1px solid #e7ebf2",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "12px 10px",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#334155",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "7px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "9px",
                      fontWeight: 800,
                      marginBottom: "7px",
                    }}
                  >
                    {item.icon}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </div>
                </button>
              ))}
          </div>
        </article>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e7ebf2",
          borderRadius: "11px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
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
                fontSize: "12px",
                color: "#8a94a6",
              }}
            >
              Access modules available for your role
            </p>
          </div>

          <span
            style={{
              padding: "5px 9px",
              borderRadius: "20px",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "11px",
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
              "repeat(auto-fill, minmax(180px, 1fr))",
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
                gap: "12px",
                minHeight: "58px",
                padding: "10px 13px",
                border:
                  "1px solid #e7ebf2",
                borderRadius: "9px",
                background: "#ffffff",
                cursor: "pointer",
                textAlign: "left",
                transition:
                  "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  "translateY(-2px)"
                event.currentTarget.style.borderColor =
                  "#bfdbfe"
                event.currentTarget.style.boxShadow =
                  "0 5px 15px rgba(37,99,235,0.08)"
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
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#475569",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "3px",
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