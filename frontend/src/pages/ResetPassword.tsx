import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { resetPassword } from "../api/auth"
import { useTheme } from "../context/theme-context"

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const { isDarkMode } = useTheme()
  const uid = searchParams.get("uid") ?? ""
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const colors = {
    background: isDarkMode ? "#0f172a" : "#f5f7fb",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f8fafc" : "#172033",
    muted: isDarkMode ? "#cbd5e1" : "#64748b",
    border: isDarkMode ? "#475569" : "#d1d5db",
    input: isDarkMode ? "#0f172a" : "#ffffff",
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!uid || !token) {
      setError("This password reset link is missing information. Request a new link and try again.")
      return
    }
    if (password !== confirmation) {
      setError("The passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({
        uid,
        token,
        new_password: password,
        confirm_password: confirmation,
      })
      setSuccess(true)
      setPassword("")
      setConfirmation("")
    } catch (requestError: unknown) {
      const detail = (requestError as {
        response?: { data?: { detail?: string } }
      })?.response?.data?.detail
      setError(detail || "This reset link may have expired. Request a new link and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: colors.background, color: colors.text, fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
      <section style={{ width: "100%", maxWidth: 430, padding: 30, boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.card, boxShadow: "0 12px 34px rgba(15, 23, 42, 0.08)" }}>
        <p style={{ margin: "0 0 8px", color: "#2563eb", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>HR Management System</p>
        <h1 style={{ margin: 0, fontSize: 25 }}>Set a new password</h1>
        <p style={{ margin: "9px 0 22px", color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>Choose a password that you have not used for this account before.</p>

        {error && <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: isDarkMode ? "#450a0a" : "#fef2f2", color: isDarkMode ? "#fecaca" : "#991b1b", fontSize: 13 }}>{error}</div>}
        {success ? (
          <div role="status">
            <p style={{ color: isDarkMode ? "#86efac" : "#166534", lineHeight: 1.6 }}>Your password has been reset. You can now sign in with your new password.</p>
            <Link to="/login" style={{ display: "inline-block", marginTop: 8, color: "#2563eb", fontWeight: 700 }}>Go to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <label htmlFor="reset-password" style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 700 }}>New password</label>
            <input id="reset-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} style={{ width: "100%", minHeight: 44, marginBottom: 16, padding: "10px 12px", boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, background: colors.input }} />
            <label htmlFor="reset-confirm-password" style={{ display: "block", marginBottom: 7, fontSize: 13, fontWeight: 700 }}>Confirm new password</label>
            <input id="reset-confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isSubmitting} style={{ width: "100%", minHeight: 44, marginBottom: 20, padding: "10px 12px", boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, background: colors.input }} />
            <button type="submit" disabled={isSubmitting} style={{ width: "100%", minHeight: 45, border: 0, borderRadius: 8, background: isSubmitting ? "#93c5fd" : "#2563eb", color: "white", fontWeight: 800, cursor: isSubmitting ? "not-allowed" : "pointer" }}>{isSubmitting ? "Saving password…" : "Reset password"}</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default ResetPassword
