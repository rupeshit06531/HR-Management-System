import {
  lazy,
  Suspense,
} from "react"
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import AppLayout from "./components/AppLayout"
import ProtectedRoute from "./components/ProtectedRoute"
import RoleProtectedRoute from "./components/RoleProtectedRoute"

const Login = lazy(() => import("./pages/Login"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const ChangePassword = lazy(() => import("./pages/ChangePassword"))

const Announcements = lazy(() => import("./pages/Announcements"))
const Attendance = lazy(() => import("./pages/Attendance"))
const Departments = lazy(() => import("./pages/Departments"))
const Documents = lazy(() => import("./pages/Documents"))
const Employees = lazy(() => import("./pages/Employees"))
const Holidays = lazy(() => import("./pages/Holidays"))
const Leave = lazy(() => import("./pages/Leave"))
const Payroll = lazy(() => import("./pages/Payroll"))
const Performance = lazy(() => import("./pages/Performance"))
const Recruitment = lazy(() => import("./pages/Recruitment"))

function RouteLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--app-background, #f6f7f9)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "24px",
          borderRadius: "var(--app-radius-lg, 16px)",
          border: "1px solid var(--app-border, #e5e7eb)",
          background: "var(--app-surface, #ffffff)",
          boxShadow: "var(--app-shadow-sm, 0 4px 16px rgba(0, 0, 0, 0.06))",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "32px",
            height: "32px",
            margin: "0 auto 14px",
            borderRadius: "50%",
            border: "3px solid var(--app-border, #e5e7eb)",
            borderTopColor: "var(--app-primary, #f97316)",
            animation: "hrms-route-spin 0.8s linear infinite",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--app-text, #111827)",
          }}
        >
          Loading workspace
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            color: "var(--app-text-muted, #6b7280)",
          }}
        >
          Preparing your HRMS module
        </div>
      </div>

      <style>
        {`
          @keyframes hrms-route-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            @keyframes hrms-route-spin {
              from,
              to {
                transform: none;
              }
            }
          }
        `}
      </style>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
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
              path="/documents"
              element={<Documents />}
            />

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

          <Route
            path="*"
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
  )
}

export default App