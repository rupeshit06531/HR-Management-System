import {
  Navigate,
  Outlet,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"

function ProtectedRoute() {
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
            Loading your session...
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

  return <Outlet />
}

export default ProtectedRoute