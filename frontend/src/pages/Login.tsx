
import {
  useEffect,
  useState,
  type FormEvent,
} from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

function Login() {
  const navigate = useNavigate()

  const {
    user,
    isLoading,
    login,
  } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", {
        replace: true,
      })
    }
  }, [
    isLoading,
    user,
    navigate,
  ])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError(
        "Username and password are required.",
      )
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await login({
        username: username.trim(),
        password,
      })

      navigate("/dashboard", {
        replace: true,
      })
    } catch {
      setError(
        "Invalid username or password.",
      )
    } finally {
      setIsSubmitting(false)
    }
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
          background: "#f5f7fb",
        }}
      >
        <p>Loading...</p>
      </main>
    )
  }

  if (user) {
    return null
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        background: "#f5f7fb",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow:
            "0 4px 16px rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: "8px",
            color: "#111827",
          }}
        >
          HR Management System
        </h1>

        <p
          style={{
            marginBottom: "28px",
            color: "#6b7280",
          }}
        >
          Sign in to continue
        </p>

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              borderRadius: "6px",
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <label
            style={{
              display: "grid",
              gap: "6px",
            }}
          >
            <span>Username</span>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              placeholder="Enter username"
              style={{
                width: "100%",
                padding: "11px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: "6px",
            }}
          >
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "11px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "6px",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              background: isSubmitting
                ? "#9ca3af"
                : "#2563eb",
              color: "#ffffff",
              cursor: isSubmitting
                ? "not-allowed"
                : "pointer",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {isSubmitting
              ? "Signing in..."
              : "Login"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login