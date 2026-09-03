import {
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react"

import { forgotPassword } from "../api/auth"

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  boxSizing: "border-box",
  background: "#f8fafc",
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
}

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "22px",
  boxSizing: "border-box",
  boxShadow: "0 2px 6px rgba(15,23,42,0.04)",
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
}

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  outline: "none",
  boxSizing: "border-box",
  color: "#111827",
  background: "#ffffff",
  fontSize: "12px",
}

function ForgotPassword() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setMessage("")
    setError("")

    if (!username.trim() && !email.trim()) {
      setError(
        "Please enter your username or email address.",
      )
      return
    }

    try {
      setIsLoading(true)

      const response = await forgotPassword({
        username: username.trim() || undefined,
        email: email.trim() || undefined,
      })

      setMessage(response.detail)
    } catch (requestError) {
      console.error(
        "Forgot password request failed:",
        requestError,
      )

      setError(
        "Unable to process the password recovery request.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setUsername(event.target.value)
  }

  const handleEmailChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setEmail(event.target.value)
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              color: "#2563eb",
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "4px",
            }}
          >
            HRMS / Account Recovery
          </div>

          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "21px",
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Forgot Password
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              color: "#6b7280",
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          >
            Enter your username or email address to
            start the password recovery process.
          </p>
        </div>

        {message && (
          <div
            role="status"
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "6px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "11px",
              lineHeight: 1.45,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "6px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "11px",
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            <label
              htmlFor="forgot-username"
              style={labelStyle}
            >
              Username
            </label>

            <input
              id="forgot-username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter username"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginBottom: "14px",
            }}
          >
            <label
              htmlFor="forgot-email"
              style={labelStyle}
            >
              Email Address
            </label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter email address"
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              minHeight: "36px",
              padding: "7px 12px",
              border: "none",
              borderRadius: "6px",
              background: isLoading
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {isLoading
              ? "Processing..."
              : "Reset Password"}
          </button>
        </form>

        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "10px",
          }}
        >
          HR Management System
        </div>
      </section>
    </main>
  )
}

export default ForgotPassword