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
        maxWidth: "620px",
        margin: "0 auto",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
        color: "#172033",
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
            color: "#172033",
          }}
        >
          Change Password
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#64748b",
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
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "24px",
          boxShadow:
            "0 4px 14px rgba(15,23,42,0.04)",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
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
              background: "#f0fdf4",
              border:
                "1px solid #bbf7d0",
              color: "#15803d",
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
              color: "#334155",
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
                  "1px solid #dbe1ea",
                borderRadius: "8px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
                fontSize: "13px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              color: "#334155",
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
                  "1px solid #dbe1ea",
                borderRadius: "8px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
                fontSize: "13px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              color: "#334155",
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
                  "1px solid #dbe1ea",
                borderRadius: "8px",
                outline: "none",
                color: "#172033",
                background: "#ffffff",
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
              "1px solid #eef1f5",
            color: "#94a3b8",
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