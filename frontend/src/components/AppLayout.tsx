import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"

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
        background: "#f5f7fb",
        color: "#172033",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "245px",
          minWidth: "245px",
          minHeight: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #e7ebf2",
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
              "1px solid #edf0f5",
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
              color: "#a0a8b5",
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
                      ? "#2563eb"
                      : "#5e697a",
                    background:
                      isActive
                        ? "#eff6ff"
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
                              ? "#dbeafe"
                              : "#f3f5f8",
                          color:
                            isActive
                              ? "#2563eb"
                              : "#7c8798",
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
              "1px solid #edf0f5",
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
                "1px solid #e7ebf2",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#64748b",
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
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 800,
                color: "#64748b",
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
            background: "#ffffff",
            borderBottom:
              "1px solid #e7ebf2",
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
                color: "#172033",
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "11px",
                color: "#8a94a6",
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
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "#eff6ff",
                border:
                  "1px solid #dbeafe",
                color: "#2563eb",
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
                  color: "#334155",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color: "#8a94a6",
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