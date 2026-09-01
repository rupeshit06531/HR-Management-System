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
        color: isDarkMode ? "#f8fafc" : "#111827",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "245px",
          minWidth: "245px",
          minHeight: "100vh",
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(8,12,18,0.96), rgba(12,17,25,0.98))"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: isDarkMode
            ? "1px solid rgba(148, 163, 184, 0.18)"
            : "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflowY: "auto",
          boxShadow:
            "inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            padding: "21px 20px 20px",
            borderBottom:
              `1px solid var(--border)`,
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
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
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  boxShadow:
                    "0 10px 20px rgba(249, 115, 22, 0.35)",
                }}
              >
                HR
              </div>

              <div>
                <div
                  style={{
                    color: isDarkMode ? "#f8fafc" : "#0f172a",
                    fontSize: "16px",
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  HR Management
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontSize: "10px",
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
            padding: "19px 12px",
            flex: 1,
          }}
        >
          <div
            style={{
              padding:
                "0 10px 9px",
              color: isDarkMode ? "#94a3b8" : "#64748b",
              fontSize: "10px",
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
              gap: "3px",
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
                    gap: "11px",
                    minHeight: "42px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    color: isActive
                      ? "#fff7ed"
                      : isDarkMode
                        ? "#cbd5e1"
                        : "#475569",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(249,115,22,0.95), rgba(234,88,12,0.9))"
                      : "transparent",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : 600,
                    boxSizing: "border-box",
                    border: isActive
                      ? "1px solid rgba(251,146,60,0.5)"
                      : "1px solid transparent",
                    boxShadow: isActive
                      ? "0 10px 20px rgba(249,115,22,0.2)"
                      : "none",
                    transition:
                      "all 0.2s ease",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          background: isActive
                            ? "rgba(249,115,22,0.14)"
                            : isDarkMode
                              ? "rgba(148,163,184,0.08)"
                              : "#f1f5f9",
                          color: isActive
                            ? "#ea580c"
                            : isDarkMode
                              ? "#cbd5e1"
                              : "#475569",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "8px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.short}
                      </span>

                      <span>
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
            padding: "13px 12px",
            borderTop:
              `1px solid var(--border)`,
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
              gap: "10px",
              padding: "10px 12px",
              border: "1px solid rgba(148,163,184,0.14)",
              borderRadius: "10px",
              background: isDarkMode
                ? "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))"
                : "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
              color: isDarkMode ? "#e2e8f0" : "#0f172a",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              fontWeight: 650,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,146,60,0.18))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 800,
                color: "#fdba74",
                border: "1px solid rgba(251,146,60,0.3)",
              }}
            >
              OUT
            </span>

            <span>
              Sign Out
            </span>
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
            minHeight: "68px",
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(11,16,23,0.96), rgba(15,23,42,0.9))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
            borderBottom: isDarkMode
              ? "1px solid rgba(148, 163, 184, 0.18)"
              : "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 25px",
            boxSizing: "border-box",
            gap: "20px",
            position: "sticky",
            top: 0,
            zIndex: 20,
            boxShadow: isDarkMode
              ? "0 10px 30px rgba(2, 6, 23, 0.18)"
              : "0 8px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 750,
                color: isDarkMode ? "#f8fafc" : "#0f172a",
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "11px",
                color: isDarkMode ? "#94a3b8" : "#64748b",
              }}
            >
              Workforce management
              platform
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 14px",
                border: isDarkMode
                  ? "1px solid rgba(249,115,22,0.9)"
                  : "1px solid #e2e8f0",
                borderRadius: "10px",
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(251,146,60,0.12))"
                  : "#ffffff",
                color: isDarkMode
                  ? "#fdba74"
                  : "#0f172a",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: isDarkMode
                  ? "0 10px 24px rgba(249,115,22,0.2)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
                transition: "all 0.25s ease",
              }}
            >
              <span aria-hidden="true">
                {isDarkMode ? "☀️" : "🌙"}
              </span>
              <span>{isDarkMode ? "Light" : "Dark"}</span>
            </button>

            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "var(--app-primary-soft)",
                border: "1px solid var(--app-border)",
                color: "var(--app-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {initials}
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--app-text)",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color: "var(--app-text-muted)",
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
            padding: "24px",
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