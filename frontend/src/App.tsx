import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Announcements from "./pages/Announcements"
import Attendance from "./pages/Attendance"
import Dashboard from "./pages/Dashboard"
import Departments from "./pages/Departments"
import Documents from "./pages/Documents"
import Employees from "./pages/Employees"
import Holidays from "./pages/Holidays"
import Leave from "./pages/Leave"
import Login from "./pages/Login"
import Payroll from "./pages/Payroll"
import Performance from "./pages/Performance"
import Recruitment from "./pages/Recruitment"

import AppLayout from "./components/AppLayout"
import ProtectedRoute from "./components/ProtectedRoute"
import RoleProtectedRoute from "./components/RoleProtectedRoute"

function App() {
  return (
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
  )
}

export default App