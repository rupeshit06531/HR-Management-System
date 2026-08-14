import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

function Dashboard() {
  const navigate = useNavigate()

  const {
    user,
    logout,
    isLoading,
  } = useAuth()

  const handleLogout = async () => {
    await logout()

    navigate("/login", {
      replace: true,
    })
  }

  if (isLoading) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main>
      <section>
        <h1>HR Management System</h1>

        <h2>Dashboard</h2>

        <p>
          Welcome,{" "}
          <strong>
            {user.first_name || user.username}
          </strong>
        </p>

        <div>
          <p>
            <strong>Username:</strong>{" "}
            {user.username}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {user.email}
          </p>

          <p>
            <strong>Role:</strong>{" "}
            {user.role}
          </p>

          <p>
            <strong>Employee ID:</strong>{" "}
            {user.id}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
        >
          Logout
        </button>
      </section>
    </main>
  )
}

export default Dashboard