import { lazy, Suspense } from "react"
import {
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

const ChangePassword = lazy(() => import("./pages/ChangePassword"))
const Announcements = lazy(() => import("./pages/Announcements"))
const Attendance = lazy(() => import("./pages/Attendance"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Departments = lazy(() => import("./pages/Departments"))
const Documents = lazy(() => import("./pages/Documents"))
const Employees = lazy(() => import("./pages/Employees"))
const Holidays = lazy(() => import("./pages/Holidays"))
const Leave = lazy(() => import("./pages/Leave"))
const Login = lazy(() => import("./pages/Login"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const Payroll = lazy(() => import("./pages/Payroll"))
const Performance = lazy(() => import("./pages/Performance"))
const Recruitment = lazy(() => import("./pages/Recruitment"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))

import AppLayout from "./components/AppLayout"
import AppErrorBoundary from "./components/AppErrorBoundary"
import ProtectedRoute from "./components/ProtectedRoute"
import RoleProtectedRoute from "./components/RoleProtectedRoute"

function App() {
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="route-loading" role="status" aria-live="polite">
            <span className="route-loading-spinner" aria-hidden="true" />
            <span>Loading workspace…</span>
          </div>
        }
      >
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            element={
              <RoleProtectedRoute
                roles={[
                  "SUPER_ADMIN",
                  "HR",
                  "MANAGER",
                ]}
              />
            }
          >
            <Route
              path="/employees"
              element={<Employees />}
            />
          </Route>

          <Route
            element={
              <RoleProtectedRoute
                roles={[
                  "SUPER_ADMIN",
                  "HR",
                ]}
              />
            }
          >
            <Route
              path="/departments"
              element={<Departments />}
            />

            <Route
              path="/recruitment"
              element={<Recruitment />}
            />
          </Route>

          <Route
            element={
              <RoleProtectedRoute
                roles={[
                  "SUPER_ADMIN",
                  "HR",
                  "EMPLOYEE",
                ]}
              />
            }
          >
            <Route
              path="/documents"
              element={<Documents />}
            />
          </Route>

          <Route
            path="/holidays"
            element={<Holidays />}
          />

          <Route
            path="/leave"
            element={<Leave />}
          />

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            element={
              <RoleProtectedRoute
                roles={[
                  "SUPER_ADMIN",
                  "HR",
                  "EMPLOYEE",
                ]}
              />
            }
          >
            <Route
              path="/payroll"
              element={<Payroll />}
            />
          </Route>

          <Route
            path="/performance"
            element={<Performance />}
          />

          <Route
            path="/announcements"
            element={<Announcements />}
          />

          <Route
            path="/change-password"
            element={<ChangePassword />}
          />

          <Route
            path="*"
            element={
              <section
                aria-labelledby="not-found-title"
                style={{
                  minHeight: "min(56vh, 520px)",
                  display: "grid",
                  placeContent: "center",
                  justifyItems: "center",
                  gap: "12px",
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: "var(--app-primary)",
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                  }}
                >
                  404
                </span>
                <h1
                  id="not-found-title"
                  style={{
                    margin: 0,
                    color: "var(--text-primary)",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  Page not found
                </h1>
                <p
                  style={{
                    maxWidth: "420px",
                    margin: 0,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  This page may have moved or the address may be incorrect.
                </p>
                <Link
                  to="/dashboard"
                  style={{
                    marginTop: "6px",
                    borderRadius: "9px",
                    padding: "10px 15px",
                    background: "var(--app-primary)",
                    color: "var(--white)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Back to dashboard
                </Link>
              </section>
            }
          />
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Route>
    </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}

export default App
