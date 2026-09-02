import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"

import { getDashboard } from "../api/dashboard"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

interface ModuleItem {
  label: string
  path: string
  description: string
  roles: string[]
  icon: string
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN:
    "Complete visibility and control across your organization's workforce and HR operations.",
  HR:
    "Manage people, HR operations, employee services and workforce information from one place.",
  MANAGER:
    "Monitor your team, manage daily workforce activities and access team HR services.",
  EMPLOYEE:
    "View your employment information and access the HR services available to you.",
}

const moduleItems: ModuleItem[] = [
  {
    label: "Employees",
    path: "/employees",
    description: "Manage employee records, profiles and workforce information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER"],
    icon: "EM",
  },
  {
    label: "Departments",
    path: "/departments",
    description: "Manage departments and organizational structure.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "DP",
  },
  {
    label: "Attendance",
    path: "/attendance",
    description: "Track attendance, check-ins, check-outs and daily presence.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "AT",
  },
  {
    label: "Leave",
    path: "/leave",
    description: "Manage leave requests, approvals and leave information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "LV",
  },
  {
    label: "Payroll",
    path: "/payroll",
    description: "Access payroll and employee compensation information.",
    roles: ["SUPER_ADMIN", "HR", "EMPLOYEE"],
    icon: "PY",
  },
  {
    label: "Performance",
    path: "/performance",
    description: "Review employee performance and development information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "PF",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    description: "Manage recruitment activities and candidate information.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "RC",
  },
  {
    label: "Documents",
    path: "/documents",
    description: "Access and manage important HR documents.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "DC",
  },
  {
    label: "Announcements",
    path: "/announcements",
    description: "View and manage important organization announcements.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "AN",
  },
  {
    label: "Holidays",
    path: "/holidays",
    description: "View organization holidays and upcoming days off.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "HD",
  },
]

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
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

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
    "Your HR management workspace."

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
    if (!user?.role) {
      return []
    }

    return moduleItems.filter((item) =>
      item.roles.includes(user.role),
    )
  }, [user?.role])

  const quickActionNames =
    user?.role === "SUPER_ADMIN"
      ? [
          "Employees",
          "Departments",
          "Attendance",
          "Leave",
          "Recruitment",
          "Documents",
        ]
      : user?.role === "HR"
        ? [
            "Employees",
            "Departments",
            "Attendance",
            "Leave",
            "Recruitment",
            "Documents",
          ]
        : user?.role === "MANAGER"
          ? [
              "Employees",
              "Attendance",
              "Leave",
              "Performance",
              "Documents",
              "Announcements",
            ]
          : [
              "Attendance",
              "Leave",
              "Payroll",
              "Performance",
              "Documents",
              "Holidays",
            ]

  const quickActions = quickActionNames
    .map((name) =>
      visibleModules.find((item) => item.label === name),
    )
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

  const roleDistribution = Object.entries(
    userMetrics?.roles ?? {},
  ).sort(([, first], [, second]) => second - first)

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
      value:
        employeeProfile?.employee_id ||
        user?.employee_id ||
        "Not available",
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
      value:
        employeeProfile?.employment_status ||
        "Not available",
    },
    {
      label: "Employment Type",
      value:
        employeeProfile?.employment_type ||
        "Not available",
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
      value:
        employeeProfile?.email ||
        user?.email ||
        "Not available",
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout isDarkMode={isDarkMode}>
        <DashboardState
          title="Loading dashboard"
          text="Preparing your HR management workspace."
          loading
        />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout isDarkMode={isDarkMode}>
        <DashboardState
          title="Dashboard unavailable"
          text={error}
          actionLabel="Try Again"
          onAction={() => void loadDashboard()}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isDarkMode={isDarkMode}>
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-eyebrow">
              HR MANAGEMENT SYSTEM
            </p>

            <h1 className="dashboard-title">
              Dashboard
            </h1>

            <p className="dashboard-subtitle">
              Welcome back, {displayName}. Here is your
              workspace overview.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => void loadDashboard()}
          >
            Refresh Data
          </button>
        </header>

        <section className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <span className="dashboard-role-badge">
              {currentRole}
            </span>

            <h2>
              {getGreeting()}, {displayName}
            </h2>

            <p>{roleDescription}</p>
          </div>

          <div className="dashboard-user-summary">
            <div className="dashboard-avatar">
              {personalInitials}
            </div>

            <div>
              <strong>{personalName}</strong>
              <span>{currentRole}</span>
            </div>
          </div>
        </section>

        {user?.role === "EMPLOYEE" && (
          <EmployeeDashboard
            personalProfileCards={personalProfileCards}
            visibleModules={visibleModules}
            navigate={navigate}
          />
        )}

        {user?.role === "MANAGER" && (
          <ManagerDashboard
            totalEmployees={totalEmployees}
            activeEmployees={activeEmployees}
            inactiveEmployees={inactiveEmployees}
            resignedEmployees={resignedEmployees}
            activePercentage={activePercentage}
            workforceStatuses={workforceStatuses}
            quickActions={quickActions}
            visibleModules={visibleModules}
            navigate={navigate}
          />
        )}

        {(user?.role === "SUPER_ADMIN" ||
          user?.role === "HR") && (
          <AdminHrDashboard
            role={user.role}
            totalEmployees={totalEmployees}
            activeEmployees={activeEmployees}
            inactiveEmployees={inactiveEmployees}
            totalUsers={totalUsers}
            activePercentage={activePercentage}
            workforceStatuses={workforceStatuses}
            roleDistribution={roleDistribution}
            maxRoleCount={maxRoleCount}
            quickActions={quickActions}
            visibleModules={visibleModules}
            navigate={navigate}
          />
        )}

        <footer className="dashboard-footer">
          <span>{personalName}</span>
          <span className="dashboard-footer-separator">
            |
          </span>
          <span>{currentRole}</span>
        </footer>
      </div>
    </DashboardLayout>
  )
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Good morning"
  }

  if (hour < 17) {
    return "Good afternoon"
  }

  return "Good evening"
}

function DashboardLayout({
  children,
  isDarkMode,
}: {
  children: ReactNode
  isDarkMode: boolean
}) {
  return (
    <div
      className={`dashboard-page ${
        isDarkMode ? "dashboard-dark" : ""
      }`}
    >
      <style>{dashboardStyles}</style>
      {children}
    </div>
  )
}

function EmployeeDashboard({
  personalProfileCards,
  visibleModules,
  navigate,
}: {
  personalProfileCards: Array<{
    label: string
    value: string
  }>
  visibleModules: ModuleItem[]
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <>
      <SectionHeader
        title="My Employment Profile"
        description="Your current employment information."
      />

      <div className="dashboard-profile-card">
        <div className="dashboard-profile-grid">
          {personalProfileCards.map((card) => (
            <InfoCard
              key={card.label}
              label={card.label}
              value={card.value}
            />
          ))}
        </div>
      </div>

      <SectionHeader
        title="My HR Workspace"
        description="Quick access to your personal HR services."
      />

      <ModuleGrid
        modules={visibleModules}
        navigate={navigate}
      />
    </>
  )
}

function ManagerDashboard({
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  resignedEmployees,
  activePercentage,
  workforceStatuses,
  quickActions,
  visibleModules,
  navigate,
}: {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  resignedEmployees: number
  activePercentage: number
  workforceStatuses: WorkforceStatus[]
  quickActions: ModuleItem[]
  visibleModules: ModuleItem[]
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <>
      <SectionHeader
        title="Team Overview"
        description="A focused view of the workforce available to your manager role."
      />

      <div className="dashboard-kpi-grid">
        <MetricCard
          label="Team Employees"
          value={totalEmployees}
          meta="Accessible team members"
          icon="TM"
        />

        <MetricCard
          label="Active"
          value={activeEmployees}
          meta={`${activePercentage}% of your team`}
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

      <div className="dashboard-two-column">
        <WorkforcePanel
          totalEmployees={totalEmployees}
          activeEmployees={activeEmployees}
          workforceStatuses={workforceStatuses}
        />

        <QuickActionsPanel
          title="Team Actions"
          description="Frequently used manager operations."
          actions={quickActions}
          navigate={navigate}
        />
      </div>

      <SectionHeader
        title="Manager Modules"
        description="All modules currently available to your role."
      />

      <ModuleGrid
        modules={visibleModules}
        navigate={navigate}
      />
    </>
  )
}

function AdminHrDashboard({
  role,
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  totalUsers,
  activePercentage,
  workforceStatuses,
  roleDistribution,
  maxRoleCount,
  quickActions,
  visibleModules,
  navigate,
}: {
  role: string
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  totalUsers: number
  activePercentage: number
  workforceStatuses: WorkforceStatus[]
  roleDistribution: Array<[string, number]>
  maxRoleCount: number
  quickActions: ModuleItem[]
  visibleModules: ModuleItem[]
  navigate: ReturnType<typeof useNavigate>
}) {
  const isSuperAdmin = role === "SUPER_ADMIN"

  return (
    <>
      <SectionHeader
        title={
          isSuperAdmin
            ? "Organization Overview"
            : "HR Workforce Overview"
        }
        description={
          isSuperAdmin
            ? "Complete workforce and system visibility."
            : "Workforce information and operational HR visibility."
        }
      />

      <div className="dashboard-kpi-grid">
        <MetricCard
          label="Total Employees"
          value={totalEmployees}
          meta="Organization workforce"
          icon="EM"
        />

        <MetricCard
          label="Active Employees"
          value={activeEmployees}
          meta={`${activePercentage}% of workforce`}
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

      <div className="dashboard-two-column">
        <WorkforcePanel
          totalEmployees={totalEmployees}
          activeEmployees={activeEmployees}
          workforceStatuses={workforceStatuses}
        />

        {isSuperAdmin ? (
          <RoleDistribution
            roleDistribution={roleDistribution}
            maxRoleCount={maxRoleCount}
          />
        ) : (
          <QuickActionsPanel
            title="HR Operations"
            description="Frequently used HR operations."
            actions={quickActions}
            navigate={navigate}
          />
        )}
      </div>

      {isSuperAdmin && (
        <>
          <SectionHeader
            title="Administrative Actions"
            description="Direct access to commonly used organization controls."
          />

          <div className="dashboard-action-grid">
            {quickActions.map((item) => (
              <QuickAction
                key={item.path}
                item={item}
                navigate={navigate}
              />
            ))}
          </div>
        </>
      )}

      <SectionHeader
        title="HRMS Modules"
        description="Access all modules available to your role."
      />

      <ModuleGrid
        modules={visibleModules}
        navigate={navigate}
      />
    </>
  )
}

interface WorkforceStatus {
  label: string
  value: number
  percentage: number
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="dashboard-section-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
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
      <div className="dashboard-kpi-heading">
        <span>{label}</span>
        <b>{icon}</b>
      </div>

      <strong>
        {value.toLocaleString("en-IN")}
      </strong>

      <small>{meta}</small>
    </div>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const muted =
    value === "Not available" ||
    value === "Not assigned"

  return (
    <div className="dashboard-info-card">
      <span>{label}</span>
      <strong className={muted ? "muted" : ""}>
        {value}
      </strong>
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
  workforceStatuses: WorkforceStatus[]
}) {
  const activeAngle =
    totalEmployees > 0
      ? (activeEmployees / totalEmployees) * 360
      : 0

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Workforce Status</h2>
          <p>
            Current employee distribution by employment status.
          </p>
        </div>
      </div>

      <div className="dashboard-workforce">
        <div
          className="dashboard-donut"
          style={
            {
              "--active-angle": `${activeAngle}deg`,
            } as CSSProperties
          }
        >
          <div className="dashboard-donut-center">
            <strong>{activeEmployees}</strong>
            <span>Active</span>
          </div>
        </div>

        <div className="dashboard-status-list">
          {workforceStatuses.map((status) => (
            <div
              className="dashboard-status-row"
              key={status.label}
            >
              <div className="dashboard-status-top">
                <span>{status.label}</span>
                <strong>{status.value}</strong>
              </div>

              <div className="dashboard-status-track">
                <div
                  className="dashboard-status-progress"
                  style={{
                    width: `${Math.min(
                      status.percentage,
                      100,
                    )}%`,
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
      <div className="dashboard-panel-heading">
        <div>
          <h2>User Distribution</h2>
          <p>
            System users grouped by assigned role.
          </p>
        </div>
      </div>

      <div className="dashboard-role-list">
        {roleDistribution.length === 0 ? (
          <p className="dashboard-empty-text">
            No role distribution data available.
          </p>
        ) : (
          roleDistribution.map(([role, count]) => (
            <div
              className="dashboard-role-row"
              key={role}
            >
              <div className="dashboard-role-top">
                <span>
                  {roleLabels[role] || role}
                </span>

                <strong>{count}</strong>
              </div>

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

function QuickActionsPanel({
  title,
  description,
  actions,
  navigate,
}: {
  title: string
  description: string
  actions: ModuleItem[]
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="dashboard-quick-list">
        {actions.map((item) => (
          <QuickAction
            key={item.path}
            item={item}
            navigate={navigate}
          />
        ))}
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

        <span className="dashboard-quick-copy">
          <strong>{item.label}</strong>
          <small>Open module</small>
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
        <p className="dashboard-empty-text">
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

          <strong>{item.label}</strong>

          <p>{item.description}</p>

          <span className="dashboard-module-link">
            Open Module →
          </span>
        </button>
      ))}
    </div>
  )
}

function DashboardState({
  title,
  text,
  loading = false,
  actionLabel,
  onAction,
}: {
  title: string
  text: string
  loading?: boolean
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="dashboard-state">
      <div className="dashboard-state-card">
        {loading && (
          <div className="dashboard-spinner" />
        )}

        <h2>{title}</h2>
        <p>{text}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            className="dashboard-state-button"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

const dashboardStyles = `
  .dashboard-page {
    --dashboard-bg: #f5f7fb;
    --dashboard-card: #ffffff;
    --dashboard-surface: #f8fafc;
    --dashboard-text: #172033;
    --dashboard-muted: #687386;
    --dashboard-border: #e5e9f0;
    --dashboard-accent: #4f46e5;
    --dashboard-accent-soft: #eef2ff;
    --dashboard-track: #e9edf3;
    --dashboard-shadow: 0 4px 18px rgba(16, 24, 40, 0.05);
    --dashboard-shadow-hover: 0 12px 30px rgba(16, 24, 40, 0.10);

    width: 100%;
    min-height: calc(100vh - 48px);
    background: var(--dashboard-bg);
    color: var(--dashboard-text);
    border-radius: 18px;
  }

  .dashboard-dark {
    --dashboard-bg: #0f1420;
    --dashboard-card: #171d2a;
    --dashboard-surface: #131925;
    --dashboard-text: #f4f7fb;
    --dashboard-muted: #9ba6b7;
    --dashboard-border: #283143;
    --dashboard-accent: #818cf8;
    --dashboard-accent-soft: #24294a;
    --dashboard-track: #2a3344;
    --dashboard-shadow: 0 4px 20px rgba(0, 0, 0, 0.20);
    --dashboard-shadow-hover: 0 12px 30px rgba(0, 0, 0, 0.28);
  }

  .dashboard-shell {
    width: 100%;
    max-width: 1480px;
    margin: 0 auto;
    padding: 8px 0 30px;
  }

  .dashboard-topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }

  .dashboard-eyebrow {
    margin: 0 0 7px;
    color: var(--dashboard-accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .dashboard-title {
    margin: 0;
    color: var(--dashboard-text);
    font-size: clamp(28px, 3vw, 38px);
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .dashboard-subtitle {
    margin: 9px 0 0;
    color: var(--dashboard-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .dashboard-refresh,
  .dashboard-state-button {
    border: 1px solid var(--dashboard-border);
    border-radius: 10px;
    background: var(--dashboard-card);
    color: var(--dashboard-text);
    padding: 10px 15px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--dashboard-shadow);
    transition: 0.2s ease;
  }

  .dashboard-refresh:hover,
  .dashboard-state-button:hover {
    border-color: var(--dashboard-accent);
    color: var(--dashboard-accent);
    transform: translateY(-1px);
  }

  .dashboard-welcome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    padding: 28px 30px;
    margin-bottom: 28px;
    border: 1px solid var(--dashboard-border);
    border-radius: 18px;
    background:
      linear-gradient(
        135deg,
        var(--dashboard-card),
        var(--dashboard-accent-soft)
      );
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-welcome-content {
    min-width: 0;
  }

  .dashboard-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dashboard-welcome h2 {
    margin: 13px 0 7px;
    color: var(--dashboard-text);
    font-size: clamp(21px, 2vw, 28px);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .dashboard-welcome p {
    max-width: 700px;
    margin: 0;
    color: var(--dashboard-muted);
    font-size: 14px;
    line-height: 1.65;
  }

  .dashboard-user-summary {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 190px;
    padding-left: 20px;
    border-left: 1px solid var(--dashboard-border);
  }

  .dashboard-avatar {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    flex: 0 0 52px;
    border-radius: 15px;
    background: var(--dashboard-accent);
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
  }

  .dashboard-user-summary div:last-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dashboard-user-summary strong {
    overflow: hidden;
    color: var(--dashboard-text);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-user-summary span {
    margin-top: 3px;
    color: var(--dashboard-muted);
    font-size: 12px;
  }

  .dashboard-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin: 30px 0 14px;
  }

  .dashboard-section-header h2 {
    margin: 0;
    color: var(--dashboard-text);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.015em;
  }

  .dashboard-section-header p {
    margin: 5px 0 0;
    color: var(--dashboard-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .dashboard-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .dashboard-kpi {
    min-width: 0;
    padding: 19px;
    border: 1px solid var(--dashboard-border);
    border-radius: 15px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-kpi-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dashboard-kpi-heading span {
    color: var(--dashboard-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-kpi-heading b {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 10px;
    letter-spacing: 0.03em;
  }

  .dashboard-kpi > strong {
    display: block;
    margin-top: 17px;
    color: var(--dashboard-text);
    font-size: 30px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .dashboard-kpi > small {
    display: block;
    margin-top: 10px;
    color: var(--dashboard-muted);
    font-size: 11px;
    line-height: 1.4;
  }

  .dashboard-two-column {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 14px;
    margin-top: 14px;
  }

  .dashboard-panel,
  .dashboard-profile-card {
    min-width: 0;
    border: 1px solid var(--dashboard-border);
    border-radius: 15px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
  }

  .dashboard-panel {
    padding: 21px;
  }

  .dashboard-panel-heading {
    margin-bottom: 20px;
  }

  .dashboard-panel-heading h2 {
    margin: 0;
    color: var(--dashboard-text);
    font-size: 16px;
    font-weight: 800;
  }

  .dashboard-panel-heading p {
    margin: 5px 0 0;
    color: var(--dashboard-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .dashboard-workforce {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    align-items: center;
    gap: 28px;
  }

  .dashboard-donut {
    position: relative;
    width: 176px;
    height: 176px;
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
    position: absolute;
    content: "";
    inset: 22px;
    border-radius: 50%;
    background: var(--dashboard-card);
  }

  .dashboard-donut-center {
    position: absolute;
    z-index: 1;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .dashboard-donut-center strong {
    color: var(--dashboard-text);
    font-size: 27px;
    line-height: 1;
    font-weight: 800;
  }

  .dashboard-donut-center span {
    margin-top: 6px;
    color: var(--dashboard-muted);
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-status-list,
  .dashboard-role-list {
    display: flex;
    flex-direction: column;
    gap: 17px;
  }

  .dashboard-status-top,
  .dashboard-role-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 7px;
  }

  .dashboard-status-top span,
  .dashboard-role-top span {
    color: var(--dashboard-text);
    font-size: 12px;
    font-weight: 650;
  }

  .dashboard-status-top strong,
  .dashboard-role-top strong {
    color: var(--dashboard-text);
    font-size: 12px;
    font-weight: 800;
  }

  .dashboard-status-track,
  .dashboard-role-track {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--dashboard-track);
  }

  .dashboard-status-progress,
  .dashboard-role-progress {
    height: 100%;
    border-radius: inherit;
    background: var(--dashboard-accent);
    transition: width 0.3s ease;
  }

  .dashboard-profile-card {
    padding: 20px;
  }

  .dashboard-profile-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .dashboard-info-card {
    min-width: 0;
    padding: 15px;
    border: 1px solid var(--dashboard-border);
    border-radius: 12px;
    background: var(--dashboard-surface);
  }

  .dashboard-info-card span {
    display: block;
    color: var(--dashboard-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dashboard-info-card strong {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    color: var(--dashboard-text);
    font-size: 13px;
    font-weight: 750;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-info-card strong.muted {
    color: var(--dashboard-muted);
    font-weight: 600;
  }

  .dashboard-quick-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .dashboard-action-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .dashboard-quick-action {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--dashboard-border);
    border-radius: 11px;
    background: var(--dashboard-surface);
    color: var(--dashboard-text);
    text-align: left;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }

  .dashboard-quick-action:hover {
    border-color: var(--dashboard-accent);
    background: var(--dashboard-accent-soft);
    transform: translateY(-1px);
  }

  .dashboard-quick-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .dashboard-quick-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 9px;
    background: var(--dashboard-card);
    color: var(--dashboard-accent);
    font-size: 9px;
    font-weight: 800;
    border: 1px solid var(--dashboard-border);
  }

  .dashboard-quick-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dashboard-quick-copy strong {
    overflow: hidden;
    color: var(--dashboard-text);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-quick-copy small {
    margin-top: 3px;
    color: var(--dashboard-muted);
    font-size: 10px;
  }

  .dashboard-quick-arrow {
    flex: 0 0 auto;
    color: var(--dashboard-accent);
    font-size: 18px;
    line-height: 1;
  }

  .dashboard-module-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-module {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    min-height: 184px;
    padding: 18px;
    border: 1px solid var(--dashboard-border);
    border-radius: 14px;
    background: var(--dashboard-card);
    color: var(--dashboard-text);
    text-align: left;
    box-shadow: var(--dashboard-shadow);
    cursor: pointer;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .dashboard-module:hover {
    border-color: var(--dashboard-accent);
    box-shadow: var(--dashboard-shadow-hover);
    transform: translateY(-2px);
  }

  .dashboard-module-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: var(--dashboard-accent-soft);
    color: var(--dashboard-accent);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-module strong {
    margin-top: 16px;
    color: var(--dashboard-text);
    font-size: 14px;
    font-weight: 800;
  }

  .dashboard-module p {
    min-height: 48px;
    margin: 7px 0 14px;
    color: var(--dashboard-muted);
    font-size: 11px;
    line-height: 1.55;
  }

  .dashboard-module-link {
    margin-top: auto;
    color: var(--dashboard-accent);
    font-size: 11px;
    font-weight: 800;
  }

  .dashboard-empty-text {
    margin: 0;
    color: var(--dashboard-muted);
    font-size: 13px;
  }

  .dashboard-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 34px;
    padding: 18px 0 4px;
    border-top: 1px solid var(--dashboard-border);
    color: var(--dashboard-muted);
    font-size: 11px;
  }

  .dashboard-footer span:first-child {
    color: var(--dashboard-text);
    font-weight: 700;
  }

  .dashboard-state {
    min-height: 65vh;
    display: grid;
    place-items: center;
    padding: 30px;
  }

  .dashboard-state-card {
    width: min(430px, 100%);
    padding: 32px;
    border: 1px solid var(--dashboard-border);
    border-radius: 16px;
    background: var(--dashboard-card);
    box-shadow: var(--dashboard-shadow);
    text-align: center;
  }

  .dashboard-state-card h2 {
    margin: 18px 0 8px;
    color: var(--dashboard-text);
    font-size: 20px;
  }

  .dashboard-state-card p {
    margin: 0 0 20px;
    color: var(--dashboard-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .dashboard-spinner {
    width: 34px;
    height: 34px;
    margin: 0 auto;
    border: 3px solid var(--dashboard-track);
    border-top-color: var(--dashboard-accent);
    border-radius: 50%;
    animation: dashboard-spin 0.8s linear infinite;
  }

  @keyframes dashboard-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1180px) {
    .dashboard-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-profile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .dashboard-topbar {
      align-items: flex-start;
    }

    .dashboard-two-column {
      grid-template-columns: 1fr;
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-user-summary {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .dashboard-page {
      border-radius: 12px;
    }

    .dashboard-shell {
      padding: 0 0 20px;
    }

    .dashboard-topbar {
      flex-direction: column;
      gap: 15px;
    }

    .dashboard-refresh {
      width: 100%;
    }

    .dashboard-welcome {
      padding: 21px;
    }

    .dashboard-kpi-grid,
    .dashboard-module-grid,
    .dashboard-profile-grid,
    .dashboard-action-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-workforce {
      grid-template-columns: 1fr;
    }

    .dashboard-donut {
      width: 155px;
      height: 155px;
    }

    .dashboard-panel,
    .dashboard-profile-card {
      padding: 16px;
    }

    .dashboard-section-header {
      margin-top: 24px;
    }
  }
`

export default Dashboard