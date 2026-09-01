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
        background: "var(--app-bg)",
        color: "var(--text-primary)",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "245px",
          minWidth: "245px",
          minHeight: "100vh",
          background: "var(--sidebar-bg)",
          borderRight: `1px solid var(--border)`,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflowY: "auto",
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
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                HR
              </div>

              <div>
                <div
                  style={{
                    color: "#172033",
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
                    color: "#8a94a6",
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
              color: "var(--text-muted)",
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
                    padding: "7px 10px",
                    borderRadius: "8px",
                    color: isActive
                      ? "var(--primary-600)"
                      : "var(--text-secondary)",
                    background:
                      isActive
                        ? "var(--primary-50)"
                        : "transparent",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: isActive
                      ? 700
                      : 550,
                    boxSizing: "border-box",
                    transition:
                      "background 0.15s ease, color 0.15s ease",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          background:
                            isActive
                              ? "var(--primary-100)"
                              : "var(--surface-subtle)",
                          color:
                            isActive
                              ? "var(--primary-600)"
                              : "var(--text-muted)",
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
              padding: "10px",
              border:
                `1px solid var(--border)`,
              borderRadius: "8px",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              fontWeight: 650,
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "var(--surface-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 800,
                color: "var(--text-secondary)",
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
            background: "var(--header-bg)",
            borderBottom:
              `1px solid var(--border)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 25px",
            boxSizing: "border-box",
            gap: "20px",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 750,
                color: "var(--text-primary)",
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "11px",
                color: "var(--text-muted)",
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
                  ? "2px solid var(--app-primary)"
                  : "1px solid var(--app-border)",
                borderRadius: "10px",
                background: isDarkMode
                  ? "rgba(234, 88, 12, 0.12)"
                  : "var(--app-surface)",
                color: isDarkMode
                  ? "var(--app-primary)"
                  : "var(--app-text-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: isDarkMode
                  ? "0 6px 18px rgba(234, 88, 12, 0.15)"
                  : "none",
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