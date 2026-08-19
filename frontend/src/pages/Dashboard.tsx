import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface ModuleItem {
  label: string
  path: string
  roles: string[]
}

const moduleItems: ModuleItem[] = [
  {
    label: "Employees",
    path: "/employees",
    roles: ["SUPER_ADMIN", "HR", "MANAGER"],
  },
  {
    label: "Departments",
    path: "/departments",
    roles: ["SUPER_ADMIN", "HR"],
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
    roles: ["SUPER_ADMIN", "HR", "EMPLOYEE"],
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
    roles: ["SUPER_ADMIN", "HR"],
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

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

function Dashboard() {
  const navigate = useNavigate()

  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
          fontSize: "14px",
        }}
      >
        Loading dashboard...
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

  const visibleModules =
    moduleItems.filter((item) =>
      item.roles.includes(user.role),
    )

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
      .trim()
      .toUpperCase() ||
    user.username
      .slice(0, 2)
      .toUpperCase()

  return (
    <div
      style={{
        width: "100%",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
              textTransform: "uppercase",
              letterSpacing: "0.10em",
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
              letterSpacing: "-0.03em",
            }}
          >
            Good morning, {displayName}
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Here is your HR management overview
            for today.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
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
              background: "#22c55e",
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
            accent: "#2563eb",
          },
          {
            label: "Username",
            value: user.username,
            accent: "#4f46e5",
          },
          {
            label: "Email",
            value:
              user.email ||
              "Not available",
            accent: "#0891b2",
          },
          {
            label: "User ID",
            value: String(user.id),
            accent: "#0f766e",
          },
        ].map((card) => (
          <article
            key={card.label}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "13px",
              padding: "19px",
              boxShadow:
                "0 4px 14px rgba(15,23,42,0.045)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "4px",
                height: "100%",
                background: card.accent,
              }}
            />

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {card.label}
              </p>

              <h3
                style={{
                  margin: "8px 0 0",
                  color: "#0f172a",
                  fontSize:
                    card.label === "Email"
                      ? "14px"
                      : "18px",
                  lineHeight: 1.3,
                  fontWeight: 750,
                  wordBreak: "break-word",
                }}
              >
                {card.value}
              </h3>
            </div>
          </article>
        ))}
      </section>

      <section
        style={{
          background:
            "linear-gradient(135deg, #172554 0%, #1e3a8a 55%, #2563eb 100%)",
          borderRadius: "15px",
          padding: "24px 26px",
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
            position: "absolute",
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
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#bfdbfe",
              marginBottom: "7px",
            }}
          >
            Workforce Management
          </div>

          <h2
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "21px",
              fontWeight: 750,
            }}
          >
            Manage your workforce from one place.
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#dbeafe",
              fontSize: "13px",
              maxWidth: "620px",
            }}
          >
            Access employees, attendance, leave,
            payroll, performance and recruitment
            modules based on your access level.
          </p>
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "23px",
          boxShadow:
            "0 4px 14px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "15px",
            marginBottom: "19px",
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
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Quick access to your available modules.
            </p>
          </div>

          <span
            style={{
              padding: "5px 9px",
              borderRadius: "999px",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {visibleModules.length} modules
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
          {visibleModules.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                navigate(item.path)
              }
              style={{
                minHeight: "60px",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                background: "#f8fafc",
                color: "#1e293b",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 650,
                transition:
                  "all 0.2s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: "18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#dbeafe",
            color: "#1d4ed8",
            fontSize: "11px",
            fontWeight: 800,
          }}
        >
          {initials}
        </div>

        <span>
          Signed in as{" "}
          <strong>{displayName}</strong>
          {" · "}
          {currentRole}
        </span>
      </section>
    </div>
  )
}

export default Dashboard