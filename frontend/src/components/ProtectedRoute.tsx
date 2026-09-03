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
          padding: "16px",
          boxSizing: "border-box",
          background:
            "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          color: "#111827",
          fontFamily:
            '"Inter", "Segoe UI", Arial, sans-serif',
        }}
      >
        <section
          aria-live="polite"
          style={{
            width: "100%",
            maxWidth: "340px",
            padding: "22px",
            boxSizing: "border-box",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow:
              "0 8px 20px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              margin: "0 auto 12px",
              borderRadius: "9px",
              background:
                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.03em",
            }}
          >
            HR
          </div>

          <p
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Loading your session...
          </p>

          <p
            style={{
              margin: "5px 0 0",
              color: "#64748b",
              fontSize: "10px",
              lineHeight: 1.5,
            }}
          >
            Please wait while we verify
            your access.
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