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
  },
  {
    label: "Employees",
    path: "/employees",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
    ],
  },
  {
    label: "Departments",
    path: "/departments",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
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
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "EMPLOYEE",
    ],
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
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
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
  },
]

function AppLayout() {
  const navigate = useNavigate()

  const {
    user,
    logout,
  } = useAuth()

  const handleLogout = async () => {
    await logout()

    navigate("/login", {
      replace: true,
    })
  }

  const visibleNavigationItems =
    navigationItems.filter(
      (item) =>
        !user ||
        item.roles.includes(user.role),
    )

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f5f7fb",
        color: "#172033",
        fontFamily:
          "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <aside
        style={{
          width: "250px",
          minHeight: "100vh",
          background: "#111827",
          color: "#ffffff",
          padding: "24px 16px",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
        }}
      >
        <div
          style={{
            padding: "4px 12px 24px",
            borderBottom:
              "1px solid rgba(255,255,255,0.1)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.3px",
            }}
          >
            HR Management
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            Enterprise HRMS
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {visibleNavigationItems.map(
            (item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({
                  isActive,
                }) => ({
                  display: "block",
                  padding: "11px 12px",
                  borderRadius: "8px",
                  color: isActive
                    ? "#ffffff"
                    : "#cbd5e1",
                  background: isActive
                    ? "#2563eb"
                    : "transparent",
                  textDecoration:
                    "none",
                  fontSize: "14px",
                  fontWeight: isActive
                    ? 700
                    : 500,
                  transition:
                    "background 0.15s ease, color 0.15s ease",
                })}
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
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
            height: "72px",
            background: "#ffffff",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            padding: "0 28px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "3px",
                fontSize: "12px",
                color: "#6b7280",
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
              gap: "14px",
            }}
          >
            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {user?.first_name ||
                  user?.username ||
                  "User"}
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                {user?.role ||
                  "EMPLOYEE"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleLogout()
              }}
              style={{
                border:
                  "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                borderRadius: "7px",
                padding: "8px 13px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "28px",
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