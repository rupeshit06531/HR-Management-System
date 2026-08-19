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

  const [username, setUsername] =
    useState("")
  const [password, setPassword] =
    useState("")
  const [error, setError] =
    useState("")
  const [isSubmitting, setIsSubmitting] =
    useState(false)

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
          background:
            "linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%)",
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
              width: "38px",
              height: "38px",
              margin: "0 auto 14px",
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
              fontSize: "14px",
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
        alignItems: "stretch",
        background: "#f8fafc",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <section
        style={{
          width: "46%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          boxSizing: "border-box",
          background:
            "linear-gradient(145deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            right: "-150px",
            top: "-120px",
            borderRadius: "50%",
            background:
              "rgba(96, 165, 250, 0.12)",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "280px",
            height: "280px",
            left: "-140px",
            bottom: "-100px",
            borderRadius: "50%",
            background:
              "rgba(59, 130, 246, 0.12)",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "470px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              color: "#93c5fd",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Enterprise HR Platform
          </p>

          <h1
            style={{
              margin: "0 0 18px",
              color: "#ffffff",
              fontSize: "42px",
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: "-0.035em",
            }}
          >
            Human Resources
            <br />
            Management System
          </h1>

          <p
            style={{
              maxWidth: "410px",
              margin: 0,
              color: "#cbd5e1",
              fontSize: "15px",
              lineHeight: 1.75,
            }}
          >
            A centralized platform for
            managing employees, attendance,
            leave, payroll, performance and
            recruitment.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              marginTop: "34px",
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
                  padding: "11px 12px",
                  border:
                    "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "9px",
                  background:
                    "rgba(255,255,255,0.05)",
                  color: "#dbeafe",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <p
            style={{
              margin: "34px 0 0",
              color: "#94a3b8",
              fontSize: "11px",
            }}
          >
            Secure access. Centralized
            management. Role-based access.
          </p>
        </div>
      </section>

      <section
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 28px",
          boxSizing: "border-box",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
          }}
        >
          <div
            style={{
              marginBottom: "28px",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Welcome back
            </p>

            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "30px",
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: "-0.025em",
              }}
            >
              Sign in to HRMS
            </h2>

            <p
              style={{
                margin: "9px 0 0",
                color: "#64748b",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Use your organization credentials
              to access the HR management portal.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                border:
                  "1px solid #fecaca",
                borderRadius: "9px",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              padding: "26px",
              border:
                "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.07)",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: "8px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  color: "#334155",
                  fontSize: "13px",
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
                  width: "100%",
                  minHeight: "44px",
                  padding: "10px 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                  background:
                    isSubmitting
                      ? "#f8fafc"
                      : "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </label>

            <label
              style={{
                display: "grid",
                gap: "8px",
                marginBottom: "22px",
              }}
            >
              <span
                style={{
                  color: "#334155",
                  fontSize: "13px",
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
                  width: "100%",
                  minHeight: "44px",
                  padding: "10px 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                  background:
                    isSubmitting
                      ? "#f8fafc"
                      : "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: "45px",
                border: "none",
                borderRadius: "9px",
                background:
                  isSubmitting
                    ? "#93c5fd"
                    : "#2563eb",
                color: "#ffffff",
                cursor:
                  isSubmitting
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: 800,
                boxShadow:
                  isSubmitting
                    ? "none"
                    : "0 6px 16px rgba(37, 99, 235, 0.2)",
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
              gap: "16px",
              marginTop: "18px",
              color: "#94a3b8",
              fontSize: "11px",
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
          @media (max-width: 900px) {
            main {
              flex-direction: column;
            }

            main > section:first-child {
              width: 100%;
              min-height: auto;
              padding: 38px 28px;
            }

            main > section:first-child h1 {
              font-size: 34px;
            }

            main > section:last-child {
              padding: 38px 20px;
            }
          }

          @media (max-width: 560px) {
            main > section:first-child {
              padding: 30px 20px;
            }

            main > section:first-child h1 {
              font-size: 29px;
            }

            main > section:first-child > div > div:nth-of-type(2) {
              grid-template-columns: 1fr;
            }

            main > section:last-child {
              padding: 28px 14px;
            }

            form {
              padding: 20px !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Login