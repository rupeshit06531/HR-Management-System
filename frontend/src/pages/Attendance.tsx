import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
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

    return (
      records.find(
        (record) => record.date === today,
      ) ?? null
    )
  }, [records])

  const hasPunchedIn =
    Boolean(todayAttendance?.check_in)

  const hasPunchedOut =
    Boolean(todayAttendance?.check_out)

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
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#64748b",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid #fed7aa",
              borderTopColor: "#f97316",
              animation:
                "attendanceSpin 0.8s linear infinite",
            }}
          />
          Loading attendance...
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

  const summaryCards = [
    {
      label: "Total Records",
      value: summary.total,
      icon: "T",
      iconBackground: "#fff7ed",
      iconColor: "#ea580c",
    },
    {
      label: "Present",
      value: summary.present,
      icon: "P",
      iconBackground: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      label: "Late",
      value: summary.late,
      icon: "L",
      iconBackground: "#fffbeb",
      iconColor: "#d97706",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: "A",
      iconBackground: "#fff1f2",
      iconColor: "#dc2626",
    },
    {
      label: "Half Day",
      value: summary.halfDay,
      icon: "H",
      iconBackground: "#eff6ff",
      iconColor: "#2563eb",
    },
  ]

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "16px",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "0 0 14px",
            borderBottom:
              "1px solid #e2e8f0",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "5px",
                color: "#ea580c",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#f97316",
                }}
              />
              HRMS · ATTENDANCE
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "23px",
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: "-0.4px",
              }}
            >
              Attendance Management
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              {canManageAttendance
                ? "Monitor and manage employee attendance."
                : "Track and review your attendance activity."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              flexWrap: "wrap",
            }}
          >
            {user?.role === "EMPLOYEE" && (
              <>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "34px",
                    padding: "0 11px",
                    border:
                      "1px solid #fed7aa",
                    borderRadius: "7px",
                    backgroundColor: "#ffffff",
                    color: "#c2410c",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
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
                      isPunchingOut
                    }
                    style={{
                      display: "none",
                    }}
                  />
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
                    isPunchingOut ||
                    !selfieFile ||
                    hasPunchedIn
                  }
                  style={{
                    minHeight: "34px",
                    padding: "0 12px",
                    border: "none",
                    borderRadius: "7px",
                    background:
                      isPunchingIn ||
                      isPunchingOut ||
                      !selfieFile ||
                      hasPunchedIn
                        ? "#cbd5e1"
                        : "#ea580c",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor:
                      isPunchingIn ||
                      isPunchingOut ||
                      !selfieFile ||
                      hasPunchedIn
                        ? "not-allowed"
                        : "pointer",
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
                    minHeight: "34px",
                    padding: "0 12px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "7px",
                    backgroundColor:
                      isPunchingOut ||
                      isPunchingIn ||
                      !selfieFile ||
                      !hasPunchedIn ||
                      hasPunchedOut
                        ? "#f1f5f9"
                        : "#ffffff",
                    color:
                      isPunchingOut ||
                      isPunchingIn ||
                      !selfieFile ||
                      !hasPunchedIn ||
                      hasPunchedOut
                        ? "#94a3b8"
                        : "#334155",
                    fontSize: "11px",
                    fontWeight: 800,
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
                onClick={handleAddClick}
                style={{
                  minHeight: "34px",
                  padding: "0 12px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
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
                minHeight: "34px",
                padding: "0 11px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Dashboard
            </button>
          </div>
        </header>

        {(error || success) && (
          <section
            style={{
              marginTop: "10px",
              padding: "9px 12px",
              borderRadius: "7px",
              border: error
                ? "1px solid #fecaca"
                : "1px solid #bbf7d0",
              backgroundColor: error
                ? "#fff1f2"
                : "#f0fdf4",
              color: error
                ? "#991b1b"
                : "#166534",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {error || success}
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "9px",
            marginTop: "10px",
          }}
        >
          {summaryCards.map((card) => (
            <article
              key={card.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "9px",
                minHeight: "68px",
                padding: "10px 12px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "9px",
                backgroundColor: "#ffffff",
                boxShadow:
                  "0 2px 8px rgba(15, 23, 42, 0.035)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#64748b",
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {card.label}
                </p>

                <strong
                  style={{
                    color: "#0f172a",
                    fontSize: "21px",
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </strong>
              </div>

              <div
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  borderRadius: "8px",
                  backgroundColor:
                    card.iconBackground,
                  color: card.iconColor,
                  fontSize: "10px",
                  fontWeight: 900,
                }}
              >
                {card.icon}
              </div>
            </article>
          ))}
        </section>

        {user?.role === "EMPLOYEE" && (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "10px",
              padding: "13px 15px",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, #172554 0%, #1e3a8a 58%, #c2410c 150%)",
              boxShadow:
                "0 5px 18px rgba(15, 23, 42, 0.10)",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  marginBottom: "3px",
                  color: "#fed7aa",
                  fontSize: "9px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                QUICK ATTENDANCE
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                {hasPunchedOut
                  ? "Workday completed"
                  : hasPunchedIn
                    ? "Workday in progress"
                    : "Start your workday"}
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  color: "#cbd5e1",
                  fontSize: "10px",
                }}
              >
                Selfie + GPS verification
                required for secure attendance.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 9px",
                border:
                  "1px solid rgba(255,255,255,0.15)",
                borderRadius: "7px",
                backgroundColor:
                  "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#fb923c",
                }}
              />
              GPS + Selfie
            </div>
          </section>
        )}

        {showForm &&
          canManageAttendance && (
            <section
              style={{
                marginTop: "10px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                boxShadow:
                  "0 3px 12px rgba(15, 23, 42, 0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "11px 14px",
                  borderBottom:
                    "1px solid #eef2f7",
                  backgroundColor: "#fffaf5",
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: "2px",
                      color: "#ea580c",
                      fontSize: "9px",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                    }}
                  >
                    ATTENDANCE ENTRY
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: "15px",
                      fontWeight: 800,
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
                    minHeight: "28px",
                    padding: "0 9px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  padding: "13px 14px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    Employee

                    <select
                      name="employee"
                      value={
                        form.employee || ""
                      }
                      onChange={
                        handleInputChange
                      }
                      required
                      style={{
                        width: "100%",
                        height: "35px",
                        padding: "0 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        backgroundColor:
                          "#ffffff",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    >
                      <option value="">
                        Select employee
                      </option>

                      {employees.map(
                        (employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                          >
                            {employee.employee_id}
                            {" — "}
                            {employee.full_name ||
                              "Employee"}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    Date

                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={
                        handleInputChange
                      }
                      required
                      style={{
                        width: "100%",
                        height: "35px",
                        padding: "0 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        backgroundColor:
                          "#ffffff",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    Check In

                    <input
                      type="time"
                      name="check_in"
                      value={
                        form.check_in ?? ""
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={
                        form.status ===
                        "absent"
                      }
                      style={{
                        width: "100%",
                        height: "35px",
                        padding: "0 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        backgroundColor:
                          form.status ===
                          "absent"
                            ? "#f1f5f9"
                            : "#ffffff",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    Check Out

                    <input
                      type="time"
                      name="check_out"
                      value={
                        form.check_out ?? ""
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={
                        form.status ===
                        "absent"
                      }
                      style={{
                        width: "100%",
                        height: "35px",
                        padding: "0 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        backgroundColor:
                          form.status ===
                          "absent"
                            ? "#f1f5f9"
                            : "#ffffff",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    Status

                    <select
                      name="status"
                      value={form.status}
                      onChange={
                        handleInputChange
                      }
                      required
                      style={{
                        width: "100%",
                        height: "35px",
                        padding: "0 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        backgroundColor:
                          "#ffffff",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    >
                      {attendanceStatuses.map(
                        (status) => (
                          <option
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                      gridColumn: "1 / -1",
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
                      rows={2}
                      placeholder="Add optional remarks..."
                      style={{
                        width: "100%",
                        padding: "8px 9px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        resize: "vertical",
                        color: "#0f172a",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "7px",
                    marginTop: "11px",
                    paddingTop: "10px",
                    borderTop:
                      "1px solid #eef2f7",
                  }}
                >
                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    style={{
                      minHeight: "32px",
                      padding: "0 12px",
                      border: "none",
                      borderRadius: "6px",
                      background:
                        isSubmitting
                          ? "#cbd5e1"
                          : "#ea580c",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor:
                        isSubmitting
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Attendance"
                        : "Save Attendance"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={
                      isSubmitting
                    }
                    style={{
                      minHeight: "32px",
                      padding: "0 11px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius: "6px",
                      backgroundColor:
                        "#ffffff",
                      color: "#475569",
                      fontSize: "10px",
                      fontWeight: 800,
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

        <section
          style={{
            marginTop: "10px",
            border:
              "1px solid #e2e8f0",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            boxShadow:
              "0 3px 12px rgba(15, 23, 42, 0.045)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "11px 14px",
              borderBottom:
                "1px solid #eef2f7",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                Attendance Records
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  color: "#94a3b8",
                  fontSize: "10px",
                }}
              >
                Employee attendance history
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "24px",
                padding: "0 8px",
                borderRadius: "999px",
                backgroundColor: "#fff7ed",
                color: "#c2410c",
                fontSize: "9px",
                fontWeight: 900,
              }}
            >
              {records.length} Records
            </div>
          </div>

          {records.length === 0 ? (
            <div
              style={{
                padding: "42px 18px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  backgroundColor: "#fff7ed",
                  color: "#ea580c",
                  fontSize: "13px",
                  fontWeight: 900,
                }}
              >
                ATT
              </div>

              <h3
                style={{
                  margin: "0 0 4px",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                No attendance records
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "10px",
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
                      ? "1020px"
                      : "800px",
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
                            "9px 11px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #e2e8f0",
                          backgroundColor:
                            "#f8fafc",
                          color: "#64748b",
                          fontSize: "9px",
                          fontWeight: 900,
                          letterSpacing:
                            "0.05em",
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
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color: "#64748b",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          #{record.id}
                        </td>

                        <td
                          style={{
                            padding:
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "7px",
                            }}
                          >
                            <div
                              style={{
                                width: "27px",
                                height: "27px",
                                flexShrink: 0,
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                borderRadius:
                                  "7px",
                                background:
                                  "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                color: "#c2410c",
                                fontSize: "9px",
                                fontWeight: 900,
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
                                color: "#0f172a",
                                fontSize: "10px",
                                fontWeight: 800,
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
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color: "#475569",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {record.employee_id ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color: "#475569",
                            fontSize: "10px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {record.date}
                        </td>

                        <td
                          style={{
                            padding:
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color: "#475569",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {record.check_in ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color: "#475569",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {record.check_out ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding:
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "5px",
                              padding:
                                "4px 7px",
                              borderRadius:
                                "999px",
                              backgroundColor:
                                record.status ===
                                "present"
                                  ? "#ecfdf5"
                                  : record.status ===
                                      "absent"
                                    ? "#fef2f2"
                                    : record.status ===
                                        "late"
                                      ? "#fffbeb"
                                      : "#eff6ff",
                              color:
                                record.status ===
                                "present"
                                  ? "#047857"
                                  : record.status ===
                                      "absent"
                                    ? "#b91c1c"
                                    : record.status ===
                                        "late"
                                      ? "#b45309"
                                      : "#1d4ed8",
                              fontSize: "9px",
                              fontWeight: 900,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <span
                              style={{
                                width: "5px",
                                height: "5px",
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
                              "10px 11px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth: "220px",
                            color: "#64748b",
                            fontSize: "10px",
                          }}
                        >
                          {record.remarks ||
                            "-"}
                        </td>

                        {canManageAttendance && (
                          <td
                            style={{
                              padding:
                                "10px 11px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "5px",
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
                                  minHeight: "26px",
                                  padding:
                                    "0 8px",
                                  border:
                                    "1px solid #bfdbfe",
                                  borderRadius:
                                    "5px",
                                  backgroundColor:
                                    "#eff6ff",
                                  color:
                                    "#1d4ed8",
                                  fontSize:
                                    "9px",
                                  fontWeight: 900,
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
                                  minHeight: "26px",
                                  padding:
                                    "0 8px",
                                  border:
                                    "1px solid #fecaca",
                                  borderRadius:
                                    "5px",
                                  backgroundColor:
                                    isDeleting ===
                                    record.id
                                      ? "#f1f5f9"
                                      : "#fff1f2",
                                  color:
                                    isDeleting ===
                                    record.id
                                      ? "#94a3b8"
                                      : "#dc2626",
                                  fontSize:
                                    "9px",
                                  fontWeight: 900,
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
              padding: 12px !important;
            }
          }

          @media (max-width: 480px) {
            main {
              padding: 8px !important;
            }
          }
        `}
      </style>
    </main>
  )
}

export default Attendance