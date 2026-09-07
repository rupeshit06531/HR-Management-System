import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"
import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  globalSearch,
  type GlobalSearchResult,
} from "../api/search"

import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "../api/notifications"

interface NavigationItem {
  label: string
  path: string
  roles: string[]
  short: string
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "DB",
  },
  {
    label: "Change Password",
    path: "/change-password",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "CP",
  },
  {
    label: "Employees",
    path: "/employees",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
    ],
    short: "EM",
  },
  {
    label: "Departments",
    path: "/departments",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    short: "DP",
  },
  {
    label: "Attendance",
    path: "/attendance",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "AT",
  },
  {
    label: "Leave",
    path: "/leave",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "LV",
  },
  {
    label: "Payroll",
    path: "/payroll",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "EMPLOYEE",
    ],
    short: "PR",
  },
  {
    label: "Performance",
    path: "/performance",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "PF",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    roles: [
      "SUPER_ADMIN",
      "HR",
    ],
    short: "RC",
  },
  {
    label: "Documents",
    path: "/documents",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "DC",
  },
  {
    label: "Holidays",
    path: "/holidays",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "HD",
  },
  {
    label: "Announcements",
    path: "/announcements",
    roles: [
      "SUPER_ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
    ],
    short: "AN",
  },
]

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "Human Resources",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

function formatNotificationTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()
  const diffMs =
    now.getTime() - date.getTime()

  const diffMinutes = Math.floor(
    diffMs / (1000 * 60),
  )

  if (diffMinutes < 1) {
    return "Just now"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(
    diffMinutes / 60,
  )

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(
    diffHours / 24,
  )

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  )
}

function getNotificationShortCode(
  notificationType: string,
): string {
  switch (notificationType) {
    case "ANNOUNCEMENT":
      return "AN"
    case "LEAVE":
      return "LV"
    case "ATTENDANCE":
      return "AT"
    case "PAYROLL":
      return "PR"
    case "PERFORMANCE":
      return "PF"
    case "RECRUITMENT":
      return "RC"
    case "DOCUMENT":
      return "DC"
    default:
      return "SY"
  }
}

