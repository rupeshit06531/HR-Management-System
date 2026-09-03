import {
  useState,
} from "react"

import type {
  FormEvent,
} from "react"

import {
  changePassword,
} from "../api/auth"

function ChangePassword() {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("")

  const [
    newPassword,
    setNewPassword,
  ] = useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState<string | null>(null)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setMessage(null)
    setError(null)

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "All password fields are required.",
      )
      return
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long.",
      )
      return
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "New password and confirmation do not match.",
      )
      return
    }

    setIsLoading(true)

    try {
      const response =
        await changePassword({
          current_password:
            currentPassword,
          new_password:
            newPassword,
          confirm_password:
            confirmPassword,
        })

      setMessage(response.detail)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (requestError: any) {
      const responseData =
        requestError?.response?.data

      setError(
        responseData?.detail ||
          "Unable to change password. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "680px",
        margin: "0 auto",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: "#172033",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "22px",
            padding: "0 8px",
            borderRadius: "6px",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "10px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Account Security
        </div>

        <h1
          style={{
            margin: "8px 0 0",
            fontSize: "24px",
            lineHeight: 1.2,
            fontWeight: 800,
            color: "#172033",
          }}
        >
          Change Password
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          Keep your HRMS account secure by
          updating your password regularly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          boxShadow:
            "0 3px 12px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom:
              "1px solid #eef1f5",
          }}
        >
          <div>
            <div
              style={{
                color: "#172033",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              Password Settings
            </div>

            <div
              style={{
                marginTop: "3px",
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Enter your current password and
              choose a new secure password.
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: "5px 8px",
              borderRadius: "6px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            Secure
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 12px",
              borderRadius: "7px",
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 12px",
              borderRadius: "7px",
              background: "#f0fdf4",
              border:
                "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1.45,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              color: "#334155",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            Current Password

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              autoComplete="current-password"
              placeholder="Enter current password"
              style={{
                width: "100%",
                height: "40px",
                padding: "0 11px",
                boxSizing: "border-box",
                border:
                  "1px solid #dbe1ea",
                borderRadius: "7px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
                fontSize: "12px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              color: "#334155",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            New Password

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Enter new password"
              style={{
                width: "100%",
                height: "40px",
                padding: "0 11px",
                boxSizing: "border-box",
                border:
                  "1px solid #dbe1ea",
                borderRadius: "7px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
                fontSize: "12px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              color: "#334155",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            Confirm New Password

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Confirm new password"
              style={{
                width: "100%",
                height: "40px",
                padding: "0 11px",
                boxSizing: "border-box",
                border:
                  "1px solid #dbe1ea",
                borderRadius: "7px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
                fontSize: "12px",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "40px",
                border: "none",
                borderRadius: "7px",
                background: isLoading
                  ? "#93c5fd"
                  : "#2563eb",
                color: "#ffffff",
                cursor: isLoading
                  ? "not-allowed"
                  : "pointer",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {isLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop:
              "1px solid #eef1f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            color: "#94a3b8",
            fontSize: "10px",
            lineHeight: 1.5,
          }}
        >
          <span>
            New password must contain at
            least 8 characters.
          </span>

          <span
            style={{
              flexShrink: 0,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            HRMS Security
          </span>
        </div>
      </form>

      <style>
        {`
          @media (max-width: 640px) {
            form > div:nth-child(4) {
              grid-template-columns: 1fr !important;
            }
          }

          input:focus {
            border-color: #93c5fd !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
          }

          button:not(:disabled):hover {
            background: #1d4ed8 !important;
          }
        `}
      </style>
    </div>
  )
}

export default ChangePassword