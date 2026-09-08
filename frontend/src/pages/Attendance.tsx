import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react"
import { useNavigate } from "react-router-dom"

import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  punchInAttendance,
  punchOutAttendance,
  updateAttendance,
  type Attendance as AttendanceRecord,
  type AttendancePayload,
} from "../api/attendance"

import {
  getEmployees,
  type Employee,
} from "../api/employees"

import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

const emptyForm: AttendancePayload = {
  employee: 0,
  date: "",
  check_in: "",
  check_out: "",
  status: "present",
  remarks: "",
}

const attendanceStatuses = [
  {
    value: "present",
    label: "Present",
  },
  {
    value: "absent",
    label: "Absent",
  },
  {
    value: "late",
    label: "Late",
  },
  {
    value: "half_day",
    label: "Half Day",
  },
]

const formatStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )

function Attendance() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const [records, setRecords] =
    useState<AttendanceRecord[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [isDeleting, setIsDeleting] =
    useState<number | null>(null)

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

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState<AttendancePayload>({
      ...emptyForm,
    })

  const canManageAttendance =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR" ||
    user?.role === "MANAGER"

  const theme = {
    pageBackground: isDarkMode
      ? "#0f172a"
      : "#fffaf5",

    pageBackgroundStart: isDarkMode
      ? "#0f172a"
      : "#fffaf5",

    pageBackgroundEnd: isDarkMode
      ? "#111827"
      : "#eef2ff",

    cardBackground: isDarkMode
      ? "#111827"
      : "#ffffff",

    cardSecondary: isDarkMode
      ? "#1f2937"
      : "#f8fafc",

    inputBackground: isDarkMode
      ? "#1f2937"
      : "#ffffff",

    inputDisabled: isDarkMode
      ? "#111827"
      : "#f1f5f9",

    text: isDarkMode
      ? "#f9fafb"
      : "#0f172a",

    secondaryText: isDarkMode
      ? "#d1d5db"
      : "#334155",

    mutedText: isDarkMode
      ? "#9ca3af"
      : "#64748b",

    subtleText: isDarkMode
      ? "#6b7280"
      : "#94a3b8",

    border: isDarkMode
      ? "#374151"
      : "#e2e8f0",

    inputBorder: isDarkMode
      ? "#4b5563"
      : "#cbd5e1",

    rowBorder: isDarkMode
      ? "#263244"
      : "#f1f5f9",

    headerBackground: isDarkMode
      ? "#1f2937"
      : "#f8fafc",

    orangeSoft: isDarkMode
      ? "#431407"
      : "#fff7ed",

    orangeLight: isDarkMode
      ? "#7c2d12"
      : "#ffedd5",

    orangeText: isDarkMode
      ? "#fdba74"
      : "#c2410c",

    orangePrimary: "#f97316",

    blueSoft: isDarkMode
      ? "#172554"
      : "#eff6ff",

    blueBorder: isDarkMode
      ? "#1e40af"
      : "#bfdbfe",

    blueText: isDarkMode
      ? "#93c5fd"
      : "#1d4ed8",

    errorBackground: isDarkMode
      ? "#450a0a"
      : "#fff1f2",

    errorBorder: isDarkMode
      ? "#7f1d1d"
      : "#fecaca",

    errorText: isDarkMode
      ? "#fca5a5"
      : "#991b1b",

    successBackground: isDarkMode
      ? "#052e16"
      : "#f0fdf4",

    successBorder: isDarkMode
      ? "#166534"
      : "#bbf7d0",

    successText: isDarkMode
      ? "#86efac"
      : "#166534",

    disabledBackground: isDarkMode
      ? "#374151"
      : "#cbd5e1",

    disabledText: isDarkMode
      ? "#9ca3af"
      : "#94a3b8",

    white: "#ffffff",
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    border:
      `1px solid ${theme.inputBorder}`,
    borderRadius: "9px",
    backgroundColor:
      theme.inputBackground,
    color: theme.text,
    outline: "none",
    boxSizing: "border-box",
  }

  useEffect(() => {
    if (!user) {
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const attendanceResponse =
          await getAttendance()

        const attendanceData =
          Array.isArray(attendanceResponse)
            ? attendanceResponse
            : attendanceResponse.results

        setRecords(attendanceData)

        if (canManageAttendance) {
          const employeesResponse =
            await getEmployees()

          const employeeData =
            Array.isArray(employeesResponse)
              ? employeesResponse
              : employeesResponse.results

          setEmployees(employeeData)
        } else {
          setEmployees([])
        }
      } catch (loadError) {
        console.error(
          "Attendance loading error:",
          loadError,
        )

        setError(
          "Unable to load attendance records.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [user, canManageAttendance])

  const summary = useMemo(() => {
    const present = records.filter(
      (record) => record.status === "present",
    ).length

    const late = records.filter(
      (record) => record.status === "late",
    ).length

    const absent = records.filter(
      (record) => record.status === "absent",
    ).length

    const halfDay = records.filter(
      (record) => record.status === "half_day",
    ).length

    return {
      total: records.length,
      present,
      late,
      absent,
      halfDay,
    }
  }, [records])

  const todayAttendance = useMemo(() => {
    const today =
      new Date()
        .toISOString()
        .split("T")[0]

    return records.find(
      (record) => record.date === today,
    ) ?? null
  }, [records])

  const hasPunchedIn =
    Boolean(
      todayAttendance?.check_in,
    )

  const hasPunchedOut =
    Boolean(
      todayAttendance?.check_out,
    )

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]:
        name === "employee"
          ? Number(value)
          : value,
    }))
  }

  const handleSelfieChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null

    setSelfieFile(file)
    setError(null)
    setSuccess(null)
  }

  const resetForm = () => {
    setForm({
      ...emptyForm,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleAddClick = () => {
    setError(null)
    setSuccess(null)

    setForm({
      ...emptyForm,
    })

    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (
    record: AttendanceRecord,
  ) => {
    setError(null)
    setSuccess(null)

    setEditingId(record.id)

    setForm({
      employee: record.employee,
      date: record.date,
      check_in: record.check_in ?? "",
      check_out: record.check_out ?? "",
      status: record.status,
      remarks: record.remarks ?? "",
    })

    setShowForm(true)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!form.employee) {
      setError(
        "Please select an employee.",
      )
      return
    }

    if (!form.date) {
      setError(
        "Please select an attendance date.",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const payload: AttendancePayload = {
        employee: form.employee,
        date: form.date,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        status: form.status,
        remarks:
          form.remarks?.trim() ?? "",
      }

      if (editingId !== null) {
        const updated =
          await updateAttendance(
            editingId,
            payload,
          )

        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? updated
              : record,
          ),
        )

        setSuccess(
          "Attendance record updated successfully.",
        )
      } else {
        const created =
          await createAttendance(payload)

        setRecords((current) => [
          created,
          ...current,
        ])

        setSuccess(
          "Attendance record created successfully.",
        )
      }

      resetForm()
    } catch (submitError) {
      console.error(
        "Attendance submission error:",
        submitError,
      )

      setError(
        editingId !== null
          ? "Unable to update attendance record."
          : "Unable to create attendance record.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (
    id: number,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this attendance record?",
      )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(id)
      setError(null)
      setSuccess(null)

      await deleteAttendance(id)

      setRecords((current) =>
        current.filter(
          (record) => record.id !== id,
        ),
      )

      if (editingId === id) {
        resetForm()
      }

      setSuccess(
        "Attendance record deleted successfully.",
      )
    } catch (deleteError) {
      console.error(
        "Attendance delete error:",
        deleteError,
      )

      setError(
        "Unable to delete attendance record.",
      )
    } finally {
      setIsDeleting(null)
    }
  }

  const handlePunchIn = async () => {
    setError(null)
    setSuccess(null)

    if (!selfieFile) {
      setError(
        "Please capture or select a selfie before punching in.",
      )
      return
    }

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser.",
      )
      return
    }

    try {
      setIsPunchingIn(true)

      const position =
        await new Promise<GeolocationPosition>(
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

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError(
          "Invalid GPS latitude received. Please try again.",
        )
        return
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError(
          "Invalid GPS longitude received. Please try again.",
        )
        return
      }

      const response =
        await punchInAttendance({
          latitude,
          longitude,
          accuracy,
          selfie: selfieFile,
        })

      setRecords((current) => [
        response.attendance,
        ...current.filter(
          (record) =>
            record.id !==
            response.attendance.id,
        ),
      ])

      setSelfieFile(null)

      setSuccess(
        response.message ||
          "Punch-in successful.",
      )
    } catch (punchError) {
      console.error(
        "Attendance punch-in error:",
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
            status?: number
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

        const validationMessages =
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

        if (
          validationMessages.length > 0
        ) {
          setError(
            validationMessages.join(
              " | ",
            ),
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

    if (!selfieFile) {
      setError(
        "Please capture or select a selfie before punching out.",
      )
      return
    }

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser.",
      )
      return
    }

    try {
      setIsPunchingOut(true)

      const position =
        await new Promise<GeolocationPosition>(
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

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError(
          "Invalid GPS latitude received. Please try again.",
        )
        return
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError(
          "Invalid GPS longitude received. Please try again.",
        )
        return
      }

      const response =
        await punchOutAttendance({
          latitude,
          longitude,
          accuracy,
          selfie: selfieFile,
        })

      setRecords((current) => [
        response.attendance,
        ...current.filter(
          (record) =>
            record.id !==
            response.attendance.id,
        ),
      ])

      setSelfieFile(null)

      setSuccess(
        response.message ||
          "Punch-out successful.",
      )
    } catch (punchError) {
      console.error(
        "Attendance punch-out error:",
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
            status?: number
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

        const validationMessages =
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

        if (
          validationMessages.length > 0
        ) {
          setError(
            validationMessages.join(
              " | ",
            ),
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

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            `linear-gradient(135deg, ${theme.pageBackgroundStart} 0%, ${isDarkMode ? "#111827" : "#f8fafc"} 50%, ${theme.pageBackgroundEnd} 100%)`,
          color: theme.text,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border:
                `4px solid ${isDarkMode ? "#7c2d12" : "#fed7aa"}`,
              borderTopColor:
                theme.orangePrimary,
              animation:
                "attendanceSpin 0.8s linear infinite",
            }}
          />

          <p
            style={{
              margin: 0,
              color: theme.mutedText,
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Loading attendance...
          </p>
        </div>

        <style>
          {`
            @keyframes attendanceSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px",
        background:
          `linear-gradient(135deg, ${theme.pageBackgroundStart} 0%, ${isDarkMode ? "#111827" : "#f8fafc"} 48%, ${theme.pageBackgroundEnd} 100%)`,
        color: theme.text,
        transition:
          "background 0.2s ease, color 0.2s ease",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {/* PAGE HEADER */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                borderRadius: "999px",
                backgroundColor:
                  theme.orangeSoft,
                color: theme.orangeText,
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor:
                    theme.orangePrimary,
                }}
              />
              HRMS · ATTENDANCE
            </div>

            <h1
              style={{
                margin: 0,
                color: theme.text,
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.8px",
              }}
            >
              Attendance Management
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: theme.mutedText,
                fontSize: "15px",
              }}
            >
              {canManageAttendance
                ? "Monitor, manage and maintain employee attendance records."
                : "Track and review your attendance activity."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {user?.role === "EMPLOYEE" && (
              <>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    minHeight: "42px",
                    padding: "0 14px",
                    border:
                      `1px solid ${isDarkMode ? "#7c2d12" : "#fed7aa"}`,
                    borderRadius: "9px",
                    backgroundColor:
                      theme.cardBackground,
                    color: theme.orangeText,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow:
                      "0 1px 2px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={
                      handleSelfieChange
                    }
                    disabled={
                      isPunchingIn ||
                      isPunchingOut ||
                      !selfieFile ||
                      hasPunchedIn
                    }
                    style={{
                      display: "none",
                    }}
                  />

                  <span
                    style={{
                      fontSize: "17px",
                    }}
                  >
                    📷
                  </span>

                  {selfieFile
                    ? "Selfie Selected"
                    : "Take Selfie"}
                </label>

                <button
                  type="button"
                  onClick={() =>
                    void handlePunchIn()
                  }
                  disabled={
                    isPunchingIn ||
                    !selfieFile
                  }
                  style={{
                    minHeight: "42px",
                    padding: "0 17px",
                    border: "none",
                    borderRadius: "9px",
                    background:
                      isPunchingIn ||
                      isPunchingOut ||
                      !selfieFile ||
                      hasPunchedIn
                        ? theme.disabledBackground
                        : "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor:
                      isPunchingIn ||
                      isPunchingOut ||
                      !selfieFile ||
                      hasPunchedIn
                        ? "not-allowed"
                        : "pointer",
                    boxShadow:
                      isPunchingIn ||
                      !selfieFile
                        ? "none"
                        : "0 5px 14px rgba(234, 88, 12, 0.24)",
                  }}
                >
                  {isPunchingIn
                    ? "Punching In..."
                    : hasPunchedIn
                      ? "Punched In"
                      : "Punch In"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handlePunchOut()
                  }
                  disabled={
                    isPunchingOut ||
                    isPunchingIn ||
                    !selfieFile ||
                    !hasPunchedIn ||
                    hasPunchedOut
                  }
                  style={{
                    minHeight: "42px",
                    padding: "0 17px",
                    border:
                      `1px solid ${theme.inputBorder}`,
                    borderRadius: "9px",
                    backgroundColor:
                      isPunchingOut ||
                      isPunchingIn ||
                      !selfieFile ||
                      !hasPunchedIn ||
                      hasPunchedOut
                        ? theme.inputDisabled
                        : theme.cardBackground,
                    color:
                      isPunchingOut ||
                      isPunchingIn ||
                      !selfieFile ||
                      !hasPunchedIn ||
                      hasPunchedOut
                        ? theme.disabledText
                        : theme.secondaryText,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor:
                      isPunchingOut ||
                      isPunchingIn ||
                      !selfieFile ||
                      !hasPunchedIn ||
                      hasPunchedOut
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isPunchingOut
                    ? "Punching Out..."
                    : hasPunchedOut
                      ? "Punched Out"
                      : "Punch Out"}
                </button>
              </>
            )}

            {canManageAttendance && (
              <button
                type="button"
                onClick={
                  handleAddClick
                }
                style={{
                  minHeight: "42px",
                  padding: "0 17px",
                  border: "none",
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow:
                    "0 5px 14px rgba(234, 88, 12, 0.22)",
                }}
              >
                + Add Attendance
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              style={{
                minHeight: "42px",
                padding: "0 15px",
                border:
                  `1px solid ${theme.inputBorder}`,
                borderRadius: "9px",
                backgroundColor:
                  theme.cardBackground,
                color: theme.secondaryText,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {error && (
          <section
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              border:
                `1px solid ${theme.errorBorder}`,
              borderRadius: "10px",
              backgroundColor:
                theme.errorBackground,
              color: theme.errorText,
              boxShadow:
                "0 2px 8px rgba(127, 29, 29, 0.05)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
              }}
            >
              !
            </span>

            <div>
              <strong
                style={{
                  display: "block",
                  marginBottom: "2px",
                  fontSize: "13px",
                }}
              >
                Attention
              </strong>

              <span
                style={{
                  fontSize: "13px",
                }}
              >
                {error}
              </span>
            </div>
          </section>
        )}

        {success && (
          <section
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              border:
                `1px solid ${theme.successBorder}`,
              borderRadius: "10px",
              backgroundColor:
                theme.successBackground,
              color: theme.successText,
              boxShadow:
                "0 2px 8px rgba(22, 101, 52, 0.05)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
              }}
            >
              ✓
            </span>

            <div>
              <strong
                style={{
                  display: "block",
                  marginBottom: "2px",
                  fontSize: "13px",
                }}
              >
                Success
              </strong>

              <span
                style={{
                  fontSize: "13px",
                }}
              >
                {success}
              </span>
            </div>
          </section>
        )}

        {/* SUMMARY CARDS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          {[
            {
              label: "Total Records",
              value: summary.total,
              icon: "▦",
              background:
                isDarkMode
                  ? "#431407"
                  : "#fff7ed",
              iconBackground:
                isDarkMode
                  ? "#7c2d12"
                  : "#ffedd5",
              iconColor:
                isDarkMode
                  ? "#fdba74"
                  : "#ea580c",
            },
            {
              label: "Present",
              value: summary.present,
              icon: "✓",
              background:
                isDarkMode
                  ? "#052e16"
                  : "#f0fdf4",
              iconBackground:
                isDarkMode
                  ? "#14532d"
                  : "#dcfce7",
              iconColor:
                isDarkMode
                  ? "#86efac"
                  : "#16a34a",
            },
            {
              label: "Late",
              value: summary.late,
              icon: "◷",
              background:
                isDarkMode
                  ? "#451a03"
                  : "#fffbeb",
              iconBackground:
                isDarkMode
                  ? "#78350f"
                  : "#fef3c7",
              iconColor:
                isDarkMode
                  ? "#fcd34d"
                  : "#d97706",
            },
            {
              label: "Absent",
              value: summary.absent,
              icon: "×",
              background:
                isDarkMode
                  ? "#450a0a"
                  : "#fff1f2",
              iconBackground:
                isDarkMode
                  ? "#7f1d1d"
                  : "#ffe4e6",
              iconColor:
                isDarkMode
                  ? "#fca5a5"
                  : "#dc2626",
            },
            {
              label: "Half Day",
              value: summary.halfDay,
              icon: "◐",
              background:
                isDarkMode
                  ? "#172554"
                  : "#eff6ff",
              iconBackground:
                isDarkMode
                  ? "#1e3a8a"
                  : "#dbeafe",
              iconColor:
                isDarkMode
                  ? "#93c5fd"
                  : "#2563eb",
            },
          ].map((card) => (
            <article
              key={card.label}
              style={{
                padding: "18px",
                border:
                  `1px solid ${theme.border}`,
                borderRadius: "14px",
                backgroundColor:
                  card.background,
                boxShadow:
                  "0 4px 14px rgba(15, 23, 42, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "14px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    color: theme.mutedText,
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                  }}
                >
                  {card.label}
                </p>

                <strong
                  style={{
                    color: theme.text,
                    fontSize: "26px",
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </strong>
              </div>

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  borderRadius: "12px",
                  backgroundColor:
                    card.iconBackground,
                  color: card.iconColor,
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                {card.icon}
              </div>
            </article>
          ))}
        </section>

        {/* EMPLOYEE PUNCH CARD */}
        {user?.role === "EMPLOYEE" && (
          <section
            style={{
              marginBottom: "22px",
              borderRadius: "16px",
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #172554 0%, #1e3a8a 55%, #c2410c 150%)",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.14)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "24px",
                padding: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  maxWidth: "650px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "8px",
                    color: "#fed7aa",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing:
                      "0.08em",
                  }}
                >
                  QUICK ATTENDANCE
                </span>

                <h2
                  style={{
                    margin:
                      "0 0 8px",
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: 800,
                  }}
                >
                  Start your workday
                  securely
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#cbd5e1",
                    fontSize: "13px",
                    lineHeight: 1.7,
                  }}
                >
                  Capture your selfie and
                  allow location access to
                  record a verified punch-in.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  border:
                    "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "12px",
                  backgroundColor:
                    "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      "#fb923c",
                    boxShadow:
                      "0 0 0 4px rgba(251,146,60,0.16)",
                  }}
                />

                GPS + Selfie Verification
              </div>
            </div>
          </section>
        )}

        {/* FORM */}
        {showForm &&
          canManageAttendance && (
            <section
              style={{
                marginBottom: "22px",
                border:
                  `1px solid ${theme.border}`,
                borderRadius: "16px",
                backgroundColor:
                  theme.cardBackground,
                boxShadow:
                  "0 6px 20px rgba(15, 23, 42, 0.07)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                  padding: "20px 22px",
                  borderBottom:
                    `1px solid ${theme.rowBorder}`,
                  background:
                    isDarkMode
                      ? "#1f2937"
                      : "linear-gradient(90deg, #fff7ed, #ffffff)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      margin:
                        "0 0 4px",
                      color:
                        theme.orangeText,
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    ATTENDANCE ENTRY
                  </p>

                  <h2
                    style={{
                      margin: 0,
                      color: theme.text,
                      fontSize: "20px",
                    }}
                  >
                    {editingId !== null
                      ? "Edit Attendance"
                      : "Add Attendance"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding:
                      "8px 13px",
                    border:
                      `1px solid ${theme.inputBorder}`,
                    borderRadius: "8px",
                    backgroundColor:
                      theme.cardBackground,
                    color:
                      theme.secondaryText,
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  padding: "22px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {[
                    {
                      label: "Employee",
                      name: "employee",
                      content: (
                        <select
                          name="employee"
                          value={
                            form.employee ||
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          required
                          style={
                            inputStyle
                          }
                        >
                          <option value="">
                            Select employee
                          </option>

                          {employees.map(
                            (employee) => (
                              <option
                                key={
                                  employee.id
                                }
                                value={
                                  employee.id
                                }
                              >
                                {
                                  employee.employee_id
                                }
                                {" — "}
                                {employee.full_name ||
                                  "Employee"}
                              </option>
                            ),
                          )}
                        </select>
                      ),
                    },
                    {
                      label: "Date",
                      name: "date",
                      content: (
                        <input
                          type="date"
                          name="date"
                          value={
                            form.date
                          }
                          onChange={
                            handleInputChange
                          }
                          required
                          style={
                            inputStyle
                          }
                        />
                      ),
                    },
                    {
                      label: "Check In",
                      name: "check_in",
                      content: (
                        <input
                          type="time"
                          name="check_in"
                          value={
                            form.check_in ??
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          disabled={
                            form.status ===
                            "absent"
                          }
                          style={{
                            ...inputStyle,
                            backgroundColor:
                              form.status ===
                              "absent"
                                ? theme.inputDisabled
                                : theme.inputBackground,
                          }}
                        />
                      ),
                    },
                    {
                      label: "Check Out",
                      name: "check_out",
                      content: (
                        <input
                          type="time"
                          name="check_out"
                          value={
                            form.check_out ??
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          disabled={
                            form.status ===
                            "absent"
                          }
                          style={{
                            ...inputStyle,
                            backgroundColor:
                              form.status ===
                              "absent"
                                ? theme.inputDisabled
                                : theme.inputBackground,
                          }}
                        />
                      ),
                    },
                    {
                      label: "Status",
                      name: "status",
                      content: (
                        <select
                          name="status"
                          value={
                            form.status
                          }
                          onChange={
                            handleInputChange
                          }
                          required
                          style={
                            inputStyle
                          }
                        >
                          {attendanceStatuses.map(
                            (status) => (
                              <option
                                key={
                                  status.value
                                }
                                value={
                                  status.value
                                }
                              >
                                {
                                  status.label
                                }
                              </option>
                            ),
                          )}
                        </select>
                      ),
                    },
                  ].map((field) => (
                    <label
                      key={field.name}
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: "7px",
                        color:
                          theme.secondaryText,
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {field.label}
                      {field.content}
                    </label>
                  ))}

                  <label
                    style={{
                      display: "flex",
                      flexDirection:
                        "column",
                      gap: "7px",
                      color:
                        theme.secondaryText,
                      fontSize: "12px",
                      fontWeight: 700,
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    Remarks

                    <textarea
                      name="remarks"
                      value={
                        form.remarks ?? ""
                      }
                      onChange={
                        handleInputChange
                      }
                      rows={3}
                      placeholder="Add optional remarks..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        border:
                          `1px solid ${theme.inputBorder}`,
                        borderRadius: "9px",
                        resize: "vertical",
                        backgroundColor:
                          theme.inputBackground,
                        color:
                          theme.text,
                        outline: "none",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "22px",
                    paddingTop: "18px",
                    borderTop:
                      `1px solid ${theme.rowBorder}`,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    style={{
                      minHeight: "42px",
                      padding:
                        "0 18px",
                      border: "none",
                      borderRadius: "9px",
                      background:
                        isSubmitting
                          ? theme.disabledBackground
                          : "linear-gradient(135deg, #f97316, #ea580c)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor:
                        isSubmitting
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingId !==
                          null
                        ? "Update Attendance"
                        : "Save Attendance"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    disabled={
                      isSubmitting
                    }
                    style={{
                      minHeight: "42px",
                      padding:
                        "0 17px",
                      border:
                        `1px solid ${theme.inputBorder}`,
                      borderRadius: "9px",
                      backgroundColor:
                        theme.cardBackground,
                      color:
                        theme.secondaryText,
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor:
                        isSubmitting
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

        {/* RECORDS */}
        <section
          style={{
            border:
              `1px solid ${theme.border}`,
            borderRadius: "16px",
            backgroundColor:
              theme.cardBackground,
            boxShadow:
              "0 6px 20px rgba(15, 23, 42, 0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "16px",
              padding: "20px 22px",
              borderBottom:
                `1px solid ${theme.rowBorder}`,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: theme.text,
                  fontSize: "19px",
                  fontWeight: 800,
                }}
              >
                Attendance Records
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: theme.mutedText,
                  fontSize: "12px",
                }}
              >
                Employee attendance history
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding:
                  "7px 11px",
                borderRadius: "999px",
                backgroundColor:
                  theme.orangeSoft,
                color:
                  theme.orangeText,
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {records.length} Records
            </div>
          </div>

          {records.length === 0 ? (
            <div
              style={{
                padding: "70px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  margin:
                    "0 auto 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  borderRadius: "16px",
                  backgroundColor:
                    theme.orangeSoft,
                  color:
                    theme.orangePrimary,
                  fontSize: "27px",
                }}
              >
                ▦
              </div>

              <h3
                style={{
                  margin:
                    "0 0 6px",
                  color:
                    theme.secondaryText,
                  fontSize: "16px",
                }}
              >
                No attendance records
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    theme.subtleText,
                  fontSize: "13px",
                }}
              >
                Attendance records will
                appear here once available.
              </p>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth:
                    canManageAttendance
                      ? "1080px"
                      : "850px",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "ID",
                      "Employee",
                      "Employee ID",
                      "Date",
                      "Check In",
                      "Check Out",
                      "Status",
                      "Remarks",
                      ...(canManageAttendance
                        ? ["Actions"]
                        : []),
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "13px 15px",
                          textAlign:
                            "left",
                          borderBottom:
                            `1px solid ${theme.border}`,
                          backgroundColor:
                            theme.headerBackground,
                          color:
                            theme.mutedText,
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing:
                            "0.06em",
                          textTransform:
                            "uppercase",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.map(
                    (record) => (
                      <tr
                        key={record.id}
                        style={{
                          transition:
                            "background-color 140ms ease",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.mutedText,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          #{record.id}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "34px",
                                height:
                                  "34px",
                                flexShrink: 0,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                borderRadius:
                                  "10px",
                                background:
                                  isDarkMode
                                    ? "linear-gradient(135deg, #431407, #7c2d12)"
                                    : "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                color:
                                  theme.orangeText,
                                fontSize:
                                  "12px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {(
                                record.employee_name ||
                                "E"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <span
                              style={{
                                color:
                                  theme.text,
                                fontSize:
                                  "13px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {record.employee_name ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {record.employee_id ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                            fontSize: "13px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {record.date}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {record.check_in ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            color:
                              theme.secondaryText,
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {record.check_out ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "6px",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              backgroundColor:
                                record.status ===
                                "present"
                                  ? isDarkMode
                                    ? "#052e16"
                                    : "#ecfdf5"
                                  : record.status ===
                                      "absent"
                                    ? isDarkMode
                                      ? "#450a0a"
                                      : "#fef2f2"
                                    : record.status ===
                                        "late"
                                      ? isDarkMode
                                        ? "#451a03"
                                        : "#fffbeb"
                                      : isDarkMode
                                        ? "#172554"
                                        : "#eff6ff",
                              color:
                                record.status ===
                                "present"
                                  ? isDarkMode
                                    ? "#86efac"
                                    : "#047857"
                                  : record.status ===
                                      "absent"
                                    ? isDarkMode
                                      ? "#fca5a5"
                                      : "#b91c1c"
                                    : record.status ===
                                        "late"
                                      ? isDarkMode
                                        ? "#fcd34d"
                                        : "#b45309"
                                      : isDarkMode
                                        ? "#93c5fd"
                                        : "#1d4ed8",
                              fontSize:
                                "11px",
                              fontWeight:
                                800,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <span
                              style={{
                                width:
                                  "6px",
                                height:
                                  "6px",
                                borderRadius:
                                  "50%",
                                backgroundColor:
                                  "currentColor",
                              }}
                            />

                            {formatStatus(
                              record.status,
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              `1px solid ${theme.rowBorder}`,
                            maxWidth:
                              "260px",
                            color:
                              theme.mutedText,
                            fontSize: "12px",
                          }}
                        >
                          {record.remarks ||
                            "-"}
                        </td>

                        {canManageAttendance && (
                          <td
                            style={{
                              padding:
                                "14px 15px",
                              borderBottom:
                                `1px solid ${theme.rowBorder}`,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "7px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    record,
                                  )
                                }
                                style={{
                                  padding:
                                    "7px 11px",
                                  border:
                                    `1px solid ${theme.blueBorder}`,
                                  borderRadius:
                                    "7px",
                                  backgroundColor:
                                    theme.blueSoft,
                                  color:
                                    theme.blueText,
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  isDeleting ===
                                  record.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    record.id,
                                  )
                                }
                                style={{
                                  padding:
                                    "7px 11px",
                                  border:
                                    `1px solid ${theme.errorBorder}`,
                                  borderRadius:
                                    "7px",
                                  backgroundColor:
                                    isDeleting ===
                                    record.id
                                      ? theme.inputDisabled
                                      : theme.errorBackground,
                                  color:
                                    isDeleting ===
                                    record.id
                                      ? theme.disabledText
                                      : isDarkMode
                                        ? "#fca5a5"
                                        : "#dc2626",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                  cursor:
                                    isDeleting ===
                                    record.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {isDeleting ===
                                record.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <style>
        {`
          @media (max-width: 768px) {
            main {
              padding: 18px !important;
            }
          }

          @media (max-width: 480px) {
            main {
              padding: 12px !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Attendance