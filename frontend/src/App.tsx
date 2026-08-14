import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Attendance from "./pages/Attendance"
import Dashboard from "./pages/Dashboard"
import Departments from "./pages/Departments"
import Employees from "./pages/Employees"
import Holidays from "./pages/Holidays"
import Leave from "./pages/Leave"
import Login from "./pages/Login"
import Payroll from "./pages/Payroll"
import Performance from "./pages/Performance"
import Recruitment from "./pages/Recruitment"

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/employees"
        element={<Employees />}
      />

      <Route
        path="/departments"
        element={<Departments />}
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
        path="/payroll"
        element={<Payroll />}
      />

      <Route
        path="/performance"
        element={<Performance />}
      />

      <Route
        path="/recruitment"
        element={<Recruitment />}
      />

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
    </Routes>
  )
}

export default App