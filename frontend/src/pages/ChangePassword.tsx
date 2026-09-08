import {
  useState,
} from "react"

import type {
  FormEvent,
} from "react"

import {
  changePassword,
} from "../api/auth"

import {
  useTheme,
} from "../context/ThemeContext"

function ChangePassword() {
  const {
    isDarkMode,
  } = useTheme()

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

  const pageTextColor =
    isDarkMode
      ? "#f8fafc"
      : "#172033"

  const secondaryTextColor =
    isDarkMode
      ? "#cbd5e1"
      : "#64748b"

  const labelColor =
    isDarkMode
      ? "#e2e8f0"
      : "#334155"

  const cardBackground =
    isDarkMode
      ? "#1e293b"
      : "#ffffff"

  const cardBorder =
    isDarkMode
      ? "#334155"
      : "#e2e8f0"

  const inputBackground =
    isDarkMode
      ? "#0f172a"
      : "#ffffff"

  const inputBorder =
    isDarkMode
      ? "#475569"
      : "#dbe1ea"

  const inputTextColor =
    isDarkMode
      ? "#f8fafc"
      : "#172033"

  const footerBorder =
    isDarkMode
      ? "#334155"
      : "#eef1f5"

  const footerTextColor =
    isDarkMode
      ? "#94a3b8"
      : "#94a3b8"

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "620px",
        margin: "0 auto",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: pageTextColor,
      }}
    >
      <div
        style={{
          marginBottom: "22px",
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
          Account Security
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "26px",
            lineHeight: 1.2,
            fontWeight: 800,
            color: pageTextColor,
          }}
        >
          Change Password
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: secondaryTextColor,
            fontSize: "13px",
          }}
        >
          Update your account password
          securely.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: cardBackground,
          border:
            `1px solid ${cardBorder}`,
          borderRadius: "14px",
          padding: "24px",
          boxShadow:
            isDarkMode
              ? "0 4px 14px rgba(0,0,0,0.20)"
              : "0 4px 14px rgba(15,23,42,0.04)",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background:
                isDarkMode
                  ? "#450a0a"
                  : "#fef2f2",
              border:
                isDarkMode
                  ? "1px solid #7f1d1d"
                  : "1px solid #fecaca",
              color:
                isDarkMode
                  ? "#fecaca"
                  : "#b91c1c",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background:
                isDarkMode
                  ? "#14532d"
                  : "#f0fdf4",
              border:
                isDarkMode
                  ? "1px solid #166534"
                  : "1px solid #bbf7d0",
              color:
                isDarkMode
                  ? "#bbf7d0"
                  : "#15803d",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "17px",
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              color: labelColor,
              fontSize: "12px",
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
                height: "42px",
                padding: "0 12px",
                boxSizing: "border-box",
                border:
                  `1px solid ${inputBorder}`,
                borderRadius: "8px",
                outline: "none",
                color: inputTextColor,
                background: inputBackground,
                fontSize: "13px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              color: labelColor,
              fontSize: "12px",
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
                height: "42px",
                padding: "0 12px",
                boxSizing: "border-box",
                border:
                  `1px solid ${inputBorder}`,
                borderRadius: "8px",
                outline: "none",
                color: inputTextColor,
                background: inputBackground,
                fontSize: "13px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              color: labelColor,
              fontSize: "12px",
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
                height: "42px",
                padding: "0 12px",
                boxSizing: "border-box",
                border:
                  `1px solid ${inputBorder}`,
                borderRadius: "8px",
                outline: "none",
                color: inputTextColor,
                background: inputBackground,
                fontSize: "13px",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "5px",
              width: "100%",
              height: "43px",
              border: "none",
              borderRadius: "8px",
              background: isLoading
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {isLoading
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </div>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "16px",
            borderTop:
              `1px solid ${footerBorder}`,
            color: footerTextColor,
            fontSize: "11px",
            lineHeight: 1.6,
          }}
        >
          Your new password must contain
          at least 8 characters.
        </div>
      </form>
    </div>
  )
}

export default ChangePassword