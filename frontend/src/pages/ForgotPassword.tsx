import {
  useState,
} from "react"

import type {
  FormEvent,
} from "react"

import type {
  ChangeEvent,
} from "react"

import {
  forgotPassword,
} from "../api/auth"

function ForgotPassword() {
  const [username, setUsername] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const [isLoading, setIsLoading] =
    useState(false)

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

      const response =
        await forgotPassword({
          username:
            username.trim() || undefined,
          email:
            email.trim() || undefined,
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f5f7fb",
        fontFamily:
          "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "30px",
          boxSizing: "border-box",
          boxShadow:
            "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              color: "#2563eb",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "7px",
            }}
          >
            HR Management System
          </div>

          <h1
            style={{
              margin: 0,
              color: "#172033",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            Forgot Password
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Enter your username or email address
            to start the password recovery process.
          </p>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <label
              htmlFor="forgot-username"
              style={{
                display: "block",
                marginBottom: "7px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 700,
              }}
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
              style={{
                width: "100%",
                padding: "11px 12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                outline: "none",
                boxSizing: "border-box",
                color: "#172033",
                background: "#ffffff",
                fontSize: "13px",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="forgot-email"
              style={{
                display: "block",
                marginBottom: "7px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 700,
              }}
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
              style={{
                width: "100%",
                padding: "11px 12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
                outline: "none",
                boxSizing: "border-box",
                color: "#172033",
                background: "#ffffff",
                fontSize: "13px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "11px 14px",
              border: "none",
              borderRadius: "8px",
              background: isLoading
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              fontSize: "13px",
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
      </div>
    </div>
  )
}

export default ForgotPassword