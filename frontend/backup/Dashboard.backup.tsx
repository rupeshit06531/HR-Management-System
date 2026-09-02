import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"

import { getDashboard } from "../api/dashboard"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

interface ModuleItem {
  label: string
  path: string
  roles: string[]
  description: string
  icon: string
}

const moduleItems: ModuleItem[] = [
  {
    label: "Employees",
    path: "/employees",
    roles: ["SUPER_ADMIN", "HR", "MANAGER"],
    description: "Manage employee records and workforce information",
    icon: "EM",
  },
  {
    label: "Departments",
    path: "/departments",
    roles: ["SUPER_ADMIN", "HR"],
    description: "Manage departments and designations",
    icon: "DP",
  },
  {
    label: "Attendance",
    path: "/attendance",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "Track attendance and daily check-ins",
    icon: "AT",
  },
  {
    label: "Leave",
    path: "/leave",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "Manage leave requests and approvals",
    icon: "LV",
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: ["SUPER_ADMIN", "HR", "EMPLOYEE"],
    description: "View and manage payroll information",
    icon: "PR",
  },
  {
    label: "Performance",
    path: "/performance",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "Review employee performance",
    icon: "PF",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: ["SUPER_ADMIN", "HR"],
    description: "Manage recruitment and hiring activities",
    icon: "RC",
  },
  {
    label: "Documents",
    path: "/documents",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "Access employee and HR documents",
    icon: "DC",
  },
  {
    label: "Announcements",
    path: "/announcements",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "View company announcements",
    icon: "AN",
  },
  {
    label: "Holidays",
    path: "/holidays",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    description: "View company holidays",
    icon: "HD",
  },
]

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN:
    "Organization-wide visibility and administrative control",
  HR:
    "Human resources operations and workforce management",
  MANAGER:
    "Team management, employee oversight and daily operations",
  EMPLOYEE:
    "Your personal HR workspace and employment information",
}

