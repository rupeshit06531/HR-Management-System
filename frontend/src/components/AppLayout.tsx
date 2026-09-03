import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

interface NavigationItem {
  label: string
  path: string
  roles: string[]
  short: string
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "DB",
  },
  {
    label: "Change Password",
    path: "/change-password",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "CP",
  },
  {
    label: "Employees",
    path: "/employees",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
    ],
    short: "EM",
  },
  {
    label: "Departments",
    path: "/departments",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    short: "DP",
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
    short: "AT",
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
    short: "LV",
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "EMPLOYEE",
    ],
    short: "PR",
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
    short: "PF",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    short: "RC",
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
    short: "DC",
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
    short: "HD",
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
    short: "AN",
  },
]

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

function AppLayout() {
  const navigate = useNavigate()

  const {
    user,
    logout,
  } = useAuth()

  const {
    isDarkMode,
    toggleDarkMode,
  } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate("/login", {
        replace: true,
      })
    }
  }

  const visibleNavigationItems =
    navigationItems.filter((item) =>
      item.roles.includes(
        user?.role ?? "",
      ),
    )

  const displayName =
    user?.first_name?.trim() ||
    user?.username ||
    "User"

  const currentRole =
    roleLabels[user?.role ?? ""] ||
    user?.role ||
    "Employee"

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join("") || "U"

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: isDarkMode
          ? "linear-gradient(180deg, #071018 0%, #0f172a 100%)"
          : "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        color: isDarkMode
          ? "#f8fafc"
          : "#111827",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "225px",
          minWidth: "225px",
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(8,12,18,0.98), rgba(12,17,25,0.99))"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: isDarkMode
            ? "1px solid rgba(148,163,184,0.16)"
            : "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            padding: "15px 15px 14px",
            borderBottom:
              "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.03em",
                  flexShrink: 0,
                }}
              >
                HR
              </div>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    color: isDarkMode
                      ? "#f8fafc"
                      : "#0f172a",
                    fontSize: "14px",
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  HR Management
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    color: isDarkMode
                      ? "#94a3b8"
                      : "#64748b",
                    fontSize: "9px",
                    fontWeight: 500,
                  }}
                >
                  Enterprise HRMS
                </div>
              </div>
            </div>
          </button>
        </div>

        <div
          style={{
            padding: "13px 10px",
            flex: 1,
          }}
        >
          <div
            style={{
              padding: "0 9px 7px",
              color: isDarkMode
                ? "#94a3b8"
                : "#64748b",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Main Menu
          </div>

          <nav
            aria-label="Main navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {visibleNavigationItems.map(
              (item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    minHeight: "38px",
                    padding: "6px 9px",
                    borderRadius: "8px",
                    color: isActive
                      ? "#fff7ed"
                      : isDarkMode
                        ? "#cbd5e1"
                        : "#475569",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(249,115,22,0.96), rgba(234,88,12,0.92))"
                      : "transparent",
                    textDecoration: "none",
                    fontSize: "11px",
                    fontWeight: isActive
                      ? 700
                      : 600,
                    boxSizing: "border-box",
                    border: isActive
                      ? "1px solid rgba(251,146,60,0.45)"
                      : "1px solid transparent",
                    boxShadow: isActive
                      ? "0 7px 14px rgba(249,115,22,0.16)"
                      : "none",
                    transition:
                      "all 0.18s ease",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: "27px",
                          height: "27px",
                          borderRadius: "7px",
                          background: isActive
                            ? "rgba(255,255,255,0.14)"
                            : isDarkMode
                              ? "rgba(148,163,184,0.08)"
                              : "#f1f5f9",
                          color: isActive
                            ? "#ffffff"
                            : isDarkMode
                              ? "#cbd5e1"
                              : "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.short}
                      </span>

                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        <div
          style={{
            padding: "10px",
            borderTop:
              "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              void handleLogout()
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 9px",
              border:
                "1px solid rgba(148,163,184,0.14)",
              borderRadius: "8px",
              background: isDarkMode
                ? "rgba(15,23,42,0.78)"
                : "#f8fafc",
              color: isDarkMode
                ? "#e2e8f0"
                : "#0f172a",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "11px",
              fontWeight: 650,
            }}
          >
            <span
              style={{
                width: "25px",
                height: "25px",
                borderRadius: "7px",
                background:
                  "rgba(249,115,22,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: 800,
                color: isDarkMode
                  ? "#fdba74"
                  : "#ea580c",
                border:
                  "1px solid rgba(251,146,60,0.24)",
              }}
            >
              OUT
            </span>

            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            minHeight: "58px",
            background: isDarkMode
              ? "rgba(11,16,23,0.96)"
              : "rgba(255,255,255,0.98)",
            borderBottom: isDarkMode
              ? "1px solid rgba(148,163,184,0.16)"
              : "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 18px",
            boxSizing: "border-box",
            gap: "12px",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 750,
                color: isDarkMode
                  ? "#f8fafc"
                  : "#0f172a",
                lineHeight: 1.2,
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "1px",
                fontSize: "9px",
                color: isDarkMode
                  ? "#94a3b8"
                  : "#64748b",
              }}
            >
              Workforce management platform
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={toggleDarkMode}
              title={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              style={{
                minWidth: "66px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 9px",
                border: isDarkMode
                  ? "1px solid rgba(249,115,22,0.65)"
                  : "1px solid #e2e8f0",
                borderRadius: "8px",
                background: isDarkMode
                  ? "rgba(249,115,22,0.12)"
                  : "#ffffff",
                color: isDarkMode
                  ? "#fdba74"
                  : "#334155",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: "10px",
                  fontWeight: 900,
                }}
              >
                {isDarkMode ? "L" : "D"}
              </span>

              <span>
                {isDarkMode
                  ? "Light"
                  : "Dark"}
              </span>
            </button>

            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background:
                  "var(--app-primary-soft)",
                border:
                  "1px solid var(--app-border)",
                color:
                  "var(--app-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {initials}
            </div>

            <div
              style={{
                textAlign: "right",
                maxWidth: "150px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--app-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  marginTop: "1px",
                  fontSize: "9px",
                  color: "var(--app-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentRole}
              </div>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "16px",
            boxSizing: "border-box",
            overflowX: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout