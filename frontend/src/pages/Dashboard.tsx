import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface MenuItem {
  label: string
  path: string
  roles: string[]
}

const menuItems: MenuItem[] = [
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
    label: "Announcements",
    path: "/announcements",
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
  
]

function Dashboard() {
  const navigate = useNavigate()

  const {
    user,
    logout,
    isLoading,
  } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", {
        replace: true,
      })
    }
  }, [
    isLoading,
    user,
    navigate,
  ])

  const handleLogout = async () => {
    await logout()

    navigate("/login", {
      replace: true,
    })
  }

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return null
  }

  const visibleMenuItems =
    menuItems.filter((item) =>
      item.roles.includes(user.role),
    )

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f7fa",
      }}
    >
      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          backgroundColor: "#1f2937",
          color: "#ffffff",
          padding: "24px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            HRMS
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            HR Management System
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {visibleMenuItems.map(
            (item) => (
              <button
                key={item.path}
                type="button"
                onClick={() =>
                  navigate(item.path)
                }
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor:
                    item.path === "/dashboard"
                      ? "#374151"
                      : "transparent",
                  color: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={() =>
            void handleLogout()
          }
          style={{
            width: "100%",
            marginTop: "32px",
            padding: "11px 12px",
            border: "1px solid #6b7280",
            borderRadius: "6px",
            backgroundColor: "transparent",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Logout
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "32px",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#111827",
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#6b7280",
            }}
          >
            Welcome,{" "}
            <strong>
              {user.first_name ||
                user.username}
            </strong>
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Role
            </p>

            <h3
              style={{
                margin: "8px 0 0",
                color: "#111827",
              }}
            >
              {user.role}
            </h3>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Username
            </p>

            <h3
              style={{
                margin: "8px 0 0",
                color: "#111827",
              }}
            >
              {user.username}
            </h3>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Email
            </p>

            <h3
              style={{
                margin: "8px 0 0",
                color: "#111827",
                fontSize: "16px",
                wordBreak: "break-word",
              }}
            >
              {user.email ||
                "Not available"}
            </h3>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              User ID
            </p>

            <h3
              style={{
                margin: "8px 0 0",
                color: "#111827",
              }}
            >
              {user.id}
            </h3>
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "24px",
            boxShadow:
              "0 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            HRMS Modules
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "20px",
            }}
          >
            Select an available module
            from the options below.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {visibleMenuItems
              .filter(
                (item) =>
                  item.path !==
                  "/dashboard",
              )
              .map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    navigate(item.path)
                  }
                  style={{
                    padding: "16px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor:
                      "#f9fafb",
                    color: "#111827",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </button>
              ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard