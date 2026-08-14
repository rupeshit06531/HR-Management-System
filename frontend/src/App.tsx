import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Login from "./pages/Login"

function Dashboard() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>HR Management System</h1>
      <p>Dashboard is working.</p>
    </main>
  )
}

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
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App