function AppLayout() {
  const navigate = useNavigate()

  const {
    user,
    logout,
  } = useAuth()

  const {
    isDarkMode,
    toggleDarkMode,
  } = useTheme()

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationRecord[]>([])

  const [
    unreadNotificationCount,
    setUnreadNotificationCount,
  ] = useState(0)

  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false)

  const [
    isNotificationLoading,
    setIsNotificationLoading,
  ] = useState(false)

  const [
    isMarkingAllRead,
    setIsMarkingAllRead,
  ] = useState(false)

  const notificationRef =
    useRef<HTMLDivElement | null>(null)

  /*
   * Global Search
   */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("")

  const [
    searchResults,
    setSearchResults,
  ] = useState<GlobalSearchResult[]>([])

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false)

  const [
    isSearchLoading,
    setIsSearchLoading,
  ] = useState(false)

  const searchRef =
    useRef<HTMLDivElement | null>(null)

  const searchTimeoutRef =
    useRef<number | null>(null)

  const loadNotificationCount =
    async () => {
      if (!user) {
        setUnreadNotificationCount(0)
        return
      }

      try {
        const count =
          await getUnreadNotificationCount()

        setUnreadNotificationCount(count)
      } catch {
        // Notification failures should never
        // break the main application layout.
      }
    }

  const loadNotifications =
    async () => {
      if (!user) {
        setNotifications([])
        setUnreadNotificationCount(0)
        return
      }

      setIsNotificationLoading(true)

      try {
        const response =
          await getNotifications({
            page_size: 8,
            ordering: "-created_at",
          })

        setNotifications(
          response.results.slice(0, 8),
        )

        const count =
          await getUnreadNotificationCount()

        setUnreadNotificationCount(count)
      } catch {
        // Keep the existing notification state
        // when the request fails.
      } finally {
        setIsNotificationLoading(false)
      }
    }

  useEffect(() => {
    void loadNotificationCount()

    const intervalId =
      window.setInterval(() => {
        void loadNotificationCount()
      }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [user])

  useEffect(() => {
    const handleDocumentClick = (
      event: MouseEvent,
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentClick,
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick,
      )
    }
  }, [])

  /*
   * Close global search when clicking outside.
   */

  useEffect(() => {
    const handleSearchOutsideClick = (
      event: MouseEvent,
    ) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleSearchOutsideClick,
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleSearchOutsideClick,
      )
    }
  }, [])

  /*
   * Debounced global employee search.
   */

  useEffect(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(
        searchTimeoutRef.current,
      )
    }

    const trimmedQuery =
      searchQuery.trim()

    if (trimmedQuery.length < 2) {
      setSearchResults([])
      setIsSearchLoading(false)
      return
    }

    setIsSearchLoading(true)
    setIsSearchOpen(true)

    searchTimeoutRef.current =
      window.setTimeout(async () => {
        try {
          const response =
            await globalSearch(
              trimmedQuery,
            )

          setSearchResults(
            response.results,
          )
        } catch {
          setSearchResults([])
        } finally {
          setIsSearchLoading(false)
        }
      }, 300)

    return () => {
      if (
        searchTimeoutRef.current !== null
      ) {
        window.clearTimeout(
          searchTimeoutRef.current,
        )
      }
    }
  }, [searchQuery])

  const handleNotificationToggle =
    async () => {
      const nextOpen =
        !isNotificationOpen

      setIsNotificationOpen(nextOpen)

      if (nextOpen) {
        await loadNotifications()
      }
    }

  const handleNotificationClick =
    async (
      notification: NotificationRecord,
    ) => {
      if (!notification.is_read) {
        try {
          const updated =
            await markNotificationRead(
              notification.id,
            )

          setNotifications((current) =>
            current.map((item) =>
              item.id === updated.id
                ? updated
                : item,
            ),
          )

          setUnreadNotificationCount(
            (current) =>
              Math.max(0, current - 1),
          )
        } catch {
          // Navigation should still work even
          // if marking the notification fails.
        }
      }

      setIsNotificationOpen(false)

      if (notification.action_url) {
        if (
          notification.action_url.startsWith(
            "http://",
          ) ||
          notification.action_url.startsWith(
            "https://",
          )
        ) {
          window.location.href =
            notification.action_url
        } else {
          navigate(
            notification.action_url,
          )
        }
      }
    }

  const handleMarkAllRead =
    async () => {
      if (
        isMarkingAllRead ||
        unreadNotificationCount === 0
      ) {
        return
      }

      setIsMarkingAllRead(true)

      try {
        await markAllNotificationsRead()

        setNotifications((current) =>
          current.map((item) => ({
            ...item,
            is_read: true,
          })),
        )

        setUnreadNotificationCount(0)
      } catch {
        // Keep current state when request fails.
      } finally {
        setIsMarkingAllRead(false)
      }
    }

  const handleSearchResultClick = (
    result: GlobalSearchResult,
  ) => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearchOpen(false)

    navigate(
      `/employees?employee=${result.id}`,
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate("/login", {
        replace: true,
      })
    }
  }

  const visibleNavigationItems =
    navigationItems.filter((item) =>
      item.roles.includes(
        user?.role ?? "",
      ),
    )

  const displayName =
    user?.first_name?.trim() ||
    user?.username ||
    "User"

  const currentRole =
    roleLabels[user?.role ?? ""] ||
    user?.role ||
    "Employee"

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join("") || "U"

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: isDarkMode
          ? "linear-gradient(180deg, #071018 0%, #0f172a 100%)"
          : "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        color: isDarkMode
          ? "#f8fafc"
          : "#111827",
        fontFamily:
          '"Inter", "Segoe UI", Arial, sans-serif',
      }}
    >
      <aside
        style={{
          width: "245px",
          minWidth: "245px",
          minHeight: "100vh",
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(8,12,18,0.96), rgba(12,17,25,0.98))"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: isDarkMode
            ? "1px solid rgba(148, 163, 184, 0.18)"
            : "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflowY: "auto",
          boxShadow:
            "inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            padding: "21px 20px 20px",
            borderBottom:
              "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  boxShadow:
                    "0 10px 20px rgba(249, 115, 22, 0.35)",
                }}
              >
                HR
              </div>

              <div>
                <div
                  style={{
                    color: isDarkMode
                      ? "#f8fafc"
                      : "#0f172a",
                    fontSize: "16px",
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  HR Management
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    color: isDarkMode
                      ? "#94a3b8"
                      : "#64748b",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  Enterprise HRMS
                </div>
              </div>
            </div>
          </button>
        </div>

        <div
          style={{
            padding: "19px 12px",
            flex: 1,
          }}
        >
          <div
            style={{
              padding:
                "0 10px 9px",
              color: isDarkMode
                ? "#94a3b8"
                : "#64748b",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Main Menu
          </div>

          <nav
            aria-label="Main navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            {visibleNavigationItems.map(
              (item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    minHeight: "42px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    color: isActive
                      ? "#fff7ed"
                      : isDarkMode
                        ? "#cbd5e1"
                        : "#475569",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(249,115,22,0.95), rgba(234,88,12,0.9))"
                      : "transparent",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: isActive
                      ? 700
                      : 600,
                    boxSizing: "border-box",
                    border: isActive
                      ? "1px solid rgba(251,146,60,0.5)"
                      : "1px solid transparent",
                    boxShadow: isActive
                      ? "0 10px 20px rgba(249,115,22,0.2)"
                      : "none",
                    transition:
                      "all 0.2s ease",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          background:
                            isActive
                              ? "rgba(249,115,22,0.14)"
                              : isDarkMode
                                ? "rgba(148,163,184,0.08)"
                                : "#f1f5f9",
                          color: isActive
                            ? "#ea580c"
                            : isDarkMode
                              ? "#cbd5e1"
                              : "#475569",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "8px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.short}
                      </span>

                      <span>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        <div
          style={{
            padding: "13px 12px",
            borderTop:
              "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              void handleLogout()
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              border:
                "1px solid rgba(148,163,184,0.14)",
              borderRadius: "10px",
              background: isDarkMode
                ? "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))"
                : "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
              color: isDarkMode
                ? "#e2e8f0"
                : "#0f172a",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              fontWeight: 650,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,146,60,0.18))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 800,
                color: "#fdba74",
                border:
                  "1px solid rgba(251,146,60,0.3)",
              }}
            >
              OUT
            </span>

            <span>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            minHeight: "68px",
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(11,16,23,0.96), rgba(15,23,42,0.9))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
            borderBottom: isDarkMode
              ? "1px solid rgba(148, 163, 184, 0.18)"
              : "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 25px",
            boxSizing: "border-box",
            gap: "20px",
            position: "sticky",
            top: 0,
            zIndex: 20,
            boxShadow: isDarkMode
              ? "0 10px 30px rgba(2, 6, 23, 0.18)"
              : "0 8px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 750,
                color: isDarkMode
                  ? "#f8fafc"
                  : "#0f172a",
              }}
            >
              Human Resources
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "11px",
                color: isDarkMode
                  ? "#94a3b8"
                  : "#64748b",
              }}
            >
              Workforce management
              platform
            </div>
          </div>

          <div
            ref={searchRef}
            style={{
              position: "relative",
              flex: 1,
              maxWidth: "430px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                height: "42px",
                padding: "0 13px",
                border: isDarkMode
                  ? "1px solid rgba(148,163,184,0.18)"
                  : "1px solid #e2e8f0",
                borderRadius: "11px",
                background: isDarkMode
                  ? "rgba(15,23,42,0.72)"
                  : "#ffffff",
                boxSizing: "border-box",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: "15px",
                  color: isDarkMode
                    ? "#94a3b8"
                    : "#64748b",
                  lineHeight: 1,
                }}
              >
                ⌕
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  const value =
                    event.target.value

                  setSearchQuery(value)

                  setIsSearchOpen(
                    value.trim().length >= 2,
                  )
                }}
                onFocus={() => {
                  if (
                    searchQuery.trim()
                      .length >= 2
                  ) {
                    setIsSearchOpen(true)
                  }
                }}
                placeholder="Search employees..."
                aria-label="Search employees"
                style={{
                  width: "100%",
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: isDarkMode
                    ? "#f8fafc"
                    : "#0f172a",
                  fontSize: "11px",
                  fontFamily:
                    "inherit",
                }}
              />
            </div>

            {isSearchOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  left: 0,
                  right: 0,
                  borderRadius: "14px",
                  border: isDarkMode
                    ? "1px solid rgba(148,163,184,0.2)"
                    : "1px solid #e2e8f0",
                  background: isDarkMode
                    ? "linear-gradient(180deg, #111827, #0f172a)"
                    : "#ffffff",
                  boxShadow: isDarkMode
                    ? "0 24px 60px rgba(0,0,0,0.45)"
                    : "0 24px 60px rgba(15,23,42,0.18)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {isSearchLoading ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: isDarkMode
                        ? "#94a3b8"
                        : "#64748b",
                      fontSize: "11px",
                    }}
                  >
                    Searching...
                  </div>
                ) : searchResults.length ===
                  0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: isDarkMode
                        ? "#94a3b8"
                        : "#64748b",
                      fontSize: "11px",
                    }}
                  >
                    No employees found.
                  </div>
                ) : (
                  searchResults.map(
                    (result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() =>
                          handleSearchResultClick(
                            result,
                          )
                        }
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          padding:
                            "11px 13px",
                          border: "none",
                          borderBottom:
                            isDarkMode
                              ? "1px solid rgba(148,163,184,0.08)"
                              : "1px solid #f1f5f9",
                          background:
                            "transparent",
                          color: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            minWidth: "32px",
                            borderRadius: "9px",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "rgba(249,115,22,0.12)",
                            color:
                              "#ea580c",
                            fontSize: "9px",
                            fontWeight: 800,
                          }}
                        >
                          EM
                        </span>

                        <span
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              display:
                                "block",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                              fontSize: "11px",
                              fontWeight: 750,
                              color:
                                isDarkMode
                                  ? "#f1f5f9"
                                  : "#0f172a",
                            }}
                          >
                            {result.full_name ||
                              result.employee_id}
                          </span>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                              fontSize: "9px",
                              color:
                                isDarkMode
                                  ? "#94a3b8"
                                  : "#64748b",
                            }}
                          >
                            {result.employee_id}
                            {" · "}
                            {result.designation ||
                              result.department ||
                              "Employee"}
                          </span>
                        </span>
                      </button>
                    ),
                  )
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              ref={notificationRef}
              style={{
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  void handleNotificationToggle()
                }}
                aria-label="Notifications"
                aria-expanded={
                  isNotificationOpen
                }
                title="Notifications"
                style={{
                  position: "relative",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isDarkMode
                    ? "1px solid rgba(148,163,184,0.18)"
                    : "1px solid #e2e8f0",
                  borderRadius: "11px",
                  background: isDarkMode
                    ? "rgba(15,23,42,0.72)"
                    : "#ffffff",
                  color: isDarkMode
                    ? "#e2e8f0"
                    : "#334155",
                  cursor: "pointer",
                  fontSize: "19px",
                  transition:
                    "all 0.2s ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    lineHeight: 1,
                  }}
                >
                  ♢
                </span>

                {unreadNotificationCount >
                  0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 5px",
                      borderRadius: "999px",
                      background:
                        "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "#ffffff",
                      border:
                        "2px solid var(--app-bg, #ffffff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: 800,
                      lineHeight: 1,
                      boxSizing:
                        "border-box",
                    }}
                  >
                    {unreadNotificationCount >
                    99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "52px",
                    right: 0,
                    width: "370px",
                    maxWidth:
                      "calc(100vw - 30px)",
                    borderRadius: "14px",
                    border: isDarkMode
                      ? "1px solid rgba(148,163,184,0.2)"
                      : "1px solid #e2e8f0",
                    background: isDarkMode
                      ? "linear-gradient(180deg, #111827, #0f172a)"
                      : "#ffffff",
                    boxShadow: isDarkMode
                      ? "0 24px 60px rgba(0,0,0,0.45)"
                      : "0 24px 60px rgba(15,23,42,0.18)",
                    overflow: "hidden",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding:
                        "14px 15px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                      borderBottom:
                        isDarkMode
                          ? "1px solid rgba(148,163,184,0.14)"
                          : "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color:
                            isDarkMode
                              ? "#f8fafc"
                              : "#0f172a",
                        }}
                      >
                        Notifications
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "10px",
                          color:
                            isDarkMode
                              ? "#94a3b8"
                              : "#64748b",
                        }}
                      >
                        {unreadNotificationCount}{" "}
                        unread
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void handleMarkAllRead()
                      }}
                      disabled={
                        isMarkingAllRead ||
                        unreadNotificationCount ===
                          0
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        color:
                          unreadNotificationCount >
                          0
                            ? "#ea580c"
                            : isDarkMode
                              ? "#64748b"
                              : "#94a3b8",
                        cursor:
                          unreadNotificationCount >
                            0 &&
                          !isMarkingAllRead
                            ? "pointer"
                            : "default",
                        fontSize: "10px",
                        fontWeight: 750,
                        padding: "5px 2px",
                      }}
                    >
                      {isMarkingAllRead
                        ? "Updating..."
                        : "Mark all read"}
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: "430px",
                      overflowY: "auto",
                    }}
                  >
                    {isNotificationLoading ? (
                      <div
                        style={{
                          padding:
                            "34px 20px",
                          textAlign: "center",
                          color:
                            isDarkMode
                              ? "#94a3b8"
                              : "#64748b",
                          fontSize: "11px",
                        }}
                      >
                        Loading notifications...
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div
                        style={{
                          padding:
                            "38px 20px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "26px",
                            marginBottom: "9px",
                            opacity: 0.7,
                          }}
                        >
                          ✓
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 750,
                            color:
                              isDarkMode
                                ? "#e2e8f0"
                                : "#334155",
                          }}
                        >
                          You're all caught up
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "10px",
                            color:
                              isDarkMode
                                ? "#64748b"
                                : "#94a3b8",
                          }}
                        >
                          No notifications to show.
                        </div>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() => {
                              void handleNotificationClick(
                                notification,
                              )
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems:
                                "flex-start",
                              gap: "10px",
                              padding:
                                "12px 14px",
                              border: "none",
                              borderBottom:
                                isDarkMode
                                  ? "1px solid rgba(148,163,184,0.08)"
                                  : "1px solid #f1f5f9",
                              background:
                                notification.is_read
                                  ? "transparent"
                                  : isDarkMode
                                    ? "rgba(249,115,22,0.07)"
                                    : "#fff7ed",
                              color:
                                "inherit",
                              cursor:
                                "pointer",
                              textAlign:
                                "left",
                              boxSizing:
                                "border-box",
                            }}
                          >
                            <span
                              style={{
                                width: "31px",
                                height: "31px",
                                minWidth:
                                  "31px",
                                borderRadius:
                                  "9px",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  notification.is_read
                                    ? isDarkMode
                                      ? "rgba(148,163,184,0.1)"
                                      : "#f1f5f9"
                                    : "rgba(249,115,22,0.14)",
                                color:
                                  notification.is_read
                                    ? isDarkMode
                                      ? "#94a3b8"
                                      : "#64748b"
                                    : "#ea580c",
                                fontSize: "8px",
                                fontWeight: 850,
                              }}
                            >
                              {getNotificationShortCode(
                                notification.notification_type,
                              )}
                            </span>

                            <span
                              style={{
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth:
                                      0,
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                    whiteSpace:
                                      "nowrap",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      notification.is_read
                                        ? 650
                                        : 800,
                                    color:
                                      isDarkMode
                                        ? "#f1f5f9"
                                        : "#0f172a",
                                  }}
                                >
                                  {
                                    notification.title
                                  }
                                </span>

                                {!notification.is_read && (
                                  <span
                                    style={{
                                      width:
                                        "6px",
                                      height:
                                        "6px",
                                      minWidth:
                                        "6px",
                                      borderRadius:
                                        "50%",
                                      background:
                                        "#f97316",
                                    }}
                                  />
                                )}
                              </span>

                              <span
                                style={{
                                  marginTop: "4px",
                                  fontSize: "10px",
                                  lineHeight: 1.45,
                                  color: isDarkMode
                                    ? "#94a3b8"
                                    : "#64748b",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {
                                  notification.message
                                }
                              </span>

                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "5px",
                                  fontSize:
                                    "9px",
                                  color:
                                    isDarkMode
                                      ? "#64748b"
                                      : "#94a3b8",
                                }}
                              >
                                {formatNotificationTime(
                                  notification.created_at,
                                )}
                              </span>
                            </span>
                          </button>
                        ),
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              title={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 14px",
                border: isDarkMode
                  ? "1px solid rgba(249,115,22,0.9)"
                  : "1px solid #e2e8f0",
                borderRadius: "10px",
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(251,146,60,0.12))"
                  : "#ffffff",
                color: isDarkMode
                  ? "#fdba74"
                  : "#0f172a",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: isDarkMode
                  ? "0 10px 24px rgba(249,115,22,0.2)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
                transition:
                  "all 0.25s ease",
              }}
            >
              <span aria-hidden="true">
                {isDarkMode ? "☀" : "🌙"}
              </span>

              <span>
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </button>

            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background:
                  "var(--app-primary-soft)",
                border:
                  "1px solid var(--app-border)",
                color:
                  "var(--app-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {initials}
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color:
                    "var(--app-text)",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color:
                    "var(--app-text-muted)",
                }}
              >
                {currentRole}
              </div>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "24px",
            boxSizing: "border-box",
            overflowX: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout