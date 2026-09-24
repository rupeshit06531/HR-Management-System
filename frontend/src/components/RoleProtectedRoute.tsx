import {
  Link,
  Navigate,
  Outlet,
} from "react-router-dom"

import { useAuth } from "../context/auth-context"

type UserRole =
  | "SUPER_ADMIN"
  | "HR"
  | "MANAGER"
  | "EMPLOYEE"

interface RoleProtectedRouteProps {
  roles: string[]
}

function RoleProtectedRoute({
  roles,
}: RoleProtectedRouteProps) {
  const {
    user,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          background: "#f8fafc",
          color: "#475569",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "360px",
            padding: "28px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 4px 14px rgba(15,23,42,0.05)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Checking your permissions...
          </p>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Please wait while we verify your access.
          </p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  const userRole =
    user.role as UserRole

  if (
    !roles.includes(userRole)
  ) {
    return (
      <section
        aria-labelledby="access-denied-title"
        style={{
          minHeight: "min(56vh, 520px)",
          display: "grid",
          placeContent: "center",
          justifyItems: "center",
          gap: "12px",
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            color: "var(--app-primary)",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.14em",
          }}
        >
          403
        </span>
        <h1
          id="access-denied-title"
          style={{
            margin: 0,
            color: "var(--text-primary)",
            fontSize: "clamp(24px, 4vw, 34px)",
          }}
        >
          Access denied
        </h1>
        <p
          style={{
            maxWidth: "420px",
            margin: 0,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          Your account doesn’t have permission to open this page.
        </p>
        <Link
          to="/dashboard"
          style={{
            marginTop: "6px",
            borderRadius: "9px",
            padding: "10px 15px",
            background: "var(--app-primary)",
            color: "var(--white)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  return <Outlet />
}

export default RoleProtectedRoute
