import {
  Navigate,
  Outlet,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"

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
          padding: "16px",
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
            maxWidth: "320px",
            padding: "20px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(15,23,42,0.04)",
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
            Loading your session...
          </p>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "12px",
              lineHeight: 1.4,
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

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <Outlet />
}

export default RoleProtectedRoute