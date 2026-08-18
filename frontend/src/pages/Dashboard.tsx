import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface MenuItem {
  label: string
  path: string
  roles: string[]
  icon: string
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
    icon: "⌂",
  },
  {
    label: "Employees",
    path: "/employees",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
    ],
    icon: "♙",
  },
  {
    label: "Departments",
    path: "/departments",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    icon: "▦",
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
    icon: "◷",
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
    icon: "◫",
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "EMPLOYEE",
    ],
    icon: "₹",
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
    icon: "↗",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    icon: "♧",
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
    icon: "▤",
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
    icon: "◉",
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
    icon: "□",
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
  const location = useLocation()

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
          background: "#f4f7fb",
          color: "#64748b",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
        }}
      >
        Loading...
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

  const displayName =
    user.first_name ||
    user.username

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
      .trim()
      .toUpperCase() ||
    user.username
      .slice(0, 2)
      .toUpperCase()

  const currentRole =
    roleLabels[user.role] ||
    user.role

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        color: "#0f172a",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "252px",
          minHeight: "100vh",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #0f172a 0%, #172554 100%)",
          color: "#ffffff",
          padding: "24px 16px",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{
            padding:
              "4px 10px 24px",
            borderBottom:
              "1px solid rgba(255,255,255,0.10)",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #2563eb, #4f46e5)",
                boxShadow:
                  "0 8px 20px rgba(37,99,235,0.30)",
                fontSize: "19px",
                fontWeight: 800,
              }}
            >
              H
            </div>

            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing:
                    "-0.02em",
                }}
              >
                HRMS
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  letterSpacing:
                    "0.08em",
                  textTransform:
                    "uppercase",
                }}
              >
                Enterprise HR
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding:
              "0 10px 10px",
            color: "#64748b",
            fontSize: "10px",
            fontWeight: 800,
            textTransform:
              "uppercase",
            letterSpacing:
              "0.10em",
          }}
        >
          Main Menu
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {visibleMenuItems.map(
            (item) => {
              const isActive =
                location.pathname ===
                item.path

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    navigate(
                      item.path,
                    )
                  }
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding:
                      "10px 12px",
                    border:
                      "1px solid transparent",
                    borderRadius: "9px",
                    background:
                      isActive
                        ? "linear-gradient(90deg, rgba(37,99,235,0.95), rgba(79,70,229,0.90))"
                        : "transparent",
                    color: isActive
                      ? "#ffffff"
                      : "#cbd5e1",
                    boxShadow:
                      isActive
                        ? "0 8px 18px rgba(37,99,235,0.22)"
                        : "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight:
                      isActive
                        ? 700
                        : 500,
                    transition:
                      "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      width: "25px",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "7px",
                      background:
                        isActive
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(148,163,184,0.08)",
                      color: isActive
                        ? "#ffffff"
                        : "#94a3b8",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </button>
              )
            },
          )}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "18px",
          }}
        >
          <div
            style={{
              padding:
                "12px 10px",
              marginBottom: "10px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              background:
                "rgba(255,255,255,0.04)",
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
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "#dbeafe",
                  color: "#1d4ed8",
                  fontSize: "11px",
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
                    color: "#f8fafc",
                    fontSize: "12px",
                    fontWeight: 700,
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {displayName}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    color: "#94a3b8",
                    fontSize: "10px",
                  }}
                >
                  {currentRole}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            style={{
              width: "100%",
              minHeight: "42px",
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius: "9px",
              background:
                "rgba(255,255,255,0.04)",
              color: "#cbd5e1",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "30px 34px 40px",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent:
              "space-between",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 800,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.10em",
                marginBottom: "7px",
              }}
            >
              Enterprise HRMS
            </div>

            <h1
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "30px",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing:
                  "-0.03em",
              }}
            >
              Good morning,{" "}
              {displayName}
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Here is your HR
              management overview
              for today.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding:
                "9px 12px",
              background:
                "#ffffff",
              border:
                "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  "#22c55e",
                boxShadow:
                  "0 0 0 4px rgba(34,197,94,0.10)",
              }}
            />

            <span
              style={{
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              System operational
            </span>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Current Role",
              value: currentRole,
              icon: "♙",
              accent:
                "#2563eb",
            },
            {
              label: "Username",
              value: user.username,
              icon: "◉",
              accent:
                "#4f46e5",
            },
            {
              label: "Email",
              value:
                user.email ||
                "Not available",
              icon: "@",
              accent:
                "#0891b2",
            },
            {
              label: "User ID",
              value: String(
                user.id,
              ),
              icon: "#",
              accent:
                "#0f766e",
            },
          ].map((card) => (
            <article
              key={card.label}
              style={{
                position: "relative",
                overflow: "hidden",
                background:
                  "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "13px",
                padding: "19px",
                boxShadow:
                  "0 4px 14px rgba(15,23,42,0.045)",
              }}
            >
              <div
                style={{
                  position:
                    "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background:
                    card.accent,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.06em",
                    }}
                  >
                    {card.label}
                  </p>

                  <h3
                    style={{
                      margin:
                        "8px 0 0",
                      color: "#0f172a",
                      fontSize:
                        card.label ===
                        "Email"
                          ? "14px"
                          : "18px",
                      lineHeight: 1.3,
                      fontWeight: 750,
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {card.value}
                  </h3>
                </div>

                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    flexShrink: 0,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    borderRadius:
                      "9px",
                    background:
                      `${card.accent}12`,
                    color:
                      card.accent,
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          style={{
            background:
              "linear-gradient(135deg, #172554 0%, #1e3a8a 55%, #2563eb 100%)",
            borderRadius: "15px",
            padding:
              "24px 26px",
            marginBottom: "24px",
            color: "#ffffff",
            boxShadow:
              "0 12px 28px rgba(30,64,175,0.18)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              right: "-55px",
              top: "-70px",
              background:
                "rgba(255,255,255,0.07)",
            }}
          />

          <div
            style={{
              position:
                "relative",
                zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing:
                  "0.10em",
                textTransform:
                  "uppercase",
                color: "#bfdbfe",
                marginBottom: "7px",
              }}
            >
              HR Management
            </div>

            <h2
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "21px",
                fontWeight: 750,
              }}
            >
              Manage your workforce
              from one place.
            </h2>

            <p
              style={{
                margin:
                  "7px 0 0",
                color: "#dbeafe",
                fontSize: "13px",
                maxWidth:
                  "620px",
              }}
            >
              Access employees,
              attendance, leave,
              payroll, performance
              and recruitment
              modules based on your
              access level.
            </p>
          </div>
        </section>

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "23px",
            boxShadow:
              "0 4px 14px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: "15px",
              marginBottom:
                "19px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "18px",
                  fontWeight: 750,
                }}
              >
                HRMS Modules
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Quick access to
                your available
                modules.
              </p>
            </div>

            <span
              style={{
                padding:
                  "5px 9px",
                borderRadius:
                  "999px",
                background:
                  "#eff6ff",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {
                visibleMenuItems.filter(
                  (item) =>
                    item.path !==
                    "/dashboard",
                ).length
              }{" "}
              modules
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "11px",
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
                    navigate(
                      item.path,
                    )
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "11px",
                    minHeight: "60px",
                    padding:
                      "10px 12px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "10px",
                    background:
                      "#f8fafc",
                    color: "#1e293b",
                    cursor: "pointer",
                    textAlign:
                      "left",
                    fontSize: "13px",
                    fontWeight: 650,
                    transition:
                      "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      width: "34px",
                      height: "34px",
                      flexShrink: 0,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      borderRadius:
                        "9px",
                      background:
                        "#eff6ff",
                      color: "#2563eb",
                      fontSize:
                        "15px",
                      fontWeight: 800,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </span>

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize:
                        "16px",
                    }}
                  >
                    →
                  </span>
                </button>
              ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard