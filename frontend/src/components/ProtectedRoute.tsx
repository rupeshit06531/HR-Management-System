import {
  Navigate,
  Outlet,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"

function ProtectedRoute() {
  const {
    user,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute