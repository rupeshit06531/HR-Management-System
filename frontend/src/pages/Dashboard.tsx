import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"

import {
  getAttendance,
  punchInAttendance,
  punchOutAttendance,
  type Attendance,
} from "../api/attendance"
import { getDashboard } from "../api/dashboard"
import { getAnnouncements, type AnnouncementRecord } from "../api/announcements"
import { getHolidays, type Holiday } from "../api/holidays"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

interface ModuleItem {
  label: string
  path: string
  description: string
  roles: string[]
  icon: string
}

interface WorkforceStatus {
  label: string
  value: number
  percentage: number
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
    description: "Manage employee records and workforce information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER"],
    icon: "♟",
  },
  {
    label: "Departments",
    path: "/departments",
    description: "Manage departments and organizational structure.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "▦",
  },
  {
    label: "Attendance",
    path: "/attendance",
    description: "Track attendance and daily workforce presence.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "◷",
  },
  {
    label: "Leave",
    path: "/leave",
    description: "Manage leave requests and approvals.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "▣",
  },
  {
    label: "Payroll",
    path: "/payroll",
    description: "Access payroll and compensation information.",
    roles: ["SUPER_ADMIN", "HR", "EMPLOYEE"],
    icon: "₹",
  },
  {
    label: "Performance",
    path: "/performance",
    description: "Review performance and development information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "↗",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    description: "Manage recruitment and candidate information.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "◎",
  },
  {
    label: "Documents",
    path: "/documents",
    description: "Access important HR documents.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "▤",
  },
  {
    label: "Announcements",
    path: "/announcements",
    description: "View important organization announcements.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "!",
  },
  {
    label: "Holidays",
    path: "/holidays",
    description: "View upcoming organization holidays.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "★",
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
  const parts = name.trim().split(/\s+/).filter(Boolean)

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

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [contentError, setContentError] = useState("")

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

  async function loadDashboardContent() {
    try {
      setContentError("")

      const [announcementResponse, holidayResponse] =
        await Promise.all([
          getAnnouncements({
            is_active: true,
          }),
          getHolidays({
            is_active: true,
          }),
        ])

      setAnnouncements(
        announcementResponse.results.filter(
          (announcement) => announcement.is_published,
        ),
      )

      setHolidays(
        holidayResponse.results,
      )
    } catch {
      setContentError(
        "Unable to load announcements and holidays.",
      )
    }
  }

  useEffect(() => {
    void loadDashboard()
    void loadDashboardContent()
  }, [])

  const role = user?.role ?? ""
  const currentRole = roleLabels[role] || role || "User"
  const roleDescription =
    roleDescriptions[role] || "Your HR management workspace."

  const displayName =
    user?.first_name?.trim() || user?.username || "User"

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
    if (!role) {
      return []
    }

    return moduleItems.filter((item) => item.roles.includes(role))
  }, [role])

  const quickActionNames =
    role === "SUPER_ADMIN" || role === "HR"
      ? [
          "Employees",
          "Departments",
          "Attendance",
          "Leave",
          "Recruitment",
          "Documents",
        ]
      : role === "MANAGER"
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

  const workforceStatuses: WorkforceStatus[] = [
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
        <header className="dashboard-page-header">
          <div>
            <p className="dashboard-eyebrow">HR MANAGEMENT SYSTEM</p>
            <h1>Dashboard</h1>
            <p>
              Welcome back, {displayName}. Here is your workspace
              overview.
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
          <div className="dashboard-welcome-copy">
            <span className="dashboard-role-badge">
              {currentRole}
            </span>

            <h2>Welcome back, {displayName}</h2>

            <p>{roleDescription}</p>
          </div>

          <div className="dashboard-welcome-visual">
            <div className="dashboard-visual-window">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="dashboard-visual-chart">
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="dashboard-visual-block" />
          </div>
        </section>

        {role === "EMPLOYEE" && (
          <EmployeeDashboard
            personalName={personalName}
            personalInitials={personalInitials}
            personalProfileCards={personalProfileCards}
            visibleModules={visibleModules}
            navigate={navigate}
          />
        )}

        {role === "MANAGER" && (
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

        {(role === "SUPER_ADMIN" || role === "HR") && (
          <AdminHrDashboard
            role={role}
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
            announcements={announcements}
            holidays={holidays}
            contentError={contentError}
          />
        )}

        <footer className="dashboard-footer">
          <span>{personalName}</span>
          <span>•</span>
          <span>{currentRole}</span>
        </footer>
      </div>
    </DashboardLayout>
  )
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
      className={`dashboard-page dashboard-compact ${
        isDarkMode ? "dashboard-dark" : ""
      }`}
    >
      <style>{dashboardStyles}</style>
      {children}
    </div>
  )
}

function EmployeeDashboard({
  personalName,
  personalInitials,
  personalProfileCards,
  visibleModules,
  navigate,
}: {
  personalName: string
  personalInitials: string
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

      <div className="dashboard-profile-layout">
        <div className="dashboard-person-card">
          <div className="dashboard-large-avatar">
            {personalInitials}
          </div>

          <h3>{personalName}</h3>

          <p>Employee Workspace</p>

          <div className="dashboard-person-status">
            Active Employee
          </div>
        </div>

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
      </div>

      <EmployeeTodayAttendance />

      <SectionHeader
        title="My HR Workspace"
        description="Quick access to your personal HR services."
      />

      <ModuleGrid
        modules={visibleModules.filter((module) =>
          [
            "Attendance",
            "Leave",
            "Payroll",
            "Performance",
            "Documents",
            "Holidays",
          ].includes(module.label),
        )}
        navigate={navigate}
      />
    </>
  )
}

function EmployeeTodayAttendance() {
  const [attendance, setAttendance] =
    useState<Attendance | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isPunchingIn, setIsPunchingIn] =
    useState(false)

  const [isPunchingOut, setIsPunchingOut] =
    useState(false)

  const [selfieFile, setSelfieFile] =
    useState<File | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const getTodayDate = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(
      now.getMonth() + 1,
    ).padStart(2, "0")
    const day = String(
      now.getDate(),
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const formatTime = (
    value: string | null,
  ) => {
    if (!value) {
      return "--"
    }

    const parts = value.split(":")

    if (parts.length < 2) {
      return value
    }

    const hours = Number(parts[0])
    const minutes = Number(parts[1])

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return value
    }

    const period =
      hours >= 12 ? "PM" : "AM"

    const displayHours =
      hours % 12 || 12

    return `${displayHours}:${String(
      minutes,
    ).padStart(2, "0")} ${period}`
  }

  const loadTodayAttendance =
    async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response =
          await getAttendance()

        const today =
          getTodayDate()

        const todayRecord =
          response.results.find(
            (record) =>
              record.date === today,
          ) ?? null

        setAttendance(todayRecord)
      } catch (requestError) {
        console.error(
          "Failed to load today's attendance:",
          requestError,
        )

        setError(
          "Unable to load today's attendance.",
        )
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    void loadTodayAttendance()
  }, [])

  const getCurrentLocation =
    async () => {
      if (!navigator.geolocation) {
        throw new Error(
          "Geolocation is not supported by this browser.",
        )
      }

      return new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            },
          )
        },
      )
    }

  const handlePunchIn = async () => {
    setError(null)
    setSuccess(null)

    if (!selfieFile) {
      setError(
        "Please capture a selfie before punching in.",
      )
      return
    }

    try {
      setIsPunchingIn(true)

      const position =
        await getCurrentLocation()

      const latitude = Number(
        position.coords.latitude.toFixed(6),
      )

      const longitude = Number(
        position.coords.longitude.toFixed(6),
      )

      const accuracy =
        Number.isFinite(
          position.coords.accuracy,
        )
          ? Number(
              Math.max(
                0,
                position.coords.accuracy,
              ).toFixed(2),
            )
          : null

      const response =
        await punchInAttendance({
          latitude,
          longitude,
          accuracy,
          selfie: selfieFile,
        })

      setAttendance(
        response.attendance,
      )

      setSelfieFile(null)

      setSuccess(
        response.message ||
          "Punch-in successful.",
      )
    } catch (punchError) {
      console.error(
        "Dashboard punch-in error:",
        punchError,
      )

      if (
        punchError instanceof
        GeolocationPositionError
      ) {
        if (
          punchError.code ===
          GeolocationPositionError.PERMISSION_DENIED
        ) {
          setError(
            "Location permission was denied. Please allow location access and try again.",
          )
        } else if (
          punchError.code ===
          GeolocationPositionError.POSITION_UNAVAILABLE
        ) {
          setError(
            "Unable to determine your current location.",
          )
        } else {
          setError(
            "Location request timed out. Please try again.",
          )
        }

        return
      }

      const axiosError =
        punchError as {
          response?: {
            data?: unknown
          }
        }

      const responseData =
        axiosError.response?.data

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const data =
          responseData as Record<
            string,
            unknown
          >

        if (
          typeof data.detail ===
          "string"
        ) {
          setError(data.detail)
          return
        }

        const messages =
          Object.entries(data).flatMap(
            ([field, value]) => {
              if (Array.isArray(value)) {
                return value.map(
                  (message) =>
                    `${field}: ${String(message)}`,
                )
              }

              if (
                typeof value === "string"
              ) {
                return [
                  `${field}: ${value}`,
                ]
              }

              return []
            },
          )

        if (messages.length > 0) {
          setError(
            messages.join(" | "),
          )
          return
        }
      }

      setError(
        "Unable to punch in attendance. Please try again.",
      )
    } finally {
      setIsPunchingIn(false)
    }
  }

  const handlePunchOut = async () => {
    setError(null)
    setSuccess(null)

    if (!attendance?.check_in) {
      setError(
        "Please punch in before punching out.",
      )
      return
    }

    if (!selfieFile) {
      setError(
        "Please capture a selfie before punching out.",
      )
      return
    }

    try {
      setIsPunchingOut(true)

      const position =
        await getCurrentLocation()

      const latitude = Number(
        position.coords.latitude.toFixed(6),
      )

      const longitude = Number(
        position.coords.longitude.toFixed(6),
      )

      const accuracy =
        Number.isFinite(
          position.coords.accuracy,
        )
          ? Number(
              Math.max(
                0,
                position.coords.accuracy,
              ).toFixed(2),
            )
          : null

      const response =
        await punchOutAttendance({
          latitude,
          longitude,
          accuracy,
          selfie: selfieFile,
        })

      setAttendance(
        response.attendance,
      )

      setSelfieFile(null)

      setSuccess(
        response.message ||
          "Punch-out successful.",
      )
    } catch (punchError) {
      console.error(
        "Dashboard punch-out error:",
        punchError,
      )

      if (
        punchError instanceof
        GeolocationPositionError
      ) {
        if (
          punchError.code ===
          GeolocationPositionError.PERMISSION_DENIED
        ) {
          setError(
            "Location permission was denied. Please allow location access and try again.",
          )
        } else if (
          punchError.code ===
          GeolocationPositionError.POSITION_UNAVAILABLE
        ) {
          setError(
            "Unable to determine your current location.",
          )
        } else {
          setError(
            "Location request timed out. Please try again.",
          )
        }

        return
      }

      const axiosError =
        punchError as {
          response?: {
            data?: unknown
          }
        }

      const responseData =
        axiosError.response?.data

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const data =
          responseData as Record<
            string,
            unknown
          >

        if (
          typeof data.detail ===
          "string"
        ) {
          setError(data.detail)
          return
        }

        const messages =
          Object.entries(data).flatMap(
            ([field, value]) => {
              if (Array.isArray(value)) {
                return value.map(
                  (message) =>
                    `${field}: ${String(message)}`,
                )
              }

              if (
                typeof value === "string"
              ) {
                return [
                  `${field}: ${value}`,
                ]
              }

              return []
            },
          )

        if (messages.length > 0) {
          setError(
            messages.join(" | "),
          )
          return
        }
      }

      setError(
        "Unable to punch out attendance. Please try again.",
      )
    } finally {
      setIsPunchingOut(false)
    }
  }

  const handleSelfieChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null

    setSelfieFile(file)
    setError(null)
    setSuccess(null)
  }

  return (
    <section className="dashboard-panel dashboard-today-attendance">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Today's Attendance</h2>
          <p>
            Your attendance status for today.
          </p>
        </div>

        <span className="dashboard-role-badge">
          {attendance?.check_out
            ? "Completed"
            : attendance?.check_in
              ? "Working"
              : "Not Punched"}
        </span>
      </div>

      {isLoading ? (
        <p>Loading attendance...</p>
      ) : (
        <>
          <div className="dashboard-attendance-summary">
            <div>
              <span>Date</span>
              <strong>
                {getTodayDate()}
              </strong>
            </div>

            <div>
              <span>Punch In</span>
              <strong>
                {formatTime(
                  attendance?.check_in ??
                    null,
                )}
              </strong>
            </div>

            <div>
              <span>Punch Out</span>
              <strong>
                {formatTime(
                  attendance?.check_out ??
                    null,
                )}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {attendance?.status
                  ? attendance.status
                      .replace(
                        /_/g,
                        " ",
                      )
                      .replace(
                        /\b\w/g,
                        (character) =>
                          character.toUpperCase(),
                      )
                  : "Not punched"}
              </strong>
            </div>
          </div>

          {!attendance?.check_out && (
            <div className="dashboard-attendance-actions">
              <label className="dashboard-selfie-input">
                <span>
                  {selfieFile
                    ? selfieFile.name
                    : "Capture Selfie"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={
                    handleSelfieChange
                  }
                />
              </label>

              {!attendance?.check_in && (
                <button
                  type="button"
                  className="dashboard-attendance-button"
                  onClick={() =>
                    void handlePunchIn()
                  }
                  disabled={isPunchingIn}
                >
                  {isPunchingIn
                    ? "Punching In..."
                    : "Punch In"}
                </button>
              )}

              {attendance?.check_in &&
                !attendance?.check_out && (
                  <button
                    type="button"
                    className="dashboard-attendance-button"
                    onClick={() =>
                      void handlePunchOut()
                    }
                    disabled={
                      isPunchingOut
                    }
                  >
                    {isPunchingOut
                      ? "Punching Out..."
                      : "Punch Out"}
                  </button>
                )}
            </div>
          )}

          {error && (
            <p className="dashboard-state-error">
              {error}
            </p>
          )}

          {success && (
            <p className="dashboard-state-success">
              {success}
            </p>
          )}
        </>
      )}
    </section>
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
        description="A focused view of your available workforce information."
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
          meta={`${activePercentage}% of team`}
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
        description="All modules available to your role."
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
  announcements,
  holidays,
  contentError,
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
  announcements: AnnouncementRecord[]
  holidays: Holiday[]
  contentError: string
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

      <SectionHeader
        title={
          isSuperAdmin
            ? "Administrative Actions"
            : "HR Operations"
        }
        description={
          isSuperAdmin
            ? "Direct access to frequently used organization controls."
            : "Direct access to frequently used HR operations."
        }
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

      <SectionHeader
        title="HRMS Modules"
        description="Access all modules available to your role."
      />

      <ModuleGrid
        modules={visibleModules}
        navigate={navigate}
      />

      <DashboardBottomPanels
        announcements={announcements}
        holidays={holidays}
        contentError={contentError}
      />
    </>
  )
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
      <div className="dashboard-kpi-top">
        <span>{label}</span>
        <b>{icon}</b>
      </div>

      <strong>{value.toLocaleString("en-IN")}</strong>

      <div className="dashboard-kpi-bottom">
        <small>{meta}</small>
      </div>
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
      <PanelHeading
        title="Workforce Status"
        description="Current employee distribution by employment status."
      />

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
            <small>
              {totalEmployees > 0
                ? `${Math.round(
                    (activeEmployees / totalEmployees) * 100,
                  )}%`
                : "0%"}
            </small>
          </div>
        </div>

        <div className="dashboard-status-list">
          {workforceStatuses.map((status) => (
            <div
              className="dashboard-status"
              key={status.label}
            >
              <div className="dashboard-status-top">
                <span>
                  <i className={`status-${status.label.toLowerCase()}`} />
                  {status.label}
                </span>
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

              <small>
                {Math.round(status.percentage)}%
              </small>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-panel-total">
        <span>Total Employees</span>
        <strong>{totalEmployees}</strong>
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
      <PanelHeading
        title="User Distribution by Role"
        description="System users grouped by assigned role."
      />

      {roleDistribution.length === 0 ? (
        <p className="dashboard-empty-text">
          No role distribution data available.
        </p>
      ) : (
        <div className="dashboard-role-list">
          {roleDistribution.map(([role, count]) => (
            <div className="dashboard-role" key={role}>
              <div className="dashboard-role-top">
                <span>
                  {roleLabels[role] || role}
                </span>
                <strong>
                  {count}{" "}
                  <small>
                    {totalPercentage(count, roleDistribution)}%
                  </small>
                </strong>
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
          ))}
        </div>
      )}

      <div className="dashboard-panel-total">
        <span>Total Users</span>
        <strong>
          {roleDistribution.reduce(
            (sum, [, count]) => sum + count,
            0,
          )}
        </strong>
      </div>
    </div>
  )
}

function totalPercentage(
  count: number,
  distribution: Array<[string, number]>,
) {
  const total = distribution.reduce(
    (sum, [, value]) => sum + value,
    0,
  )

  return total > 0
    ? Math.round((count / total) * 100)
    : 0
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
      <PanelHeading
        title={title}
        description={description}
      />

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

function PanelHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="dashboard-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
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
      <span className="dashboard-quick-icon">
        {item.icon}
      </span>

      <span className="dashboard-quick-copy">
        <strong>{item.label}</strong>
        <small>Open module</small>
      </span>

      <span className="dashboard-quick-arrow">→</span>
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
            Open module →
          </span>
        </button>
      ))}
    </div>
  )
}

