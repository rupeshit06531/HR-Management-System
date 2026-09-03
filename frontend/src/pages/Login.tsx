import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react"

import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#111827",
  fontSize: "12px",
  outline: "none",
}

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

    if (
      !username.trim() ||
      !password
    ) {
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
          background: "#f8fafc",
          color: "#475569",
          fontFamily:
            'Inter, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              margin: "0 auto 10px",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation:
                "hrms-login-spin 0.8s linear infinite",
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Loading HRMS...
          </p>

          <style>
            {`
              @keyframes hrms-login-spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
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
        background: "#f8fafc",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <section
        className="hrms-login-info"
        style={{
          width: "44%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          boxSizing: "border-box",
          background:
            "linear-gradient(145deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
          }}
        >
          <div
            style={{
              color: "#93c5fd",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Enterprise HR Platform
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              color: "#ffffff",
              fontSize: "34px",
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Human Resources
            <br />
            Management System
          </h1>

          <p
            style={{
              maxWidth: "390px",
              margin: 0,
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            A centralized platform for managing
            employees, attendance, leave, payroll,
            performance and recruitment.
          </p>

          <div
            className="hrms-login-features"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "7px",
              marginTop: "20px",
            }}
          >
            {[
              "Employee Management",
              "Attendance and Leave",
              "Payroll Management",
              "Performance and Recruitment",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "8px 9px",
                  border:
                    "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "6px",
                  background:
                    "rgba(255,255,255,0.05)",
                  color: "#dbeafe",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <p
            style={{
              margin: "20px 0 0",
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >
            Secure access. Centralized management.
            Role-based access.
          </p>
        </div>
      </section>

      <section
        className="hrms-login-panel"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "390px",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                color: "#2563eb",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "3px",
              }}
            >
              HRMS / Authentication
            </div>

            <h2
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "23px",
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              Sign in to HRMS
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#6b7280",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              Use your organization credentials to
              access the HR management portal.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: "10px",
                padding: "8px 10px",
                border:
                  "1px solid #fecaca",
                borderRadius: "6px",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: "11px",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              padding: "16px",
              border:
                "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#ffffff",
              boxShadow:
                "0 2px 6px rgba(15,23,42,0.04)",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: "5px",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  color: "#374151",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Username
              </span>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                autoComplete="username"
                placeholder="Enter your username"
                disabled={isSubmitting}
                style={{
                  ...inputStyle,
                  background: isSubmitting
                    ? "#f8fafc"
                    : "#ffffff",
                }}
              />
            </label>

            <label
              style={{
                display: "grid",
                gap: "5px",
                marginBottom: "7px",
              }}
            >
              <span
                style={{
                  color: "#374151",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Password
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={isSubmitting}
                style={{
                  ...inputStyle,
                  background: isSubmitting
                    ? "#f8fafc"
                    : "#ffffff",
                }}
              />
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "12px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate("/forgot-password")
                }
                style={{
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: "38px",
                padding: "7px 12px",
                border: "none",
                borderRadius: "6px",
                background: isSubmitting
                  ? "#93c5fd"
                  : "#2563eb",
                color: "#ffffff",
                cursor: isSubmitting
                  ? "not-allowed"
                  : "pointer",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {isSubmitting
                ? "Signing in..."
                : "Sign in to HRMS"}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              marginTop: "10px",
              color: "#9ca3af",
              fontSize: "9px",
            }}
          >
            <span>
              HR Management System
            </span>

            <span>
              Authorized access only
            </span>
          </div>
        </div>
      </section>

      <style>
        {`
          @media (max-width: 850px) {
            main {
              flex-direction: column;
            }

            .hrms-login-info {
              width: 100% !important;
              min-height: auto !important;
              padding: 28px 22px !important;
            }

            .hrms-login-panel {
              padding: 22px 16px !important;
            }
          }

          @media (max-width: 520px) {
            .hrms-login-info {
              padding: 22px 16px !important;
            }

            .hrms-login-info h1 {
              font-size: 28px !important;
            }

            .hrms-login-features {
              grid-template-columns: 1fr !important;
            }

            .hrms-login-panel {
              padding: 18px 12px !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Login