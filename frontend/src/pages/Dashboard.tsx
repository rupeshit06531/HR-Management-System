import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
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
import { getAnnouncements, type AnnouncementRecord } from "../api/announcements"
import { getDashboard } from "../api/dashboard"
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
    icon: "\u265F",
  },
  {
    label: "Departments",
    path: "/departments",
    description: "Manage departments and organizational structure.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "\u25A6",
  },
  {
    label: "Attendance",
    path: "/attendance",
    description: "Track attendance and daily workforce presence.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "\u25F7",
  },
  {
    label: "Leave",
    path: "/leave",
    description: "Manage leave requests and approvals.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "\u25A3",
  },
  {
    label: "Payroll",
    path: "/payroll",
    description: "Access payroll and compensation information.",
    roles: ["SUPER_ADMIN", "HR", "EMPLOYEE"],
    icon: "\u20B9",
  },
  {
    label: "Performance",
    path: "/performance",
    description: "Review performance and development information.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "\u2197",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    description: "Manage recruitment and candidate information.",
    roles: ["SUPER_ADMIN", "HR"],
    icon: "\u25CE",
  },
  {
    label: "Documents",
    path: "/documents",
    description: "Access important HR documents.",
    roles: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    icon: "\u25A4",
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
    icon: "\u2605",
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

function formatDashboardDate(value: string) {
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

function formatDashboardDay(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
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

function formatMetric(value: number) {
  return value.toLocaleString("en-IN")
}

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const [dashboard, setDashboard] = useState<
    Awaited<ReturnType<typeof getDashboard>> | null
  >(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [contentError, setContentError] = useState("")
  const [isContentLoading, setIsContentLoading] = useState(true)

  async function loadDashboard(options?: { refresh?: boolean }) {
    const refresh = options?.refresh ?? false

    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError("")

      const data = await getDashboard()

      setDashboard(data)
      setLastUpdated(new Date())
    } catch (requestError) {
      console.error("Failed to load dashboard:", requestError)
      setError("Unable to load dashboard information.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  async function loadDashboardContent() {
    try {
      setIsContentLoading(true)
      setContentError("")

      const [announcementResponse, holidayResponse] = await Promise.all([
        getAnnouncements({
          is_active: true,
        }),
        getHolidays({
          is_active: true,
        }),
      ])

      const publishedAnnouncements = announcementResponse.results
        .filter((announcement) => announcement.is_published)
        .sort(
          (first, second) =>
            new Date(second.publish_date).getTime() -
            new Date(first.publish_date).getTime(),
        )

      const upcomingHolidays = holidayResponse.results
        .filter((holiday) => {
          const timestamp = new Date(holiday.date).getTime()
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          return Number.isFinite(timestamp) && timestamp >= today.getTime()
        })
        .sort(
          (first, second) =>
            new Date(first.date).getTime() -
            new Date(second.date).getTime(),
        )

      setAnnouncements(publishedAnnouncements)
      setHolidays(upcomingHolidays)
    } catch (requestError) {
      console.error("Failed to load dashboard content:", requestError)
      setContentError("Unable to load announcements and holidays.")
    } finally {
      setIsContentLoading(false)
    }
  }

  async function handleRefresh() {
    await Promise.all([
      loadDashboard({ refresh: true }),
      loadDashboardContent(),
    ])
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
        {role !== "EMPLOYEE" && (
          <>
            <header className="dashboard-page-header">
              <div className="dashboard-page-heading">
                <p className="dashboard-eyebrow">HR MANAGEMENT SYSTEM</p>

                <div className="dashboard-title-row">
                  <div>
                    <h1>Dashboard</h1>
                    <p>
                      Welcome back, {displayName}. Here is your workspace
                      overview.
                    </p>
                  </div>

                  <span className="dashboard-header-role">
                    {currentRole}
                  </span>
                </div>
              </div>

              <div className="dashboard-header-actions">
                {lastUpdated && (
                  <span className="dashboard-last-updated">
                    Updated {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}

                <button
                  type="button"
                  className="dashboard-refresh"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                >
                  <span className={isRefreshing ? "dashboard-refresh-icon is-spinning" : "dashboard-refresh-icon"}>
                    \u21BB
                  </span>
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </header>

            <section className="dashboard-welcome">
              <div className="dashboard-welcome-copy">
                <div className="dashboard-welcome-meta">
                  <span className="dashboard-role-badge">
                    {currentRole}
                  </span>

                  <span className="dashboard-live-indicator">
                    <i />
                    Workspace Active
                  </span>
                </div>

                <h2>Welcome back, {displayName}</h2>

                <p>{roleDescription}</p>
              </div>

              <div className="dashboard-welcome-visual" aria-hidden="true">
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
                  <i />
                </div>

                <div className="dashboard-visual-block" />
              </div>
            </section>
          </>
        )}

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
            isContentLoading={isContentLoading}
          />
        )}

        <footer className="dashboard-footer">
          <span>{personalName}</span>
          <span className="dashboard-footer-dot">\u2022</span>
          <span>{currentRole}</span>
          <span className="dashboard-footer-dot">\u2022</span>
          <span>HRMS Workspace</span>
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
  const employeeQuickModules = visibleModules.filter((module) =>
    [
      "Attendance",
      "Leave",
      "Payroll",
      "Performance",
      "Documents",
      "Holidays",
    ].includes(module.label),
  )

  return (
    <div className="dashboard-employee-content">
      <section className="dashboard-employee-hero">
        <div className="dashboard-employee-hero-copy">
          <span className="dashboard-employee-kicker">
            PERSONAL WORKSPACE
          </span>

          <h1>Good day, {personalName}</h1>

          <p>
            Manage your attendance, employment information and personal HR
            services from one compact workspace.
          </p>
        </div>

        <div className="dashboard-employee-hero-badge">
          <span>{personalInitials}</span>
          <div>
            <strong>Employee</strong>
            <small>Workspace ready</small>
          </div>
        </div>
      </section>

      <SectionHeader
        title="My Employment Profile"
        description="Your current employment information."
      />

      <div className="dashboard-employee-profile-layout">
        <div className="dashboard-person-card dashboard-employee-person-card">
          <div className="dashboard-large-avatar">
            {personalInitials}
          </div>

          <div className="dashboard-employee-person-copy">
            <span className="dashboard-profile-overline">
              EMPLOYEE
            </span>

            <h3>{personalName}</h3>

            <p>Employee Workspace</p>
          </div>

          <div className="dashboard-person-status">
            <i />
            Profile Active
          </div>
        </div>

        <div className="dashboard-profile-card dashboard-employee-profile-card">
          <div className="dashboard-profile-card-heading">
            <div>
              <span>EMPLOYMENT DETAILS</span>
              <strong>Current profile information</strong>
            </div>
          </div>

          <div className="dashboard-profile-grid dashboard-employee-profile-grid">
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
        title="Quick Access"
        description="Quick access to your personal HR services."
      />

      <ModuleGrid
        modules={employeeQuickModules}
        navigate={navigate}
      />
    </div>
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

  const [selfiePreview, setSelfiePreview] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const getTodayDate = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const formatTime = (value: string | null) => {
    if (!value) {
      return "--"
    }

    const parts = value.split(":")

    if (parts.length < 2) {
      return value
    }

    const hours = Number(parts[0])
    const minutes = Number(parts[1])

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return value
    }

    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12

    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`
  }

  const loadTodayAttendance = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getAttendance()
      const today = getTodayDate()

      const todayRecord =
        response.results.find(
          (record) => record.date === today,
        ) ?? null

      setAttendance(todayRecord)
    } catch (requestError) {
      console.error(
        "Failed to load today's attendance:",
        requestError,
      )

      setError("Unable to load today's attendance.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTodayAttendance()
  }, [])

  useEffect(() => {
    return () => {
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview)
      }
    }
  }, [selfiePreview])

  const getCurrentLocation = async () => {
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

  const getPunchErrorMessage = (punchError: unknown) => {
    if (
      typeof GeolocationPositionError !== "undefined" &&
      punchError instanceof GeolocationPositionError
    ) {
      if (
        punchError.code ===
        GeolocationPositionError.PERMISSION_DENIED
      ) {
        return "Location permission was denied. Please allow location access and try again."
      }

      if (
        punchError.code ===
        GeolocationPositionError.POSITION_UNAVAILABLE
      ) {
        return "Unable to determine your current location."
      }

      return "Location request timed out. Please try again."
    }

    const axiosError = punchError as {
      response?: {
        data?: unknown
      }
    }

    const responseData = axiosError.response?.data

    if (
      responseData &&
      typeof responseData === "object"
    ) {
      const data =
        responseData as Record<string, unknown>

      if (typeof data.detail === "string") {
        return data.detail
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

            if (typeof value === "string") {
              return [`${field}: ${value}`]
            }

            return []
          },
        )

      if (messages.length > 0) {
        return messages.join(" | ")
      }
    }

    return null
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

      const position = await getCurrentLocation()

      const latitude = Number(
        position.coords.latitude.toFixed(6),
      )

      const longitude = Number(
        position.coords.longitude.toFixed(6),
      )

      const accuracy =
        Number.isFinite(position.coords.accuracy)
          ? Number(
              Math.max(
                0,
                position.coords.accuracy,
              ).toFixed(2),
            )
          : null

      const response = await punchInAttendance({
        latitude,
        longitude,
        accuracy,
        selfie: selfieFile,
      })

      setAttendance(response.attendance)
      setSelfieFile(null)
      setSelfiePreview(null)

      setSuccess(
        response.message ||
          "Punch-in successful.",
      )
    } catch (punchError) {
      console.error(
        "Dashboard punch-in error:",
        punchError,
      )

      setError(
        getPunchErrorMessage(punchError) ||
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

      const position = await getCurrentLocation()

      const latitude = Number(
        position.coords.latitude.toFixed(6),
      )

      const longitude = Number(
        position.coords.longitude.toFixed(6),
      )

      const accuracy =
        Number.isFinite(position.coords.accuracy)
          ? Number(
              Math.max(
                0,
                position.coords.accuracy,
              ).toFixed(2),
            )
          : null

      const response = await punchOutAttendance({
        latitude,
        longitude,
        accuracy,
        selfie: selfieFile,
      })

      setAttendance(response.attendance)
      setSelfieFile(null)
      setSelfiePreview(null)

      setSuccess(
        response.message ||
          "Punch-out successful.",
      )
    } catch (punchError) {
      console.error(
        "Dashboard punch-out error:",
        punchError,
      )

      setError(
        getPunchErrorMessage(punchError) ||
          "Unable to punch out attendance. Please try again.",
      )
    } finally {
      setIsPunchingOut(false)
    }
  }

  const handleSelfieChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null

    setError(null)
    setSuccess(null)

    if (!file) {
      setSelfieFile(null)
      setSelfiePreview(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setSelfieFile(null)
      setSelfiePreview(null)
      setError(
        "Please select a valid image file for the selfie.",
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelfieFile(null)
      setSelfiePreview(null)
      setError(
        "Selfie image must be smaller than 10 MB.",
      )
      return
    }

    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview)
    }

    const previewUrl = URL.createObjectURL(file)

    setSelfieFile(file)
    setSelfiePreview(previewUrl)
  }

  const attendanceStatus = attendance?.check_out
    ? "Completed"
    : attendance?.check_in
      ? "Working"
      : "Not Punched"

  const attendanceStatusClass = attendance?.check_out
    ? "is-completed"
    : attendance?.check_in
      ? "is-working"
      : "is-pending"

  return (
    <section className="dashboard-panel dashboard-today-attendance">
      <div className="dashboard-attendance-header">
        <div>
          <span className="dashboard-panel-kicker">
            DAILY ATTENDANCE
          </span>

          <h2>Today's Attendance</h2>

          <p>
            Verify your identity and location before recording attendance.
          </p>
        </div>

        <span
          className={`dashboard-attendance-status ${attendanceStatusClass}`}
        >
          <i />
          {attendanceStatus}
        </span>
      </div>

      {isLoading ? (
        <div className="dashboard-attendance-loading">
          <div className="dashboard-mini-spinner" />
          <span>Loading today's attendance...</span>
        </div>
      ) : (
        <>
          <div className="dashboard-attendance-summary">
            <div>
              <span>Date</span>
              <strong>{getTodayDate()}</strong>
              <small>Current workday</small>
            </div>

            <div>
              <span>Punch In</span>
              <strong>
                {formatTime(attendance?.check_in ?? null)}
              </strong>
              <small>
                {attendance?.check_in
                  ? "Recorded"
                  : "Not recorded"}
              </small>
            </div>

            <div>
              <span>Punch Out</span>
              <strong>
                {formatTime(attendance?.check_out ?? null)}
              </strong>
              <small>
                {attendance?.check_out
                  ? "Recorded"
                  : "Pending"}
              </small>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {attendance?.status
                  ? attendance.status
                      .replace(/_/g, " ")
                      .replace(
                        /\b\w/g,
                        (character) =>
                          character.toUpperCase(),
                      )
                  : "Not punched"}
              </strong>
              <small>Attendance state</small>
            </div>
          </div>

          {!attendance?.check_out && (
            <div className="dashboard-attendance-actions">
              <div className="dashboard-selfie-box">
                <div className="dashboard-selfie-copy">
                  <span>Identity verification</span>
                  <small>
                    A selfie is required for attendance verification.
                  </small>
                </div>

                <label className="dashboard-selfie-input">
                  <span>
                    {selfieFile
                      ? "Selfie Selected"
                      : "Capture Selfie"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieChange}
                  />
                </label>

                {selfiePreview && (
                  <div className="dashboard-selfie-preview">
                    <img
                      src={selfiePreview}
                      alt="Selected selfie preview"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (selfiePreview) {
                          URL.revokeObjectURL(selfiePreview)
                        }

                        setSelfieFile(null)
                        setSelfiePreview(null)
                        setError(null)
                        setSuccess(null)
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="dashboard-attendance-button-group">
                {!attendance?.check_in && (
                  <button
                    type="button"
                    className="dashboard-attendance-button dashboard-attendance-primary"
                    onClick={() => void handlePunchIn()}
                    disabled={isPunchingIn}
                  >
                    <span>\u25F7</span>
                    {isPunchingIn
                      ? "Punching In..."
                      : "Punch In"}
                  </button>
                )}

                {attendance?.check_in &&
                  !attendance?.check_out && (
                    <button
                      type="button"
                      className="dashboard-attendance-button dashboard-attendance-primary"
                      onClick={() => void handlePunchOut()}
                      disabled={isPunchingOut}
                    >
                      <span>\u25F7</span>
                      {isPunchingOut
                        ? "Punching Out..."
                        : "Punch Out"}
                    </button>
                  )}
              </div>
            </div>
          )}

          {attendance?.check_out && (
            <div className="dashboard-attendance-complete">
              <span>\u2713</span>
              <div>
                <strong>Attendance completed for today</strong>
                <small>
                  Your punch-in and punch-out records have been captured.
                </small>
              </div>
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
        badge="TEAM"
      />

      <div className="dashboard-kpi-grid">
        <MetricCard
          label="Team Employees"
          value={totalEmployees}
          meta="Accessible team members"
          icon="TM"
          tone="primary"
        />

        <MetricCard
          label="Active"
          value={activeEmployees}
          meta={`${activePercentage}% of team`}
          icon="AC"
          tone="success"
        />

        <MetricCard
          label="Inactive"
          value={inactiveEmployees}
          meta="Currently inactive"
          icon="IN"
          tone="warning"
        />

        <MetricCard
          label="Resigned"
          value={resignedEmployees}
          meta="Resigned employees"
          icon="RS"
          tone="neutral"
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
        badge={`${visibleModules.length} MODULES`}
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
  isContentLoading,
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
  isContentLoading: boolean
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
        badge={isSuperAdmin ? "ADMIN" : "HR"}
      />

      <div className="dashboard-kpi-grid">
        <MetricCard
          label="Total Employees"
          value={totalEmployees}
          meta="Organization workforce"
          icon="EM"
          tone="primary"
          progress={totalEmployees > 0 ? 100 : 0}
          progressLabel="Workforce tracked"
        />

        <MetricCard
          label="Active Employees"
          value={activeEmployees}
          meta={`${activePercentage}% of workforce`}
          icon="AC"
          tone="success"
          progress={activePercentage}
          progressLabel="Active workforce"
        />

        <MetricCard
          label="Inactive Employees"
          value={inactiveEmployees}
          meta="Currently inactive"
          icon="IN"
          tone="warning"
          progress={
            totalEmployees > 0
              ? (inactiveEmployees / totalEmployees) * 100
              : 0
          }
          progressLabel="Inactive workforce"
        />

        <MetricCard
          label="Total Users"
          value={totalUsers}
          meta="Registered system users"
          icon="US"
          tone="info"
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
        badge={`${quickActions.length} ACTIONS`}
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
        badge={`${visibleModules.length} MODULES`}
      />

      <ModuleGrid
        modules={visibleModules}
        navigate={navigate}
      />

      <FieldOperationsSection />

      <DashboardBottomPanels
        announcements={announcements}
        holidays={holidays}
        contentError={contentError}
        isLoading={isContentLoading}
      />
    </>
  )
}

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="dashboard-section-header">
      <div>
        <span className="dashboard-section-kicker">WORKSPACE</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {badge && (
        <span className="dashboard-section-badge">
          {badge}
        </span>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  meta,
  icon,
  tone = "primary",
  progress,
  progressLabel,
}: {
  label: string
  value: number
  meta: string
  icon: string
  tone?: "primary" | "success" | "warning" | "info" | "neutral"
  progress?: number
  progressLabel?: string
}) {
  const normalizedProgress =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : null

  return (
    <div className={`dashboard-kpi dashboard-kpi-${tone}`}>
      <div className="dashboard-kpi-top">
        <div>
          <span>{label}</span>
          <small>Workforce metric</small>
        </div>

        <b aria-hidden="true">{icon}</b>
      </div>

      <strong>{formatMetric(value)}</strong>

      <div className="dashboard-kpi-bottom">
        <small>{meta}</small>
      </div>

      {normalizedProgress !== null && (
        <div className="dashboard-kpi-progress">
          <div
            className="dashboard-kpi-progress-track"
            role="progressbar"
            aria-label={progressLabel ?? `${label} percentage`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(normalizedProgress)}
          >
            <span
              className="dashboard-kpi-progress-fill"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>

          <span className="dashboard-kpi-progress-label">
            {progressLabel ?? "Workforce share"}
          </span>
        </div>
      )}
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
    <div className="dashboard-panel dashboard-workforce-panel">
      <PanelHeading
        title="Workforce Status"
        description="Current employee distribution by employment status."
        badge="LIVE DATA"
      />

      <div className="dashboard-workforce">
        <div className="dashboard-workforce-visual">
          <div
            className="dashboard-donut"
            role="img"
            aria-label={`${formatMetric(activeEmployees)} active employees out of ${formatMetric(totalEmployees)}`}
            style={
              {
                "--active-angle": `${activeAngle}deg`,
              } as CSSProperties
            }
          >
            <div className="dashboard-donut-center">
              <span>ACTIVE</span>
              <strong>{formatMetric(activeEmployees)}</strong>
              <small>
                {totalEmployees > 0
                  ? `${Math.round(
                      (activeEmployees / totalEmployees) * 100,
                    )}% of workforce`
                  : "0% of workforce"}
              </small>
            </div>
          </div>

          <div className="dashboard-workforce-visual-meta">
            <span>WORKFORCE HEALTH</span>
            <strong>
              {totalEmployees > 0
                ? `${Math.round((activeEmployees / totalEmployees) * 100)}% active`
                : "No workforce data"}
            </strong>
            <small>
              {totalEmployees > 0
                ? `${formatMetric(totalEmployees)} employees tracked`
                : "Awaiting employee data"}
            </small>
          </div>
        </div>

        <div className="dashboard-workforce-details">
          <div className="dashboard-workforce-segmented" aria-hidden="true">
            {workforceStatuses.map((status) => (
              <span
                key={status.label}
                className={`dashboard-workforce-segment segment-${status.label.toLowerCase()}`}
                style={{
                  width: `${Math.max(
                    status.percentage > 0 ? status.percentage : 0,
                    status.value > 0 ? 1 : 0,
                  )}%`,
                }}
              />
            ))}
          </div>

          <div className="dashboard-status-list">
            {workforceStatuses.map((status) => (
              <div
                className="dashboard-status"
                key={status.label}
              >
                <div className="dashboard-status-top">
                  <span>
                    <i
                      className={`status-${status.label.toLowerCase()}`}
                    />
                    {status.label}
                  </span>

                  <strong>
                    {formatMetric(status.value)}
                    <small>{Math.round(status.percentage)}%</small>
                  </strong>
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

      <div className="dashboard-panel-total">
        <span>Tracked Workforce</span>
        <strong>{formatMetric(totalEmployees)} employees</strong>
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
        badge="USERS"
      />

      {roleDistribution.length === 0 ? (
        <p className="dashboard-empty-text">
          No role distribution data available.
        </p>
      ) : (
        <>
          <div className="dashboard-role-summary">
            <div>
              <span>ACTIVE ROLES</span>
              <strong>{roleDistribution.length}</strong>
            </div>
            <div>
              <span>LARGEST ROLE</span>
              <strong>
                {roleLabels[roleDistribution[0][0]] ||
                  roleDistribution[0][0]}
              </strong>
            </div>
          </div>

          <div className="dashboard-role-list">
            {roleDistribution.map(([role, count], index) => (
              <div className="dashboard-role" key={role}>
                <div className="dashboard-role-top">
                  <span>
                    <i />
                    <b className="dashboard-role-rank">
                      {String(index + 1).padStart(2, "0")}
                    </b>
                    {roleLabels[role] || role}
                  </span>

                  <strong>
                    {formatMetric(count)}
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
        </>
      )}

      <div className="dashboard-panel-total">
        <span>Total Users</span>

        <strong>
          {formatMetric(
            roleDistribution.reduce(
              (sum, [, count]) => sum + count,
              0,
            ),
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
        badge="SHORTCUTS"
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
  badge,
}: {
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="dashboard-panel-heading">
      <div>
        <span className="dashboard-panel-kicker">OVERVIEW</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {badge && (
        <span className="dashboard-panel-badge">
          {badge}
        </span>
      )}
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
        <small>{item.description}</small>
      </span>

      <span className="dashboard-quick-arrow">\u2192</span>
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
          <div className="dashboard-module-top">
            <span className="dashboard-module-icon">
              {item.icon}
            </span>

            <span className="dashboard-module-open">
              \u2192
            </span>
          </div>

          <strong>{item.label}</strong>

          <p>{item.description}</p>

          <span className="dashboard-module-link">
            Open module
          </span>
        </button>
      ))}
    </div>
  )
}

function FieldOperationsSection() {
  return (
    <section
      id="sales-field-operations"
      className="dashboard-field-operations"
    >
      <div className="dashboard-field-heading">
        <div>
          <div className="dashboard-field-title-row">
            <span className="dashboard-field-icon">
              GPS
            </span>

            <div>
              <div className="dashboard-field-title-line">
                <h2>Sales & GPS Tracking</h2>

                <span className="dashboard-field-badge">
                  FIELD OPS
                </span>
              </div>

              <p>
                Monitor field workforce activity, sales performance and
                location tracking.
              </p>
            </div>
          </div>
        </div>

        <span className="dashboard-field-status">
          Not connected
        </span>
      </div>

      <div className="dashboard-field-notice">
        <span>i</span>

        <div>
          <strong>Field operations data is not connected yet</strong>
          <p>
            This section is prepared for future field workforce, sales and
            GPS integrations. No live activity is being simulated.
          </p>
        </div>
      </div>

      <div className="dashboard-field-kpi-grid">
        {[
          {
            label: "Field Employees",
            value: "--",
            description: "Awaiting field workforce data",
            short: "FIELD",
          },
          {
            label: "Active Visits",
            value: "--",
            description: "Awaiting visit tracking data",
            short: "VISITS",
          },
          {
            label: "Sales Today",
            value: "--",
            description: "Awaiting sales activity data",
            short: "SALES",
          },
          {
            label: "GPS Active",
            value: "--",
            description: "Awaiting location tracking data",
            short: "GPS",
          },
        ].map((metric) => (
          <div
            className="dashboard-field-kpi"
            key={metric.label}
          >
            <div className="dashboard-field-kpi-top">
              <span>{metric.label}</span>
              <b>{metric.short}</b>
            </div>

            <strong>{metric.value}</strong>

            <small>{metric.description}</small>
          </div>
        ))}
      </div>

      <div className="dashboard-field-panel-grid">
        <div className="dashboard-field-panel">
          <div className="dashboard-field-panel-heading">
            <div>
              <h3>Field Activity</h3>
              <p>Today's field workforce activity</p>
            </div>

            <span>NO DATA</span>
          </div>

          <div className="dashboard-field-activity-list">
            <div>
              <span>Check-ins</span>
              <strong>--</strong>
            </div>

            <div>
              <span>Visits Completed</span>
              <strong>--</strong>
            </div>

            <div>
              <span>Sales Logged</span>
              <strong>--</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-field-panel">
          <div className="dashboard-field-panel-heading">
            <div>
              <h3>GPS Status</h3>
              <p>Location sharing overview</p>
            </div>

            <span>GPS</span>
          </div>

          <div className="dashboard-gps-empty">
            <div className="dashboard-gps-icon">
              GPS
            </div>

            <div>
              <strong>Tracking integration pending</strong>

              <p>
                GPS tracking data will appear here after the field
                operations integration is connected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardBottomPanels({
  announcements,
  holidays,
  contentError,
  isLoading,
}: {
  announcements: AnnouncementRecord[]
  holidays: Holiday[]
  contentError: string
  isLoading: boolean
}) {
  return (
    <div className="dashboard-bottom-grid">
      <div className="dashboard-list-panel">
        <PanelHeading
          title="Recent Announcements"
          description="Latest organization announcements."
          badge={`${announcements.length}`}
        />

        {isLoading ? (
          <DashboardListLoading />
        ) : contentError ? (
          <div className="dashboard-empty-state">
            <strong>Content unavailable</strong>
            <span>{contentError}</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="dashboard-empty-state">
            <strong>No announcements</strong>
            <span>No published announcements are available right now.</span>
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
          badge={`${holidays.length}`}
        />

        {isLoading ? (
          <DashboardListLoading />
        ) : contentError ? (
          <div className="dashboard-empty-state">
            <strong>Content unavailable</strong>
            <span>{contentError}</span>
          </div>
        ) : holidays.length === 0 ? (
          <div className="dashboard-empty-state">
            <strong>No upcoming holidays</strong>
            <span>No upcoming organization holidays are available.</span>
          </div>
        ) : (
          <div className="dashboard-list">
            {holidays.slice(0, 4).map((holiday) => (
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

function DashboardListLoading() {
  return (
    <div className="dashboard-list-loading">
      <div className="dashboard-mini-spinner" />
      <span>Loading information...</span>
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
      <div className="dashboard-list-content">
        <div className="dashboard-list-marker" />

        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="dashboard-list-date">
        <span>{date}</span>
        <i />
      </div>
    </div>
  )
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
      <div className="dashboard-list-content">
        <div className="dashboard-holiday-marker">
          <span>\u2605</span>
        </div>

        <div>
          <strong>{title}</strong>
          <span>Organization holiday</span>
        </div>
      </div>

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
        {loading && (
          <div className="dashboard-state-icon">
            <div className="dashboard-spinner" />
          </div>
        )}

        <span className="dashboard-state-kicker">
          HRMS
        </span>

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
    --bg: #f4f7fb;
    --card: #ffffff;
    --surface: #f8fafc;
    --surface-strong: #f1f5f9;
    --text: #14213d;
    --muted: #687792;
    --muted-strong: #4d5f7a;
    --border: #dfe6f0;
    --border-strong: #cbd5e1;
    --accent: #ff6b00;
    --accent-2: #1769ff;
    --accent-soft: #fff1e8;
    --track: #e7edf5;
    --success: #0dbb63;
    --warning: #f59e0b;
    --danger: #ef4b55;
    --info: #1769ff;
    --shadow: 0 4px 18px rgba(25, 45, 80, 0.055);
    --shadow-hover: 0 14px 32px rgba(25, 45, 80, 0.11);

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
    --surface-strong: #172438;
    --text: #f5f8ff;
    --muted: #98a8bd;
    --muted-strong: #b4c1d2;
    --border: #22334a;
    --border-strong: #30435d;
    --accent: #ff6b00;
    --accent-2: #4c8dff;
    --accent-soft: #192941;
    --track: #26374e;
    --success: #0ed36b;
    --warning: #fbbf24;
    --danger: #ff5360;
    --info: #4c8dff;
    --shadow: 0 5px 22px rgba(0, 0, 0, 0.18);
    --shadow-hover: 0 14px 34px rgba(0, 0, 0, 0.32);
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
    padding: 4px 2px 16px;
    border-bottom: 1px solid var(--border);
  }

  .dashboard-page-heading {
    min-width: 0;
  }

  .dashboard-eyebrow,
  .dashboard-section-kicker,
  .dashboard-panel-kicker,
  .dashboard-profile-overline,
  .dashboard-employee-kicker {
    display: block;
    margin: 0;
    color: var(--accent);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.12em;
  }

  .dashboard-eyebrow {
    margin-bottom: 6px;
  }

  .dashboard-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dashboard-page-header h1 {
    margin: 0;
    color: var(--text);
    font-size: 27px;
    font-weight: 850;
    letter-spacing: -0.035em;
  }

  .dashboard-page-header p:last-child {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  .dashboard-header-role {
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--surface);
    color: var(--muted-strong);
    font-size: 9px;
    font-weight: 800;
    white-space: nowrap;
  }

  .dashboard-header-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 0 0 auto;
  }

  .dashboard-last-updated {
    color: var(--muted);
    font-size: 9px;
    white-space: nowrap;
  }

  .dashboard-refresh,
  .dashboard-state-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--card);
    color: var(--text);
    padding: 8px 13px;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .dashboard-refresh:hover,
  .dashboard-state-button:hover {
    border-color: var(--accent);
    color: var(--accent);
    transform: translateY(-1px);
  }

  .dashboard-refresh:disabled {
    opacity: 0.65;
    cursor: wait;
    transform: none;
  }

  .dashboard-refresh-icon {
    display: inline-block;
    font-size: 15px;
    line-height: 1;
  }

  .dashboard-refresh-icon.is-spinning {
    animation: dashboard-spin 0.8s linear infinite;
  }

  .dashboard-welcome {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 142px;
    margin-top: 14px;
    padding: 24px 28px;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 15px;
    background:
      linear-gradient(
        135deg,
        var(--card) 0%,
        var(--accent-soft) 100%
      );
    box-shadow: var(--shadow);
  }

  .dashboard-welcome::after {
    position: absolute;
    right: -80px;
    bottom: -130px;
    width: 320px;
    height: 250px;
    content: "";
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.035;
  }

  .dashboard-welcome-copy {
    position: relative;
    z-index: 2;
  }

  .dashboard-welcome-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dashboard-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 9px;
    font-weight: 850;
  }

  .dashboard-live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--muted);
    font-size: 8px;
    font-weight: 700;
  }

  .dashboard-live-indicator i,
  .dashboard-person-status i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 3px rgba(13, 187, 99, 0.1);
  }

  .dashboard-welcome h2 {
    margin: 10px 0 5px;
    color: var(--text);
    font-size: 27px;
    line-height: 1.15;
    font-weight: 850;
    letter-spacing: -0.035em;
  }

  .dashboard-welcome p {
    max-width: 680px;
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .dashboard-welcome-visual {
    position: absolute;
    right: 34px;
    bottom: -4px;
    width: 315px;
    height: 145px;
    opacity: 0.45;
  }

  .dashboard-visual-window {
    position: absolute;
    right: 20px;
    top: 7px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 105px;
    height: 74px;
    border: 3px solid var(--accent-2);
    opacity: 0.17;
  }

  .dashboard-visual-window span {
    border: 1px solid var(--accent-2);
  }

  .dashboard-visual-chart {
    position: absolute;
    left: 32px;
    top: 51px;
    display: flex;
    align-items: flex-end;
    gap: 7px;
    width: 72px;
    height: 53px;
    opacity: 0.2;
  }

  .dashboard-visual-chart i {
    display: block;
    width: 10px;
    border-radius: 4px 4px 0 0;
    background: var(--accent-2);
  }

  .dashboard-visual-chart i:nth-child(1) {
    height: 15px;
  }

  .dashboard-visual-chart i:nth-child(2) {
    height: 27px;
  }

  .dashboard-visual-chart i:nth-child(3) {
    height: 39px;
  }

  .dashboard-visual-chart i:nth-child(4) {
    height: 29px;
  }

  .dashboard-visual-chart i:nth-child(5) {
    height: 46px;
  }

  .dashboard-visual-block {
    position: absolute;
    left: 120px;
    bottom: 0;
    width: 94px;
    height: 59px;
    border-radius: 8px 8px 0 0;
    background: var(--accent-2);
    opacity: 0.14;
  }

  .dashboard-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 15px;
    margin: 21px 0 10px;
  }

  .dashboard-section-header > div {
    min-width: 0;
  }

  .dashboard-section-header h2 {
    margin: 3px 0 0;
    color: var(--text);
    font-size: 16px;
    font-weight: 850;
    letter-spacing: -0.02em;
  }

  .dashboard-section-header p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.45;
  }

  .dashboard-section-badge {
    padding: 4px 7px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .dashboard-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .dashboard-kpi {
    position: relative;
    min-width: 0;
    padding: 15px;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--card);
    box-shadow: var(--shadow);
    transition: 0.2s ease;
  }

  .dashboard-kpi::before {
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    content: "";
    background: var(--accent);
    opacity: 0.8;
  }

  .dashboard-kpi-success::before {
    background: var(--success);
  }

  .dashboard-kpi-warning::before {
    background: var(--warning);
  }

  .dashboard-kpi-info::before {
    background: var(--info);
  }

  .dashboard-kpi-neutral::before {
    background: var(--muted);
  }

  .dashboard-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .dashboard-kpi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .dashboard-kpi-top > div {
    min-width: 0;
  }

  .dashboard-kpi-top > div > span {
    display: block;
    overflow: hidden;
    color: var(--muted);
    font-size: 10px;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-kpi-top > div > small {
    display: block;
    margin-top: 3px;
    color: var(--muted);
    font-size: 7px;
    opacity: 0.75;
  }

  .dashboard-kpi-top b,
  .dashboard-module-icon,
  .dashboard-quick-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 8px;
    font-size: 8px;
    font-weight: 850;
  }

  .dashboard-kpi-top b {
    width: 33px;
    height: 33px;
    background: var(--accent-soft);
    color: var(--accent);
  }

  .dashboard-kpi-success .dashboard-kpi-top b {
    background: rgba(13, 187, 99, 0.1);
    color: var(--success);
  }

  .dashboard-kpi-warning .dashboard-kpi-top b {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning);
  }

  .dashboard-kpi-info .dashboard-kpi-top b {
    background: rgba(23, 105, 255, 0.1);
    color: var(--info);
  }

  .dashboard-kpi > strong {
    display: block;
    margin-top: 14px;
    color: var(--text);
    font-size: 27px;
    line-height: 1;
    font-weight: 850;
    letter-spacing: -0.035em;
  }

  .dashboard-kpi-bottom {
    display: flex;
    align-items: center;
    margin-top: 8px;
  }

  .dashboard-kpi-bottom small {
    overflow: hidden;
    color: var(--muted);
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dashboard-kpi-progress {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    margin-top: 11px;
  }

  .dashboard-kpi-progress-track {
    position: relative;
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--track);
  }

  .dashboard-kpi-progress-fill {
    display: block;
    height: 100%;
    min-width: 0;
    border-radius: inherit;
    background: var(--accent);
    transition: width 0.35s ease;
  }

  .dashboard-kpi-success .dashboard-kpi-progress-fill {
    background: var(--success);
  }

  .dashboard-kpi-warning .dashboard-kpi-progress-fill {
    background: var(--warning);
  }

  .dashboard-kpi-info .dashboard-kpi-progress-fill {
    background: var(--info);
  }

  .dashboard-kpi-neutral .dashboard-kpi-progress-fill {
    background: var(--muted);
  }

  .dashboard-kpi-progress-label {
    color: var(--muted);
    font-size: 7px;
    font-weight: 750;
    line-height: 1;
    white-space: nowrap;
  }


  .dashboard-two-column {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
    gap: 10px;
    margin-top: 10px;
  }

  .dashboard-panel,
  .dashboard-profile-card,
  .dashboard-person-card,
  .dashboard-list-panel {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .dashboard-panel,
  .dashboard-list-panel {
    padding: 16px;
  }

  .dashboard-panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .dashboard-panel-heading > div {
    min-width: 0;
  }

  .dashboard-panel-heading h2 {
    margin: 3px 0 0;
    color: var(--text);
    font-size: 14px;
    font-weight: 850;
  }

  .dashboard-panel-heading p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 9px;
    line-height: 1.5;
  }

  .dashboard-panel-badge {
    padding: 4px 6px;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--surface);
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .dashboard-workforce {
    display: grid;
    grid-template-columns: 185px minmax(0, 1fr);
    align-items: center;
    gap: 20px;
  }

  .dashboard-workforce-visual {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
  }

  .dashboard-workforce-visual-meta {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }

  .dashboard-workforce-visual-meta span {
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.08em;
  }

  .dashboard-workforce-visual-meta strong {
    color: var(--text);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-workforce-visual-meta small {
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-workforce-details {
    min-width: 0;
  }

  .dashboard-workforce-segmented {
    display: flex;
    width: 100%;
    height: 7px;
    overflow: hidden;
    margin-bottom: 13px;
    border-radius: 999px;
    background: var(--track);
    box-shadow: inset 0 0 0 1px var(--border);
  }

  .dashboard-workforce-segment {
    display: block;
    min-width: 0;
    height: 100%;
    transition: width 0.35s ease;
  }

  .dashboard-workforce-segment + .dashboard-workforce-segment {
    box-shadow: inset 1px 0 0 var(--card);
  }

  .dashboard-workforce-segment.segment-active {
    background: var(--success);
  }

  .dashboard-workforce-segment.segment-inactive {
    background: var(--warning);
  }

  .dashboard-workforce-segment.segment-resigned {
    background: #7757ff;
  }

  .dashboard-workforce-segment.segment-terminated {
    background: var(--danger);
  }

  .dashboard-donut {
    position: relative;
    width: 148px;
    height: 148px;
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
    inset: 20px;
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

  .dashboard-donut-center > span {
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.08em;
  }

  .dashboard-donut-center strong {
    margin-top: 4px;
    color: var(--text);
    font-size: 24px;
    line-height: 1;
    font-weight: 850;
  }

  .dashboard-donut-center small {
    margin-top: 4px;
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-status-list,
  .dashboard-role-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dashboard-role-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-bottom: 13px;
  }

  .dashboard-role-summary > div {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    padding: 8px 9px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--surface);
  }

  .dashboard-role-summary span {
    color: var(--muted);
    font-size: 6px;
    font-weight: 850;
    letter-spacing: 0.08em;
  }

  .dashboard-role-summary strong {
    max-width: 100%;
    overflow: hidden;
    color: var(--text);
    font-size: 9px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-status-top,
  .dashboard-role-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 5px;
  }

  .dashboard-status-top span,
  .dashboard-role-top span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text);
    font-size: 9px;
    font-weight: 700;
  }

  .dashboard-status-top strong,
  .dashboard-role-top strong {
    color: var(--text);
    font-size: 10px;
  }

  .dashboard-status-top i,
  .dashboard-role-top i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-2);
  }

  .dashboard-status-top i.status-active {
    background: var(--success);
  }

  .dashboard-status-top i.status-inactive {
    background: var(--warning);
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
    transition: width 0.35s ease;
  }

  .dashboard-status small {
    display: block;
    margin-top: 3px;
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-panel-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    padding: 9px 11px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .dashboard-panel-total span {
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-panel-total strong {
    color: var(--text);
    font-size: 11px;
  }

  .dashboard-role-top strong small {
    margin-left: 5px;
    color: var(--muted);
    font-size: 8px;
    font-weight: 600;
  }

  .dashboard-role-rank {
    min-width: 17px;
    color: var(--muted);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .dashboard-role-progress {
    background: var(--accent);
  }

  .dashboard-action-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .dashboard-quick-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .dashboard-quick-action {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
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
    width: 33px;
    height: 33px;
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
    font-size: 9px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-quick-copy small {
    display: -webkit-box;
    margin-top: 3px;
    overflow: hidden;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.35;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .dashboard-quick-arrow {
    flex: 0 0 auto;
    color: var(--accent-2);
    font-size: 14px;
  }

  .dashboard-module-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .dashboard-module {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    min-height: 142px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 10px;
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

  .dashboard-module-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
  }

  .dashboard-module-icon {
    width: 34px;
    height: 34px;
    background: var(--accent-soft);
    color: var(--accent-2);
  }

  .dashboard-module-open {
    color: var(--muted);
    font-size: 12px;
    transition: 0.2s ease;
  }

  .dashboard-module:hover .dashboard-module-open {
    color: var(--accent-2);
    transform: translateX(2px);
  }

  .dashboard-module strong {
    margin-top: 11px;
    color: var(--text);
    font-size: 10px;
    font-weight: 850;
  }

  .dashboard-module p {
    display: -webkit-box;
    min-height: 30px;
    margin: 5px 0 8px;
    overflow: hidden;
    color: var(--muted);
    font-size: 8px;
    line-height: 1.45;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .dashboard-module-link {
    margin-top: auto;
    color: var(--accent-2);
    font-size: 8px;
    font-weight: 850;
  }

  .dashboard-profile-layout {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 10px;
  }

  .dashboard-person-card {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    padding: 18px;
    text-align: center;
  }

  .dashboard-large-avatar {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        var(--accent),
        #d94801
      );
    color: #fff;
    font-size: 18px;
    font-weight: 850;
    box-shadow: 0 9px 22px rgba(255, 107, 0, 0.2);
  }

  .dashboard-person-card h3 {
    margin: 10px 0 3px;
    color: var(--text);
    font-size: 13px;
  }

  .dashboard-person-card p {
    margin: 0;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-person-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 11px;
    padding: 5px 8px;
    border-radius: 99px;
    background: rgba(13, 187, 99, 0.1);
    color: var(--success);
    font-size: 8px;
    font-weight: 850;
  }

  .dashboard-profile-card {
    padding: 13px;
  }

  .dashboard-profile-card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 9px;
  }

  .dashboard-profile-card-heading span {
    display: block;
    color: var(--accent);
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.08em;
  }

  .dashboard-profile-card-heading strong {
    display: block;
    margin-top: 3px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 600;
  }

  .dashboard-profile-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 7px;
  }

  .dashboard-info-card {
    min-width: 0;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .dashboard-info-card span {
    display: block;
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dashboard-info-card strong {
    display: block;
    margin-top: 5px;
    overflow: hidden;
    color: var(--text);
    font-size: 10px;
    font-weight: 750;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-info-card strong.muted {
    color: var(--muted);
    font-weight: 600;
  }

  .dashboard-employee-content {
    width: 100%;
    min-width: 0;
  }

  .dashboard-employee-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    min-height: 112px;
    margin-top: 7px;
    padding: 20px 22px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background:
      linear-gradient(
        135deg,
        var(--card),
        var(--accent-soft)
      );
    box-shadow: var(--shadow);
  }

  .dashboard-employee-hero-copy {
    min-width: 0;
  }

  .dashboard-employee-hero-copy h1 {
    margin: 7px 0 4px;
    color: var(--text);
    font-size: 23px;
    font-weight: 850;
    letter-spacing: -0.03em;
  }

  .dashboard-employee-hero-copy p {
    max-width: 650px;
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.5;
  }

  .dashboard-employee-hero-badge {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--card);
  }

  .dashboard-employee-hero-badge > span {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
    font-size: 9px;
    font-weight: 850;
  }

  .dashboard-employee-hero-badge strong,
  .dashboard-employee-hero-badge small {
    display: block;
  }

  .dashboard-employee-hero-badge strong {
    color: var(--text);
    font-size: 9px;
  }

  .dashboard-employee-hero-badge small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-employee-profile-layout {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    align-items: stretch;
    width: 100%;
    min-width: 0;
    gap: 8px;
    margin: 0 0 8px;
  }

  .dashboard-employee-person-card {
    min-width: 0;
    min-height: 184px;
    box-sizing: border-box;
    padding: 15px;
  }

  .dashboard-employee-person-copy {
    width: 100%;
    min-width: 0;
  }

  .dashboard-employee-person-copy h3 {
    max-width: 100%;
    overflow: hidden;
    margin: 7px 0 2px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-employee-profile-card {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 10px;
  }

  .dashboard-employee-profile-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    min-width: 0;
    gap: 6px;
  }

  .dashboard-employee-profile-grid .dashboard-info-card {
    min-width: 0;
    width: 100%;
    min-height: 70px;
    box-sizing: border-box;
    padding: 10px;
  }

  .dashboard-employee-profile-grid .dashboard-info-card strong {
    max-width: 100%;
  }

  .dashboard-employee-content .dashboard-section-header {
    margin-top: 14px;
    margin-bottom: 7px;
  }

  .dashboard-employee-content .dashboard-module-grid {
    width: 100%;
    min-width: 0;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 7px;
  }

  .dashboard-employee-content .dashboard-module {
    min-width: 0;
    width: 100%;
    min-height: 110px;
    box-sizing: border-box;
    padding: 10px;
  }

  .dashboard-employee-content .dashboard-module-icon {
    width: 31px;
    height: 31px;
  }

  .dashboard-employee-content .dashboard-module strong {
    margin-top: 7px;
  }

  .dashboard-employee-content .dashboard-module p {
    min-height: 25px;
    margin: 4px 0 6px;
  }

  .dashboard-today-attendance {
    width: 100%;
    min-width: 0;
    margin: 0 0 8px;
    padding: 13px;
    box-sizing: border-box;
  }

  .dashboard-attendance-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .dashboard-attendance-header h2 {
    margin: 3px 0 3px;
    color: var(--text);
    font-size: 14px;
    font-weight: 850;
  }

  .dashboard-attendance-header p {
    margin: 0;
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-attendance-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--surface);
    color: var(--muted);
    font-size: 8px;
    font-weight: 850;
    white-space: nowrap;
  }

  .dashboard-attendance-status i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--muted);
  }

  .dashboard-attendance-status.is-working {
    color: var(--success);
  }

  .dashboard-attendance-status.is-working i {
    background: var(--success);
  }

  .dashboard-attendance-status.is-completed {
    color: var(--accent-2);
  }

  .dashboard-attendance-status.is-completed i {
    background: var(--accent-2);
  }

  .dashboard-attendance-status.is-pending {
    color: var(--warning);
  }

  .dashboard-attendance-status.is-pending i {
    background: var(--warning);
  }

  .dashboard-attendance-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin: 0 0 8px;
  }

  .dashboard-attendance-summary > div {
    min-width: 0;
    padding: 9px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .dashboard-attendance-summary span {
    display: block;
    color: var(--muted);
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dashboard-attendance-summary strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: var(--text);
    font-size: 11px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-attendance-summary small {
    display: block;
    margin-top: 3px;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-attendance-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .dashboard-selfie-box {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .dashboard-selfie-copy {
    min-width: 120px;
  }

  .dashboard-selfie-copy span,
  .dashboard-selfie-copy small {
    display: block;
  }

  .dashboard-selfie-copy span {
    color: var(--text);
    font-size: 8px;
    font-weight: 800;
  }

  .dashboard-selfie-copy small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-selfie-input {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 135px;
    min-height: 35px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
    overflow: hidden;
    box-sizing: border-box;
  }

  .dashboard-selfie-input:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .dashboard-selfie-input span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-selfie-input input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .dashboard-selfie-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .dashboard-selfie-preview img {
    display: block;
    width: 38px;
    height: 38px;
    object-fit: cover;
    border: 1px solid var(--border);
    border-radius: 7px;
  }

  .dashboard-selfie-preview button {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 7px;
    background: var(--card);
    color: var(--muted);
    font-size: 7px;
    font-weight: 750;
    cursor: pointer;
  }

  .dashboard-selfie-preview button:hover {
    border-color: var(--danger);
    color: var(--danger);
  }

  .dashboard-attendance-button-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .dashboard-attendance-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 116px;
    min-height: 35px;
    padding: 7px 11px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    font-size: 9px;
    font-weight: 850;
    cursor: pointer;
    box-shadow: 0 6px 14px rgba(255, 107, 0, 0.16);
    transition: 0.2s ease;
  }

  .dashboard-attendance-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(255, 107, 0, 0.22);
  }

  .dashboard-attendance-button:disabled {
    opacity: 0.6;
    cursor: wait;
    transform: none;
  }

  .dashboard-attendance-button span {
    font-size: 11px;
  }

  .dashboard-attendance-loading,
  .dashboard-list-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 55px;
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-mini-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--track);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: dashboard-spin 0.8s linear infinite;
  }

  .dashboard-attendance-complete {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 11px;
    border: 1px solid rgba(13, 187, 99, 0.2);
    border-radius: 8px;
    background: rgba(13, 187, 99, 0.07);
  }

  .dashboard-attendance-complete > span {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: rgba(13, 187, 99, 0.13);
    color: var(--success);
    font-size: 10px;
    font-weight: 850;
  }

  .dashboard-attendance-complete strong,
  .dashboard-attendance-complete small {
    display: block;
  }

  .dashboard-attendance-complete strong {
    color: var(--text);
    font-size: 8px;
  }

  .dashboard-attendance-complete small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-state-error,
  .dashboard-state-success {
    margin: 8px 0 0;
    padding: 7px 9px;
    border-radius: 7px;
    font-size: 8px;
    line-height: 1.45;
  }

  .dashboard-state-error {
    border: 1px solid rgba(239, 75, 85, 0.2);
    background: rgba(239, 75, 85, 0.07);
    color: var(--danger);
  }

  .dashboard-state-success {
    border: 1px solid rgba(13, 187, 99, 0.2);
    background: rgba(13, 187, 99, 0.07);
    color: var(--success);
  }

  .dashboard-field-operations {
    margin-top: 15px;
    padding: 17px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .dashboard-field-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 11px;
  }

  .dashboard-field-title-row {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }

  .dashboard-field-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 33px;
    height: 33px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent-2);
    font-size: 7px;
    font-weight: 850;
  }

  .dashboard-field-title-line {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .dashboard-field-title-line h2 {
    margin: 0;
    color: var(--text);
    font-size: 14px;
    font-weight: 850;
  }

  .dashboard-field-heading p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 8px;
    line-height: 1.5;
  }

  .dashboard-field-badge,
  .dashboard-field-status {
    display: inline-flex;
    align-items: center;
    border-radius: 5px;
    font-size: 7px;
    font-weight: 850;
    letter-spacing: 0.04em;
  }

  .dashboard-field-badge {
    padding: 3px 6px;
    background: #eff6ff;
    color: #2563eb;
  }

  .dashboard-field-status {
    padding: 5px 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    white-space: nowrap;
  }

  .dashboard-field-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 9px;
    padding: 8px 10px;
    border: 1px dashed var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
  }

  .dashboard-field-notice > span {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 9px;
    font-weight: 850;
  }

  .dashboard-field-notice strong {
    display: block;
    color: var(--text);
    font-size: 8px;
  }

  .dashboard-field-notice p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.4;
  }

  .dashboard-field-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .dashboard-field-kpi {
    min-width: 0;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
  }

  .dashboard-field-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
  }

  .dashboard-field-kpi-top span {
    min-width: 0;
    overflow: hidden;
    color: var(--muted);
    font-size: 8px;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-field-kpi-top b {
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 22px;
    padding: 0 4px;
    border-radius: 5px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 6px;
    font-weight: 850;
  }

  .dashboard-field-kpi > strong {
    display: block;
    margin-top: 10px;
    color: var(--text);
    font-size: 20px;
    line-height: 1;
    font-weight: 850;
  }

  .dashboard-field-kpi > small {
    display: block;
    margin-top: 6px;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.4;
  }

  .dashboard-field-panel-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .dashboard-field-panel {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
  }

  .dashboard-field-panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
  }

  .dashboard-field-panel-heading h3 {
    margin: 0;
    color: var(--text);
    font-size: 10px;
    font-weight: 800;
  }

  .dashboard-field-panel-heading p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-field-panel-heading > span {
    padding: 3px 5px;
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 6px;
    font-weight: 850;
  }

  .dashboard-field-activity-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .dashboard-field-activity-list > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--card);
  }

  .dashboard-field-activity-list span {
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-field-activity-list strong {
    color: var(--muted);
    font-size: 10px;
  }

  .dashboard-gps-empty {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 61px;
    padding: 7px;
    border: 1px dashed var(--border);
    border-radius: 7px;
    background: var(--card);
  }

  .dashboard-gps-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 35px;
    height: 35px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent-2);
    font-size: 6px;
    font-weight: 850;
  }

  .dashboard-gps-empty strong {
    color: var(--text);
    font-size: 8px;
  }

  .dashboard-gps-empty p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.4;
  }

  .dashboard-bottom-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 10px;
    margin-top: 10px;
  }

  .dashboard-list {
    border-top: 1px solid var(--border);
  }

  .dashboard-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 51px;
    padding: 7px 1px;
    border-bottom: 1px solid var(--border);
  }

  .dashboard-list-content {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  .dashboard-list-content > div:last-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dashboard-list-marker {
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-2);
  }

  .dashboard-list-row strong {
    overflow: hidden;
    color: var(--text);
    font-size: 9px;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-list-row span {
    display: -webkit-box;
    margin-top: 3px;
    overflow: hidden;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.35;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .dashboard-list-date {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
  }

  .dashboard-list-date span {
    margin: 0;
    white-space: nowrap;
  }

  .dashboard-list-date i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent-2);
  }

  .dashboard-holiday-marker {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 25px;
    height: 25px;
    border-radius: 7px;
    background: var(--accent-soft);
  }

  .dashboard-holiday-marker span {
    margin: 0;
    color: var(--accent);
    font-size: 8px;
  }

  .dashboard-holiday-date {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    gap: 2px;
    flex: 0 0 auto;
  }

  .dashboard-holiday-date span,
  .dashboard-holiday-date small {
    margin: 0;
    color: var(--muted);
    font-size: 7px;
  }

  .dashboard-holiday-date span {
    color: var(--text);
    font-weight: 750;
  }

  .dashboard-empty-text {
    margin: 0;
    color: var(--muted);
    font-size: 9px;
  }

  .dashboard-empty-state {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    min-height: 90px;
    padding: 14px;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: var(--surface);
    text-align: center;
  }

  .dashboard-empty-state strong {
    color: var(--text);
    font-size: 9px;
  }

  .dashboard-empty-state span {
    max-width: 320px;
    margin-top: 4px;
    color: var(--muted);
    font-size: 7px;
    line-height: 1.45;
  }

  .dashboard-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 16px;
    padding-top: 13px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 8px;
  }

  .dashboard-footer span:first-child {
    color: var(--text);
    font-weight: 750;
  }

  .dashboard-footer-dot {
    opacity: 0.45;
  }

  .dashboard-state {
    min-height: 65vh;
    display: grid;
    place-items: center;
    padding: 30px;
  }

  .dashboard-state-card {
    width: min(430px, 100%);
    padding: 28px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    box-shadow: var(--shadow);
    text-align: center;
  }

  .dashboard-state-icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    margin: 0 auto;
    border-radius: 13px;
    background: var(--accent-soft);
  }

  .dashboard-state-kicker {
    display: block;
    margin-top: 14px;
    color: var(--accent);
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.12em;
  }

  .dashboard-state-card h2 {
    margin: 7px 0 6px;
    color: var(--text);
    font-size: 18px;
  }

  .dashboard-state-card p {
    margin: 0 0 17px;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.6;
  }

  .dashboard-spinner {
    width: 25px;
    height: 25px;
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

    .dashboard-profile-grid,
    .dashboard-employee-profile-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-employee-profile-layout {
      grid-template-columns: 195px minmax(0, 1fr);
    }

    .dashboard-employee-content .dashboard-module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .dashboard-page-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .dashboard-two-column,
    .dashboard-bottom-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-module-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-workforce {
      grid-template-columns: 170px minmax(0, 1fr);
    }

    .dashboard-welcome-visual {
      right: -20px;
      opacity: 0.22;
    }

    .dashboard-employee-profile-layout {
      grid-template-columns: 170px minmax(0, 1fr);
    }

    .dashboard-employee-profile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-employee-content .dashboard-module-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-field-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-field-panel-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .dashboard-page {
      border-radius: 10px;
    }

    .dashboard-shell {
      padding-bottom: 16px;
    }

    .dashboard-page-header {
      padding-bottom: 13px;
    }

    .dashboard-title-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 7px;
    }

    .dashboard-header-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .dashboard-refresh {
      width: 100%;
    }

    .dashboard-last-updated {
      text-align: right;
    }

    .dashboard-welcome {
      align-items: flex-start;
      min-height: 0;
      padding: 19px;
    }

    .dashboard-welcome h2 {
      font-size: 22px;
    }

    .dashboard-welcome p {
      max-width: 100%;
    }

    .dashboard-welcome-visual {
      display: none;
    }

    .dashboard-section-header {
      align-items: flex-start;
      flex-direction: column;
      margin-top: 17px;
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

    .dashboard-workforce-visual {
      align-items: center;
    }

    .dashboard-donut {
      width: 140px;
      height: 140px;
    }

    .dashboard-quick-list {
      grid-template-columns: 1fr;
    }

    .dashboard-panel,
    .dashboard-list-panel,
    .dashboard-profile-card,
    .dashboard-person-card {
      padding: 13px;
    }

    .dashboard-employee-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 17px;
    }

    .dashboard-employee-hero-badge {
      width: 100%;
      box-sizing: border-box;
    }

    .dashboard-employee-profile-layout {
      grid-template-columns: 1fr;
    }

    .dashboard-employee-person-card {
      min-height: 145px;
    }

    .dashboard-employee-profile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-employee-content .dashboard-module-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-attendance-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-attendance-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-attendance-actions {
      grid-template-columns: 1fr;
    }

    .dashboard-selfie-box {
      align-items: stretch;
      flex-direction: column;
    }

    .dashboard-selfie-copy {
      min-width: 0;
    }

    .dashboard-selfie-input {
      width: 100%;
    }

    .dashboard-attendance-button-group {
      justify-content: stretch;
    }

    .dashboard-attendance-button {
      width: 100%;
    }

    .dashboard-field-operations {
      padding: 13px;
    }

    .dashboard-field-heading {
      flex-direction: column;
    }

    .dashboard-field-status {
      align-self: flex-start;
    }

    .dashboard-field-title-line {
      align-items: flex-start;
      flex-direction: column;
      gap: 5px;
    }

    .dashboard-field-kpi-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-field-activity-list {
      grid-template-columns: 1fr;
    }

    .dashboard-list-row {
      align-items: flex-start;
    }

    .dashboard-list-date {
      align-items: flex-end;
      flex-direction: column;
    }
  }

  @media (max-width: 430px) {
    .dashboard-employee-profile-grid,
    .dashboard-employee-content .dashboard-module-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-attendance-summary {
      grid-template-columns: 1fr;
    }

    .dashboard-footer {
      flex-wrap: wrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dashboard-page *,
    .dashboard-page *::before,
    .dashboard-page *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`

export default Dashboard