const styles = `
  .dashboard-page {
    min-height: 100vh;
    padding: 28px;
    background: var(--dashboard-bg);
    color: var(--dashboard-text);
    box-sizing: border-box;
  }

  .dashboard-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 26px;
  }

  .dashboard-heading {
    min-width: 0;
  }

  .dashboard-eyebrow {
    margin: 0 0 7px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dashboard-muted);
  }

  .dashboard-title {
    margin: 0;
    font-size: clamp(26px, 3vw, 34px);
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .dashboard-subtitle {
    margin: 8px 0 0;
    color: var(--dashboard-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .dashboard-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .dashboard-action {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--dashboard-border);
    border-radius: 10px;
    background: var(--dashboard-card);
    color: var(--dashboard-text);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: 160ms ease;
  }

  .dashboard-action:hover {
    border-color: var(--dashboard-accent);
    transform: translateY(-1px);
  }

  .dashboard-action.primary {
    border-color: var(--dashboard-accent);
    background: var(--dashboard-accent);
    color: #ffffff;
  }

  .dashboard-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    padding: 28px;
    margin-bottom: 22px;
    border: 1px solid var(--dashboard-border);
    border-radius: 18px;
    background:
      linear-gradient(
        135deg,
        var(--dashboard-hero-start),
        var(--dashboard-hero-end)
      );
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-hero-content {
    min-width: 0;
  }

  .dashboard-role-badge {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: var(--dashboard-badge-bg);
    color: var(--dashboard-accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dashboard-hero-title {
    margin: 13px 0 7px;
    font-size: clamp(24px, 3vw, 32px);
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .dashboard-hero-text {
    max-width: 720px;
    margin: 0;
    color: var(--dashboard-muted);
    font-size: 14px;
    line-height: 1.65;
  }

  .dashboard-profile-summary {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 230px;
    align-self: center;
  }

  .dashboard-avatar {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    flex-shrink: 0;
    border-radius: 16px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 18px;
    font-weight: 800;
  }

  .dashboard-profile-name {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .dashboard-profile-role {
    margin: 4px 0 0;
    color: var(--dashboard-muted);
    font-size: 12px;
  }

  .dashboard-section {
    margin-top: 24px;
  }

  .dashboard-section-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 13px;
  }

  .dashboard-section-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
  }

  .dashboard-section-description {
    margin: 4px 0 0;
    color: var(--dashboard-muted);
    font-size: 12px;
  }

  .dashboard-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .dashboard-kpi {
    padding: 19px;
    border: 1px solid var(--dashboard-border);
    border-radius: 15px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dashboard-kpi-label {
    color: var(--dashboard-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-kpi-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-kpi-value {
    margin: 13px 0 0;
    font-size: 27px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .dashboard-kpi-meta {
    margin: 5px 0 0;
    color: var(--dashboard-muted);
    font-size: 11px;
  }

  .dashboard-content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
    gap: 18px;
  }

  .dashboard-panel {
    min-width: 0;
    padding: 20px;
    border: 1px solid var(--dashboard-border);
    border-radius: 15px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-panel-title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .dashboard-panel-subtitle {
    margin: 5px 0 18px;
    color: var(--dashboard-muted);
    font-size: 11px;
    line-height: 1.5;
  }

  .dashboard-workforce {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    align-items: center;
    gap: 25px;
  }

  .dashboard-donut {
    position: relative;
    display: grid;
    place-items: center;
    width: 170px;
    height: 170px;
    margin: 0 auto;
    border-radius: 50%;
    background:
      conic-gradient(
        var(--dashboard-accent) 0deg,
        var(--dashboard-accent) var(--active-angle),
        var(--dashboard-track) var(--active-angle),
        var(--dashboard-track) 360deg
      );
  }

  .dashboard-donut::after {
    content: "";
    position: absolute;
    inset: 20px;
    border-radius: 50%;
    background: var(--dashboard-card);
  }

  .dashboard-donut-center {
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .dashboard-donut-value {
    display: block;
    font-size: 28px;
    font-weight: 800;
  }

  .dashboard-donut-label {
    display: block;
    margin-top: 2px;
    color: var(--dashboard-muted);
    font-size: 10px;
    font-weight: 700;
  }

  .dashboard-status-list {
    display: grid;
    gap: 12px;
  }

  .dashboard-status-row {
    display: grid;
    grid-template-columns: minmax(110px, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .dashboard-status-name {
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-status-value {
    color: var(--dashboard-muted);
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-status-track {
    grid-column: 1 / -1;
    height: 6px;
    overflow: hidden;
    margin-top: -7px;
    border-radius: 999px;
    background: var(--dashboard-track);
  }

  .dashboard-status-progress {
    height: 100%;
    border-radius: inherit;
    background: var(--dashboard-accent);
  }

  .dashboard-role-list {
    display: grid;
    gap: 12px;
  }

  .dashboard-role-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .dashboard-role-name {
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-role-count {
    color: var(--dashboard-muted);
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-role-track {
    grid-column: 1 / -1;
    height: 6px;
    overflow: hidden;
    margin-top: -5px;
    border-radius: 999px;
    background: var(--dashboard-track);
  }

  .dashboard-role-progress {
    height: 100%;
    border-radius: inherit;
    background: var(--dashboard-accent);
  }

  .dashboard-profile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-info-card {
    min-width: 0;
    padding: 15px;
    border: 1px solid var(--dashboard-border);
    border-radius: 12px;
    background: var(--dashboard-surface);
  }

  .dashboard-info-label {
    margin: 0 0 6px;
    color: var(--dashboard-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .dashboard-info-value {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 800;
  }

  .dashboard-info-value.muted {
    color: var(--dashboard-muted);
  }

  .dashboard-module-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .dashboard-module {
    display: flex;
    flex-direction: column;
    min-height: 142px;
    padding: 17px;
    border: 1px solid var(--dashboard-border);
    border-radius: 14px;
    background: var(--dashboard-card);
    color: var(--dashboard-text);
    text-align: left;
    cursor: pointer;
    box-shadow: var(--dashboard-shadow);
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .dashboard-module:hover {
    transform: translateY(-2px);
    border-color: var(--dashboard-accent);
    box-shadow: var(--dashboard-shadow-hover);
  }

  .dashboard-module-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin-bottom: 16px;
    border-radius: 10px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-module-title {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
  }

  .dashboard-module-description {
    margin: 6px 0 0;
    color: var(--dashboard-muted);
    font-size: 11px;
    line-height: 1.55;
  }

  .dashboard-module-arrow {
    margin-top: auto;
    padding-top: 14px;
    color: var(--dashboard-accent);
    font-size: 11px;
    font-weight: 800;
  }

  .dashboard-quick-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-quick-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 64px;
    padding: 12px 15px;
    border: 1px solid var(--dashboard-border);
    border-radius: 12px;
    background: var(--dashboard-card);
    color: var(--dashboard-text);
    text-align: left;
    cursor: pointer;
    transition: 160ms ease;
  }

  .dashboard-quick-action:hover {
    border-color: var(--dashboard-accent);
    transform: translateY(-1px);
  }

  .dashboard-quick-left {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .dashboard-quick-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 9px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 9px;
    font-weight: 800;
  }

  .dashboard-quick-title {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
  }

  .dashboard-quick-text {
    margin: 3px 0 0;
    overflow: hidden;
    color: var(--dashboard-muted);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-quick-arrow {
    color: var(--dashboard-muted);
    font-size: 15px;
  }

  .dashboard-footer {
    margin-top: 25px;
    padding: 14px 2px 2px;
    color: var(--dashboard-muted);
    font-size: 11px;
    text-align: center;
  }

  .dashboard-state {
    display: grid;
    min-height: 420px;
    place-items: center;
    padding: 30px;
    text-align: center;
  }

  .dashboard-state-card {
    width: min(420px, 100%);
    padding: 28px;
    border: 1px solid var(--dashboard-border);
    border-radius: 16px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-state-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }

  .dashboard-state-text {
    margin: 8px 0 20px;
    color: var(--dashboard-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .dashboard-spinner {
    width: 30px;
    height: 30px;
    margin: 0 auto 15px;
    border: 3px solid var(--dashboard-track);
    border-top-color: var(--dashboard-accent);
    border-radius: 50%;
    animation: dashboard-spin 700ms linear infinite;
  }

  @keyframes dashboard-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1150px) {
    .dashboard-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 800px) {
    .dashboard-page {
      padding: 18px;
    }

    .dashboard-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-header-actions {
      width: 100%;
    }

    .dashboard-header-actions .dashboard-action {
      flex: 1;
    }

    .dashboard-hero {
      grid-template-columns: 1fr;
      padding: 21px;
    }

    .dashboard-profile-summary {
      min-width: 0;
    }

    .dashboard-workforce {
      grid-template-columns: 1fr;
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-quick-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .dashboard-page {
      padding: 14px;
    }

    .dashboard-kpi-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-module-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-profile-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-panel {
      padding: 16px;
    }

    .dashboard-donut {
      width: 150px;
      height: 150px;
    }

    .dashboard-donut::after {
      inset: 18px;
    }
  }
`

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return "U"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const [dashboard, setDashboard] = useState<
    Awaited<ReturnType<typeof getDashboard>> | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadDashboard() {
    try {
      setIsLoading(true)
      setError("")

      const data = await getDashboard()
      setDashboard(data)
    } catch {
      setError("Unable to load dashboard information.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const currentRole = roleLabels[user?.role ?? ""] || user?.role || "User"
  const roleDescription =
    roleDescriptions[user?.role ?? ""] ||
    "Your HR management workspace"

  const displayName =
    user?.first_name?.trim() ||
    user?.username ||
    "User"

  const employeeProfile = dashboard?.employee
  const employeeMetrics = dashboard?.employees
  const userMetrics = dashboard?.users

  const totalEmployees = employeeMetrics?.total ?? 0
  const activeEmployees = employeeMetrics?.active ?? 0
  const inactiveEmployees = employeeMetrics?.inactive ?? 0
  const resignedEmployees = employeeMetrics?.resigned ?? 0
  const terminatedEmployees = employeeMetrics?.terminated ?? 0
  const totalUsers = userMetrics?.total ?? 0

  const activePercentage =
    totalEmployees > 0
      ? Math.round((activeEmployees / totalEmployees) * 100)
      : 0

  const visibleModules = useMemo(() => {
    const role = user?.role

    if (!role) {
      return []
    }

    return moduleItems.filter((item) => item.roles.includes(role))
  }, [user?.role])

  const quickActionNames =
    user?.role === "SUPER_ADMIN"
      ? ["Employees", "Departments", "Attendance", "Leave", "Recruitment", "Documents"]
      : user?.role === "HR"
        ? ["Employees", "Departments", "Attendance", "Leave", "Recruitment", "Documents"]
        : user?.role === "MANAGER"
          ? ["Employees", "Attendance", "Leave", "Performance", "Documents", "Announcements"]
          : ["Attendance", "Leave", "Payroll", "Performance", "Documents", "Holidays"]

  const quickActions = quickActionNames
    .map((name) => visibleModules.find((item) => item.label === name))
    .filter((item): item is ModuleItem => Boolean(item))

  const workforceStatuses = [
    {
      label: "Active",
      value: activeEmployees,
      percentage:
        totalEmployees > 0
          ? (activeEmployees / totalEmployees) * 100
          : 0,
    },
    {
      label: "Inactive",
      value: inactiveEmployees,
      percentage:
        totalEmployees > 0
          ? (inactiveEmployees / totalEmployees) * 100
          : 0,
    },
    {
      label: "Resigned",
      value: resignedEmployees,
      percentage:
        totalEmployees > 0
          ? (resignedEmployees / totalEmployees) * 100
          : 0,
    },
    {
      label: "Terminated",
      value: terminatedEmployees,
      percentage:
        totalEmployees > 0
          ? (terminatedEmployees / totalEmployees) * 100
          : 0,
    },
  ]

  const roleDistribution = Object.entries(userMetrics?.roles ?? {}).sort(
    ([, first], [, second]) => second - first,
  )

  const maxRoleCount = Math.max(
    ...roleDistribution.map(([, count]) => count),
    1,
  )

  const personalName =
    employeeProfile?.full_name?.trim() || displayName

  const personalInitials = getInitials(personalName)

  const personalProfileCards = [
    {
      label: "Employee ID",
      value: employeeProfile?.employee_id || user?.employee_id || "Not available",
    },
    {
      label: "Department",
      value: employeeProfile?.department || "Not assigned",
    },
    {
      label: "Designation",
      value: employeeProfile?.designation || "Not assigned",
    },
    {
      label: "Employment Status",
      value: employeeProfile?.employment_status || "Not available",
    },
    {
      label: "Employment Type",
      value: employeeProfile?.employment_type || "Not available",
    },
    {
      label: "Joining Date",
      value: formatDate(employeeProfile?.joining_date),
    },
    {
      label: "Manager",
      value: employeeProfile?.manager || "Not assigned",
    },
    {
      label: "Email",
      value: employeeProfile?.email || user?.email || "Not available",
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        logout={logout}
      >
        <div className="dashboard-state">
          <div className="dashboard-state-card">
            <div className="dashboard-spinner" />
            <h2 className="dashboard-state-title">
              Loading dashboard
            </h2>
            <p className="dashboard-state-text">
              Preparing your HR management workspace.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        logout={logout}
      >
        <div className="dashboard-state">
          <div className="dashboard-state-card">
            <h2 className="dashboard-state-title">
              Dashboard unavailable
            </h2>
            <p className="dashboard-state-text">
              {error}
            </p>
            <button
              type="button"
              className="dashboard-action primary"
              onClick={() => void loadDashboard()}
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      logout={logout}
    >
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-heading">
            <p className="dashboard-eyebrow">
              HR Management System
            </p>
            <h1 className="dashboard-title">
              Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Manage your HR operations from one professional workspace.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="dashboard-action"
              onClick={() => void loadDashboard()}
            >
              Refresh
            </button>

            <button
              type="button"
              className="dashboard-action"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>

        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <span className="dashboard-role-badge">
              {currentRole}
            </span>

            <h2 className="dashboard-hero-title">
              Welcome back, {displayName}
            </h2>

            <p className="dashboard-hero-text">
              {roleDescription}
            </p>
          </div>

          <div className="dashboard-profile-summary">
            <div className="dashboard-avatar">
              {personalInitials}
            </div>

            <div>
              <p className="dashboard-profile-name">
                {personalName}
              </p>
              <p className="dashboard-profile-role">
                {currentRole}
              </p>
            </div>
          </div>
        </section>

        {user?.role === "EMPLOYEE" && (
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    My Employment Profile
                  </h2>
                  <p className="dashboard-section-description">
                    Your current employment information.
                  </p>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-profile-grid">
                  {personalProfileCards.map((card) => (
                    <div
                      className="dashboard-info-card"
                      key={card.label}
                    >
                      <p className="dashboard-info-label">
                        {card.label}
                      </p>
                      <p
                        className={`dashboard-info-value ${
                          card.value === "Not available" ||
                          card.value === "Not assigned"
                            ? "muted"
                            : ""
                        }`}
                        title={card.value}
                      >
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    My HR Workspace
                  </h2>
                  <p className="dashboard-section-description">
                    Access your personal HR services.
                  </p>
                </div>
              </div>

              <ModuleGrid
                modules={visibleModules}
                navigate={navigate}
              />
            </section>
          </>
        )}

        {user?.role === "MANAGER" && (
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    Team Overview
                  </h2>
                  <p className="dashboard-section-description">
                    Workforce information available to your manager role.
                  </p>
                </div>
              </div>

              <div className="dashboard-kpi-grid">
                <MetricCard
                  label="Team Employees"
                  value={totalEmployees}
                  meta="Employees in your accessible team"
                  icon="TM"
                />

                <MetricCard
                  label="Active"
                  value={activeEmployees}
                  meta={`${activePercentage}% of accessible team`}
                  icon="AC"
                />

                <MetricCard
                  label="Inactive"
                  value={inactiveEmployees}
                  meta="Currently inactive"
                  icon="IN"
                />

                <MetricCard
                  label="Resigned"
                  value={resignedEmployees}
                  meta="Resigned employees"
                  icon="RS"
                />
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-content-grid">
                <WorkforcePanel
                  totalEmployees={totalEmployees}
                  activeEmployees={activeEmployees}
                  workforceStatuses={workforceStatuses}
                />

                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title">
                    Team Actions
                  </h2>
                  <p className="dashboard-panel-subtitle">
                    Frequently used manager operations.
                  </p>

                  <div className="dashboard-quick-grid">
                    {quickActions.map((item) => (
                      <QuickAction
                        key={item.path}
                        item={item}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    Manager Modules
                  </h2>
                  <p className="dashboard-section-description">
                    Modules available to your role.
                  </p>
                </div>
              </div>

              <ModuleGrid
                modules={visibleModules}
                navigate={navigate}
              />
            </section>
          </>
        )}

        {(user?.role === "SUPER_ADMIN" || user?.role === "HR") && (
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    {user.role === "SUPER_ADMIN"
                      ? "Organization Overview"
                      : "HR Workforce Overview"}
                  </h2>
                  <p className="dashboard-section-description">
                    {user.role === "SUPER_ADMIN"
                      ? "High-level workforce and system visibility."
                      : "Workforce information for HR operations."}
                  </p>
                </div>
              </div>

              <div className="dashboard-kpi-grid">
                <MetricCard
                  label="Total Employees"
                  value={totalEmployees}
                  meta="Employees in the organization"
                  icon="EM"
                />

                <MetricCard
                  label="Active Employees"
                  value={activeEmployees}
                  meta={`${activePercentage}% of total workforce`}
                  icon="AC"
                />

                <MetricCard
                  label="Inactive Employees"
                  value={inactiveEmployees}
                  meta="Currently inactive"
                  icon="IN"
                />

                <MetricCard
                  label="Total Users"
                  value={totalUsers}
                  meta="Registered system users"
                  icon="US"
                />
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-content-grid">
                <WorkforcePanel
                  totalEmployees={totalEmployees}
                  activeEmployees={activeEmployees}
                  workforceStatuses={workforceStatuses}
                />

                {user?.role === "SUPER_ADMIN" ? (
                  <RoleDistribution
                    roleDistribution={roleDistribution}
                    maxRoleCount={maxRoleCount}
                  />
                ) : (
                  <div className="dashboard-panel">
                    <h2 className="dashboard-panel-title">
                      HR Operations
                    </h2>
                    <p className="dashboard-panel-subtitle">
                      Common HR activities available from this workspace.
                    </p>

                    <div className="dashboard-quick-grid">
                      {quickActions.map((item) => (
                        <QuickAction
                          key={item.path}
                          item={item}
                          navigate={navigate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {user?.role === "SUPER_ADMIN" && (
              <section className="dashboard-section">
                <div className="dashboard-section-header">
                  <div>
                    <h2 className="dashboard-section-title">
                      Administrative Actions
                    </h2>
                    <p className="dashboard-section-description">
                      Direct access to commonly used organization controls.
                    </p>
                  </div>
                </div>

                <div className="dashboard-quick-grid">
                  {quickActions.map((item) => (
                    <QuickAction
                      key={item.path}
                      item={item}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2 className="dashboard-section-title">
                    HRMS Modules
                  </h2>
                  <p className="dashboard-section-description">
                    Access the modules available to your role.
                  </p>
                </div>
              </div>

              <ModuleGrid
                modules={visibleModules}
                navigate={navigate}
              />
            </section>
          </>
        )}

        <footer className="dashboard-footer">
          Signed in as {personalName} · {currentRole}
        </footer>
      </div>
    </DashboardLayout>
  )
}

function DashboardLayout({
  children,
  isDarkMode,
  toggleTheme,
  logout,
}: {
  children: React.ReactNode
  isDarkMode: boolean
  toggleTheme: () => void
  logout: () => void
}) {
  return (
    <>
      <style>{`
        :root {
          --dashboard-bg: #f5f7fb;
          --dashboard-card: #ffffff;
          --dashboard-surface: #f8fafc;
          --dashboard-text: #172033;
          --dashboard-muted: #687386;
          --dashboard-border: #e5e9f0;
          --dashboard-accent: #4f46e5;
          --dashboard-accent-soft: #eef2ff;
          --dashboard-badge-bg: #eef2ff;
          --dashboard-track: #e9edf3;
          --dashboard-hero-start: #ffffff;
          --dashboard-hero-end: #f4f6ff;
          --dashboard-shadow: 0 4px 18px rgba(16, 24, 40, 0.045);
          --dashboard-shadow-hover: 0 10px 26px rgba(16, 24, 40, 0.09);
        }

        [data-theme="dark"] {
          --dashboard-bg: #0f1420;
          --dashboard-card: #171d2a;
          --dashboard-surface: #131925;
          --dashboard-text: #f4f7fb;
          --dashboard-muted: #9ba6b7;
          --dashboard-border: #283143;
          --dashboard-accent: #818cf8;
          --dashboard-accent-soft: #24294a;
          --dashboard-badge-bg: #24294a;
          --dashboard-track: #2a3344;
          --dashboard-hero-start: #171d2a;
          --dashboard-hero-end: #1a2033;
          --dashboard-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          --dashboard-shadow-hover: 0 10px 28px rgba(0, 0, 0, 0.28);
        }

        body {
          margin: 0;
          background: var(--dashboard-bg);
        }
      `}</style>

      <div className="dashboard-page">
        <div
          style={{
            position: "fixed",
            top: 18,
            right: 28,
            zIndex: 10,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            className="dashboard-action"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>

          <button
            type="button"
            className="dashboard-action"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {children}
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string
  value: number
  meta: string
  icon: string
}) {
  return (
    <div className="dashboard-kpi">
      <div className="dashboard-kpi-top">
        <span className="dashboard-kpi-label">
          {label}
        </span>

        <span className="dashboard-kpi-icon">
          {icon}
        </span>
      </div>

      <p className="dashboard-kpi-value">
        {value.toLocaleString("en-IN")}
      </p>

      <p className="dashboard-kpi-meta">
        {meta}
      </p>
    </div>
  )
}

function WorkforcePanel({
  totalEmployees,
  activeEmployees,
  workforceStatuses,
}: {
  totalEmployees: number
  activeEmployees: number
  workforceStatuses: Array<{
    label: string
    value: number
    percentage: number
  }>
}) {
  const activeAngle =
    totalEmployees > 0
      ? (activeEmployees / totalEmployees) * 360
      : 0

  return (
    <div className="dashboard-panel">
      <h2 className="dashboard-panel-title">
        Workforce Status
      </h2>

      <p className="dashboard-panel-subtitle">
        Current employee distribution by employment status.
      </p>

      <div className="dashboard-workforce">
        <div
          className="dashboard-donut"
          style={
            {
              "--active-angle": `${activeAngle}deg`,
            } as React.CSSProperties
          }
        >
          <div className="dashboard-donut-center">
            <span className="dashboard-donut-value">
              {activeEmployees}
            </span>
            <span className="dashboard-donut-label">
              Active
            </span>
          </div>
        </div>

        <div className="dashboard-status-list">
          {workforceStatuses.map((status) => (
            <div
              className="dashboard-status-row"
              key={status.label}
            >
              <span className="dashboard-status-name">
                {status.label}
              </span>

              <span className="dashboard-status-value">
                {status.value}
              </span>

              <div className="dashboard-status-track">
                <div
                  className="dashboard-status-progress"
                  style={{
                    width: `${Math.min(status.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RoleDistribution({
  roleDistribution,
  maxRoleCount,
}: {
  roleDistribution: Array<[string, number]>
  maxRoleCount: number
}) {
  return (
    <div className="dashboard-panel">
      <h2 className="dashboard-panel-title">
        User Distribution
      </h2>

      <p className="dashboard-panel-subtitle">
        System users grouped by assigned role.
      </p>

      <div className="dashboard-role-list">
        {roleDistribution.length === 0 ? (
          <p className="dashboard-panel-subtitle">
            No role distribution data available.
          </p>
        ) : (
          roleDistribution.map(([role, count]) => (
            <div
              className="dashboard-role-row"
              key={role}
            >
              <span className="dashboard-role-name">
                {roleLabels[role] || role}
              </span>

              <span className="dashboard-role-count">
                {count}
              </span>

              <div className="dashboard-role-track">
                <div
                  className="dashboard-role-progress"
                  style={{
                    width: `${Math.min(
                      (count / maxRoleCount) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function QuickAction({
  item,
  navigate,
}: {
  item: ModuleItem
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <button
      type="button"
      className="dashboard-quick-action"
      onClick={() => navigate(item.path)}
    >
      <span className="dashboard-quick-left">
        <span className="dashboard-quick-icon">
          {item.icon}
        </span>

        <span>
          <span className="dashboard-quick-title">
            {item.label}
          </span>

          <span className="dashboard-quick-text">
            Open module
          </span>
        </span>
      </span>

      <span className="dashboard-quick-arrow">
        →
      </span>
    </button>
  )
}

function ModuleGrid({
  modules,
  navigate,
}: {
  modules: ModuleItem[]
  navigate: ReturnType<typeof useNavigate>
}) {
  if (modules.length === 0) {
    return (
      <div className="dashboard-panel">
        <p className="dashboard-panel-subtitle">
          No modules are currently available for this role.
        </p>
      </div>
    )
  }

  return (
    <div className="dashboard-module-grid">
      {modules.map((item) => (
        <button
          type="button"
          className="dashboard-module"
          key={item.path}
          onClick={() => navigate(item.path)}
        >
          <span className="dashboard-module-icon">
            {item.icon}
          </span>

          <p className="dashboard-module-title">
            {item.label}
          </p>

          <p className="dashboard-module-description">
            {item.description}
          </p>

          <span className="dashboard-module-arrow">
            Open Module →
          </span>
        </button>
      ))}
    </div>
  )
}

export default Dashboard