function DashboardBottomPanels({
  announcements,
  holidays,
  contentError,
}: {
  announcements: AnnouncementRecord[]
  holidays: Holiday[]
  contentError: string
}) {
  return (
    <div className="dashboard-bottom-grid">
      <div className="dashboard-list-panel">
        <PanelHeading
          title="Recent Announcements"
          description="Latest organization announcements."
        />

        {contentError ? (
          <div className="dashboard-empty-state">
            {contentError}
          </div>
        ) : announcements.length === 0 ? (
          <div className="dashboard-empty-state">
            No announcements available.
          </div>
        ) : (
          <div className="dashboard-list">
            {announcements.slice(0, 4).map((announcement) => (
              <ListRow
                key={announcement.id}
                title={announcement.title}
                subtitle={announcement.message}
                date={formatDashboardDate(
                  announcement.publish_date,
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-list-panel">
        <PanelHeading
          title="Upcoming Holidays"
          description="Upcoming organization holidays."
        />

        {contentError ? (
          <div className="dashboard-empty-state">
            {contentError}
          </div>
        ) : holidays.length === 0 ? (
          <div className="dashboard-empty-state">
            No upcoming holidays available.
          </div>
        ) : (
          <div className="dashboard-list">
            {holidays
              .filter(
                (holiday) =>
                  new Date(holiday.date).getTime() >=
                  new Date().setHours(0, 0, 0, 0),
              )
              .sort(
                (first, second) =>
                  new Date(first.date).getTime() -
                  new Date(second.date).getTime(),
              )
              .slice(0, 4)
              .map((holiday) => (
                <HolidayRow
                  key={holiday.id}
                  title={holiday.name}
                  date={formatDashboardDate(holiday.date)}
                  day={formatDashboardDay(holiday.date)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ListRow({
  title,
  subtitle,
  date,
}: {
  title: string
  subtitle: string
  date: string
}) {
  return (
    <div className="dashboard-list-row">
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className="dashboard-list-date">
        <span>{date}</span>
        <i />
      </div>
    </div>
  )
}

function formatDashboardDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDashboardDay(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  })
}

function HolidayRow({
  title,
  date,
  day,
}: {
  title: string
  date: string
  day: string
}) {
  return (
    <div className="dashboard-list-row">
      <strong>{title}</strong>

      <div className="dashboard-holiday-date">
        <span>{date}</span>
        <small>{day}</small>
      </div>
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
        {loading && <div className="dashboard-spinner" />}

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
    --bg: #f5f7fb;
    --card: #ffffff;
    --surface: #f8fafc;
    --text: #14213d;
    --muted: #687792;
    --border: #dfe6f0;
    --accent: #ff6b00;
    --accent-2: #1769ff;
    --accent-soft: #fff1e8;
    --track: #e7edf5;
    --success: #0dbb63;
    --danger: #ef4b55;
    --shadow: 0 4px 18px rgba(25, 45, 80, 0.055);
    --shadow-hover: 0 12px 30px rgba(25, 45, 80, 0.11);

    width: 100%;
    min-height: calc(100vh - 48px);
    background: var(--bg);
    color: var(--text);
    border-radius: 16px;
    overflow: hidden;
  }

  .dashboard-dark {
    --bg: #08111f;
    --card: #0e1827;
    --surface: #111d2e;
    --text: #f5f8ff;
    --muted: #98a8bd;
    --border: #22334a;
    --accent: #ff6b00;
    --accent-2: #4c8dff;
    --accent-soft: #192941;
    --track: #26374e;
    --success: #0ed36b;
    --danger: #ff5360;
    --shadow: 0 5px 22px rgba(0, 0, 0, 0.18);
    --shadow-hover: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  .dashboard-shell {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 2px 24px;
  }

  .dashboard-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding: 4px 2px 18px;
    border-bottom: 1px solid var(--border);
  }

  .dashboard-eyebrow {
    margin: 0 0 6px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .dashboard-page-header h1 {
    margin: 0;
    color: var(--text);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.025em;
  }

  .dashboard-page-header p:last-child {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 13px;
  }

  .dashboard-refresh,
  .dashboard-state-button {
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    color: var(--text);
    padding: 10px 15px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .dashboard-refresh:hover,
  .dashboard-state-button:hover {
    border-color: var(--accent);
    color: var(--accent);
    transform: translateY(-1px);
  }

  .dashboard-welcome {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 144px;
    margin-top: 16px;
    padding: 25px 30px;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        var(--card) 0%,
        var(--accent-soft) 100%
      );
    box-shadow: var(--shadow);
  }

  .dashboard-welcome-copy {
    position: relative;
    z-index: 2;
  }

  .dashboard-role-badge {
    display: inline-flex;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-welcome h2 {
    margin: 11px 0 5px;
    color: var(--text);
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }

  .dashboard-welcome p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }

  .dashboard-welcome-visual {
    position: absolute;
    right: 38px;
    bottom: -4px;
    width: 310px;
    height: 145px;
    opacity: 0.48;
  }

  .dashboard-visual-window {
    position: absolute;
    right: 20px;
    top: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 102px;
    height: 72px;
    border: 3px solid var(--accent-2);
    opacity: 0.18;
  }

  .dashboard-visual-window span {
    border: 1px solid var(--accent-2);
  }

  .dashboard-visual-chart {
    position: absolute;
    left: 35px;
    top: 55px;
    display: flex;
    align-items: flex-end;
    gap: 7px;
    width: 62px;
    height: 47px;
    opacity: 0.2;
  }

  .dashboard-visual-chart i {
    display: block;
    width: 10px;
    border-radius: 4px 4px 0 0;
    background: var(--accent-2);
  }

  .dashboard-visual-chart i:nth-child(1) {
    height: 16px;
  }

  .dashboard-visual-chart i:nth-child(2) {
    height: 29px;
  }

  .dashboard-visual-chart i:nth-child(3) {
    height: 38px;
  }

  .dashboard-visual-chart i:nth-child(4) {
    height: 25px;
  }

  .dashboard-visual-block {
    position: absolute;
    left: 120px;
    bottom: 0;
    width: 90px;
    height: 58px;
    border-radius: 8px 8px 0 0;
    background: var(--accent-2);
    opacity: 0.15;
  }

  .dashboard-section-header {
    margin: 23px 0 11px;
  }

  .dashboard-section-header h2 {
    margin: 0;
    color: var(--text);
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.015em;
  }

  .dashboard-section-header p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 11px;
  }

  .dashboard-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-kpi {
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--card);
    box-shadow: var(--shadow);
    transition: 0.2s ease;
  }

  .dashboard-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .dashboard-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .dashboard-kpi-top > span {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-kpi-top b,
  .dashboard-module-icon,
  .dashboard-quick-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 9px;
    font-size: 9px;
    font-weight: 850;
  }

  .dashboard-kpi-top b {
    width: 34px;
    height: 34px;
    background: var(--accent-soft);
    color: var(--accent);
  }

  .dashboard-kpi > strong {
    display: block;
    margin-top: 15px;
    color: var(--text);
    font-size: 28px;
    line-height: 1;
    font-weight: 850;
    letter-spacing: -0.03em;
  }

  .dashboard-kpi-bottom {
    margin-top: 9px;
  }

  .dashboard-kpi-bottom small {
    color: var(--muted);
    font-size: 10px;
  }

  .dashboard-two-column {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
    gap: 12px;
    margin-top: 12px;
  }

  .dashboard-panel,
  .dashboard-profile-card,
  .dashboard-person-card,
  .dashboard-list-panel {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .dashboard-panel,
  .dashboard-list-panel {
    padding: 18px;
  }

  .dashboard-panel-heading {
    margin-bottom: 17px;
  }

  .dashboard-panel-heading h2 {
    margin: 0;
    color: var(--text);
    font-size: 15px;
    font-weight: 800;
  }

  .dashboard-panel-heading p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.5;
  }

  .dashboard-workforce {
    display: grid;
    grid-template-columns: 175px minmax(0, 1fr);
    align-items: center;
    gap: 26px;
  }

  .dashboard-donut {
    position: relative;
    width: 156px;
    height: 156px;
    margin: 0 auto;
    border-radius: 50%;
    background:
      conic-gradient(
        var(--success) 0deg,
        var(--success) var(--active-angle),
        var(--track) var(--active-angle),
        var(--track) 360deg
      );
  }

  .dashboard-donut::after {
    position: absolute;
    inset: 22px;
    content: "";
    border-radius: 50%;
    background: var(--card);
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
    color: var(--text);
    font-size: 25px;
    line-height: 1;
    font-weight: 850;
  }

  .dashboard-donut-center span {
    margin-top: 5px;
    color: var(--muted);
    font-size: 10px;
  }

  .dashboard-donut-center small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-status-list,
  .dashboard-role-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .dashboard-status-top,
  .dashboard-role-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }

  .dashboard-status-top span,
  .dashboard-role-top span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text);
    font-size: 10px;
    font-weight: 650;
  }

  .dashboard-status-top strong,
  .dashboard-role-top strong {
    color: var(--text);
    font-size: 10px;
  }

  .dashboard-status-top i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-2);
  }

  .dashboard-status-top i.status-active {
    background: var(--success);
  }

  .dashboard-status-top i.status-inactive {
    background: #ff8a18;
  }

  .dashboard-status-top i.status-resigned {
    background: #7757ff;
  }

  .dashboard-status-top i.status-terminated {
    background: var(--danger);
  }

  .dashboard-status-track,
  .dashboard-role-track {
    height: 5px;
    overflow: hidden;
    border-radius: 99px;
    background: var(--track);
  }

  .dashboard-status-progress,
  .dashboard-role-progress {
    height: 100%;
    border-radius: inherit;
    background: var(--accent-2);
  }

  .dashboard-status small {
    display: block;
    margin-top: 4px;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-panel-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
  }

  .dashboard-panel-total span {
    color: var(--muted);
    font-size: 10px;
  }

  .dashboard-panel-total strong {
    color: var(--text);
    font-size: 12px;
  }

  .dashboard-role-top strong small {
    margin-left: 5px;
    color: var(--muted);
    font-size: 8px;
    font-weight: 600;
  }

  .dashboard-action-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .dashboard-quick-action {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 9px;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    text-align: left;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .dashboard-quick-action:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
  }

  .dashboard-quick-icon {
    width: 34px;
    height: 34px;
    background: var(--accent-soft);
    color: var(--accent);
  }

  .dashboard-quick-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .dashboard-quick-copy strong {
    overflow: hidden;
    color: var(--text);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-quick-copy small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-quick-arrow {
    color: var(--accent-2);
    font-size: 15px;
  }

  .dashboard-module-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .dashboard-module {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    min-height: 150px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--card);
    color: var(--text);
    text-align: left;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: 0.2s ease;
  }

  .dashboard-module:hover {
    border-color: var(--accent-2);
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
  }

  .dashboard-module-icon {
    width: 36px;
    height: 36px;
    background: var(--accent-soft);
    color: var(--accent-2);
  }

  .dashboard-module strong {
    margin-top: 13px;
    color: var(--text);
    font-size: 11px;
    font-weight: 800;
  }

  .dashboard-module p {
    min-height: 34px;
    margin: 5px 0 10px;
    color: var(--muted);
    font-size: 9px;
    line-height: 1.45;
  }

  .dashboard-module-link {
    margin-top: auto;
    color: var(--accent-2);
    font-size: 9px;
    font-weight: 800;
  }

  .dashboard-profile-layout {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 12px;
  }

  .dashboard-person-card {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }

  .dashboard-large-avatar {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 17px;
    background: var(--accent);
    color: #fff;
    font-size: 19px;
    font-weight: 850;
  }

  .dashboard-person-card h3 {
    margin: 12px 0 3px;
    color: var(--text);
    font-size: 14px;
  }

  .dashboard-person-card p {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
  }

  .dashboard-person-status {
    margin-top: 13px;
    padding: 5px 9px;
    border-radius: 99px;
    background: rgba(13, 187, 99, 0.1);
    color: var(--success);
    font-size: 9px;
    font-weight: 800;
  }

  .dashboard-profile-card {
    padding: 15px;
  }

  .dashboard-profile-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .dashboard-info-card {
    min-width: 0;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
  }

  .dashboard-info-card span {
    display: block;
    color: var(--muted);
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dashboard-info-card strong {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: var(--text);
    font-size: 11px;
    font-weight: 750;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-info-card strong.muted {
    color: var(--muted);
    font-weight: 600;
  }

  .dashboard-quick-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .dashboard-bottom-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 12px;
    margin-top: 12px;
  }

  .dashboard-list {
    border-top: 1px solid var(--border);
  }

  .dashboard-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    min-height: 54px;
    padding: 8px 2px;
    border-bottom: 1px solid var(--border);
  }

  .dashboard-list-row > div:first-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dashboard-list-row strong {
    color: var(--text);
    font-size: 10px;
    font-weight: 750;
  }

  .dashboard-list-row span {
    margin-top: 4px;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-list-date {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
  }

  .dashboard-list-date span {
    margin: 0;
  }

  .dashboard-list-date i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-2);
  }

  .dashboard-holiday-date {
    display: flex;
    align-items: center;
    gap: 22px;
    flex: 0 0 auto;
  }

  .dashboard-holiday-date span,
  .dashboard-holiday-date small {
    margin: 0;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-empty-text {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
  }

  .dashboard-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-footer span:first-child {
    color: var(--text);
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
    padding: 30px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    box-shadow: var(--shadow);
    text-align: center;
  }

  .dashboard-state-card h2 {
    margin: 17px 0 7px;
    color: var(--text);
    font-size: 19px;
  }

  .dashboard-state-card p {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.6;
  }

  .dashboard-spinner {
    width: 32px;
    height: 32px;
    margin: 0 auto;
    border: 3px solid var(--track);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: dashboard-spin 0.8s linear infinite;
  }

  @keyframes dashboard-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1180px) {
    .dashboard-module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-profile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .dashboard-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-two-column,
    .dashboard-bottom-grid,
    .dashboard-profile-layout {
      grid-template-columns: 1fr;
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-welcome-visual {
      right: -20px;
      opacity: 0.25;
    }
  }

  @media (max-width: 640px) {
    .dashboard-page {
      border-radius: 10px;
    }

    .dashboard-page-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-refresh {
      width: 100%;
    }

    .dashboard-welcome {
      padding: 20px;
    }

    .dashboard-welcome h2 {
      font-size: 23px;
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
      width: 145px;
      height: 145px;
    }

    .dashboard-quick-list {
      grid-template-columns: 1fr;
    }

    .dashboard-panel,
    .dashboard-list-panel,
    .dashboard-profile-card,
    .dashboard-person-card {
      padding: 14px;
    }

    .dashboard-holiday-date {
      gap: 10px;
    }
  }
`

export default Dashboard