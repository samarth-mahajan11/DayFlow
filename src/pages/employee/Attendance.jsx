import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Attendance.css'

function getTodayDate() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getWeekStartDate() {
  const today = new Date()
  const day = today.getDay()
  const difference = day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(today.getDate() + difference)
  monday.setHours(0, 0, 0, 0)

  return monday
}

function getWeekDates() {
  const monday = getWeekStartDate()
  const dates = []

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday)

    date.setDate(monday.getDate() + index)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    dates.push({
      date: `${year}-${month}-${day}`,
      dayName: date.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      fullDayName: date.toLocaleDateString('en-US', {
        weekday: 'long',
      }),
      dayNumber: date.getDate(),
    })
  }

  return dates
}

function formatDate(dateString) {
  if (!dateString) {
    return '--'
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

function formatTime(timestamp) {
  if (!timestamp) {
    return '--'
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLongDate(dateString) {
  if (!dateString) {
    return ''
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
}

function calculateWorkMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return null
  }

  const start = new Date(checkIn)
  const end = new Date(checkOut)

  const difference = end - start

  if (difference <= 0) {
    return null
  }

  return Math.floor(difference / (1000 * 60))
}

function calculateWorkHours(checkIn, checkOut) {
  const totalMinutes = calculateWorkMinutes(
    checkIn,
    checkOut
  )

  if (totalMinutes === null) {
    return '--'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${minutes}m`
}

function getStatusClass(status) {
  if (status === 'Present') {
    return 'attendance-status-present'
  }

  if (status === 'Absent') {
    return 'attendance-status-absent'
  }

  if (status === 'Half Day') {
    return 'attendance-status-half'
  }

  if (status === 'Leave') {
    return 'attendance-status-leave'
  }

  return 'attendance-status-neutral'
}

function getStatusIcon(status) {
  if (status === 'Present') {
    return '✓'
  }

  if (status === 'Absent') {
    return '×'
  }

  if (status === 'Half Day') {
    return '½'
  }

  if (status === 'Leave') {
    return 'L'
  }

  return '—'
}

function Attendance() {
  const navigate = useNavigate()

  const [todayAttendance, setTodayAttendance] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])

  const [viewMode, setViewMode] = useState('daily')

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [currentTime, setCurrentTime] = useState(
    new Date()
  )

  useEffect(() => {
    loadAttendance()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const loadAttendance = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You are not logged in.')
      setLoading(false)
      return
    }

    const today = getTodayDate()

    const {
      data: todayData,
      error: todayError,
    } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (todayError) {
      console.error(
        'TODAY ATTENDANCE ERROR:',
        todayError
      )

      setError(todayError.message)
      setLoading(false)
      return
    }

    setTodayAttendance(todayData)

    const {
      data: historyData,
      error: historyError,
    } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .order('date', {
        ascending: false,
      })
      .limit(30)

    if (historyError) {
      console.error(
        'ATTENDANCE HISTORY ERROR:',
        historyError
      )

      setError(historyError.message)
      setLoading(false)
      return
    }

    setAttendanceHistory(historyData || [])
    setLoading(false)
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    setError('')
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You are not logged in.')
      setActionLoading(false)
      return
    }

    const today = getTodayDate()

    const {
      data: existingAttendance,
      error: existingError,
    } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (existingError) {
      console.error(
        'EXISTING ATTENDANCE ERROR:',
        existingError
      )

      setError(existingError.message)
      setActionLoading(false)
      return
    }

    if (existingAttendance) {
      setTodayAttendance(existingAttendance)

      if (existingAttendance.check_in) {
        setError('You have already checked in today.')
      } else {
        setError(
          'An attendance record already exists for today.'
        )
      }

      setActionLoading(false)
      return
    }

    const now = new Date().toISOString()

    const {
      data,
      error,
    } = await supabase
      .from('attendance')
      .insert({
        employee_id: user.id,
        date: today,
        check_in: now,
        status: 'Present',
      })
      .select()
      .single()

    if (error) {
      console.error('CHECK IN ERROR:', error)
      setError(error.message)
      setActionLoading(false)
      return
    }

    setTodayAttendance(data)
    setMessage('You are checked in. Have a productive day.')

    await loadAttendance()

    setActionLoading(false)
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    setError('')
    setMessage('')

    if (!todayAttendance) {
      setError('Please check in before checking out.')
      setActionLoading(false)
      return
    }

    if (!todayAttendance.check_in) {
      setError('Check-in time is missing.')
      setActionLoading(false)
      return
    }

    if (todayAttendance.check_out) {
      setError('You have already checked out today.')
      setActionLoading(false)
      return
    }

    const now = new Date().toISOString()

    const {
      data,
      error,
    } = await supabase
      .from('attendance')
      .update({
        check_out: now,
      })
      .eq('id', todayAttendance.id)
      .eq('employee_id', todayAttendance.employee_id)
      .select()
      .single()

    if (error) {
      console.error('CHECK OUT ERROR:', error)
      setError(error.message)
      setActionLoading(false)
      return
    }

    setTodayAttendance(data)
    setMessage(
      'Check-out completed. Your attendance has been recorded.'
    )

    await loadAttendance()

    setActionLoading(false)
  }

  const weeklyAttendance = useMemo(() => {
    const weekStart = getWeekStartDate()

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return attendanceHistory.filter((record) => {
      const recordDate = new Date(
        `${record.date}T00:00:00`
      )

      return (
        recordDate >= weekStart &&
        recordDate <= weekEnd
      )
    })
  }, [attendanceHistory])

  const weeklyStats = useMemo(() => {
    return {
      present: weeklyAttendance.filter(
        (record) => record.status === 'Present'
      ).length,

      absent: weeklyAttendance.filter(
        (record) => record.status === 'Absent'
      ).length,

      halfDay: weeklyAttendance.filter(
        (record) => record.status === 'Half Day'
      ).length,

      leave: weeklyAttendance.filter(
        (record) => record.status === 'Leave'
      ).length,
    }
  }, [weeklyAttendance])

  const weeklyWorkMinutes = useMemo(() => {
    return weeklyAttendance.reduce(
      (total, record) => {
        const minutes = calculateWorkMinutes(
          record.check_in,
          record.check_out
        )

        return total + (minutes || 0)
      },
      0
    )
  }, [weeklyAttendance])

  const weeklyWorkHours = Math.floor(
    weeklyWorkMinutes / 60
  )

  const weeklyWorkRemainingMinutes =
    weeklyWorkMinutes % 60

  const displayedAttendance =
    viewMode === 'weekly'
      ? weeklyAttendance
      : attendanceHistory

  const weekDates = getWeekDates()

  const today = getTodayDate()

  const todayStatus =
    todayAttendance?.status || 'Not marked'

  const todayWorkHours = calculateWorkHours(
    todayAttendance?.check_in,
    todayAttendance?.check_out
  )

  const hasCheckedIn =
    Boolean(todayAttendance?.check_in)

  const hasCheckedOut =
    Boolean(todayAttendance?.check_out)

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-shell">
          <div className="attendance-loading">
            <div className="attendance-loading-mark">
              D
            </div>

            <div>
              <strong>Loading your attendance</strong>
              <span>
                Preparing your workday overview...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="attendance-page">
      <div className="attendance-shell">

        {/* HEADER */}

        <header className="attendance-header">
          <div className="attendance-brand">
            <span className="attendance-eyebrow">
              EMPLOYEE PORTAL
            </span>

            <h1>DayFlow</h1>

            <p>
              Your workday, attendance and time at a glance.
            </p>
          </div>

          <div className="attendance-header-actions">
            <div className="attendance-live-clock">
              <span>LOCAL TIME</span>
              <strong>
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>

            <button
              type="button"
              className="attendance-back-button"
              onClick={() =>
                navigate('/employee/dashboard')
              }
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        {/* PAGE INTRO */}

        <section className="attendance-intro">
          <div>
            <span className="attendance-section-label">
              WORKDAY
            </span>

            <h2>Attendance</h2>

            <p>
              Keep your work hours accurate and stay on top
              of your attendance.
            </p>
          </div>

          <button
            type="button"
            className="attendance-refresh-button"
            onClick={loadAttendance}
            disabled={actionLoading}
          >
            ↻ Refresh
          </button>
        </section>

        {/* ALERTS */}

        {error && (
          <div className="attendance-alert attendance-alert-error">
            <span className="attendance-alert-icon">
              !
            </span>

            <div>
              <strong>Something needs your attention</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="attendance-alert attendance-alert-success">
            <span className="attendance-alert-icon">
              ✓
            </span>

            <div>
              <strong>Attendance updated</strong>
              <p>{message}</p>
            </div>

            <button
              type="button"
              onClick={() => setMessage('')}
            >
              ×
            </button>
          </div>
        )}

        {/* TODAY HERO */}

        <section className="attendance-today-card">

          <div className="attendance-today-main">
            <div className="attendance-today-heading">
              <div>
                <span className="attendance-section-label">
                  TODAY
                </span>

                <h3>{formatLongDate(today)}</h3>
              </div>

              <span
                className={`attendance-status-pill ${getStatusClass(
                  todayStatus
                )}`}
              >
                <span>
                  {getStatusIcon(todayStatus)}
                </span>

                {todayStatus}
              </span>
            </div>

            <div className="attendance-time-display">
              <div className="attendance-time-block">
                <span>CHECK IN</span>

                <strong>
                  {formatTime(
                    todayAttendance?.check_in
                  )}
                </strong>
              </div>

              <div className="attendance-time-divider">
                →
              </div>

              <div className="attendance-time-block">
                <span>CHECK OUT</span>

                <strong>
                  {formatTime(
                    todayAttendance?.check_out
                  )}
                </strong>
              </div>

              <div className="attendance-time-block attendance-work-block">
                <span>WORK HOURS</span>

                <strong>{todayWorkHours}</strong>
              </div>
            </div>
          </div>

          <div className="attendance-action-panel">
            {!hasCheckedIn ? (
              <>
                <div className="attendance-action-icon">
                  ▶
                </div>

                <h4>Start your workday</h4>

                <p>
                  Check in when you begin working.
                </p>

                <button
                  type="button"
                  className="attendance-primary-action"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? 'Checking in...'
                    : 'Check In'}
                </button>
              </>
            ) : !hasCheckedOut ? (
              <>
                <div className="attendance-action-icon attendance-action-active">
                  ●
                </div>

                <h4>You're currently working</h4>

                <p>
                  Your workday is in progress.
                </p>

                <button
                  type="button"
                  className="attendance-checkout-action"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? 'Checking out...'
                    : 'Check Out'}
                </button>
              </>
            ) : (
              <>
                <div className="attendance-action-icon attendance-action-complete">
                  ✓
                </div>

                <h4>Workday completed</h4>

                <p>
                  Your attendance for today is complete.
                </p>

                <button
                  type="button"
                  className="attendance-completed-button"
                  disabled
                >
                  Checked Out
                </button>
              </>
            )}
          </div>

        </section>

        {/* WEEKLY SUMMARY */}

        <section className="attendance-section">
          <div className="attendance-section-heading">
            <div>
              <span className="attendance-section-label">
                THIS WEEK
              </span>

              <h3>Attendance summary</h3>
            </div>

            <span className="attendance-week-range">
              {formatDate(weekDates[0].date)}
              {' — '}
              {formatDate(weekDates[6].date)}
            </span>
          </div>

          <div className="attendance-summary-grid">

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-icon-green">
                ✓
              </div>

              <div>
                <span>Present</span>
                <strong>{weeklyStats.present}</strong>
                <small>Days this week</small>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-icon-red">
                ×
              </div>

              <div>
                <span>Absent</span>
                <strong>{weeklyStats.absent}</strong>
                <small>Days this week</small>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-icon-orange">
                ½
              </div>

              <div>
                <span>Half Day</span>
                <strong>{weeklyStats.halfDay}</strong>
                <small>Days this week</small>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-icon-purple">
                L
              </div>

              <div>
                <span>Leave</span>
                <strong>{weeklyStats.leave}</strong>
                <small>Days this week</small>
              </div>
            </div>

            <div className="attendance-summary-card attendance-hours-card">
              <div className="attendance-summary-icon attendance-icon-blue">
                ◷
              </div>

              <div>
                <span>Work Hours</span>

                <strong>
                  {weeklyWorkHours}h{' '}
                  {weeklyWorkRemainingMinutes}m
                </strong>

                <small>
                  Recorded this week
                </small>
              </div>
            </div>

          </div>
        </section>

        {/* WEEK STRIP */}

        <section className="attendance-section">
          <div className="attendance-section-heading">
            <div>
              <span className="attendance-section-label">
                WORKWEEK
              </span>

              <h3>Your week</h3>
            </div>
          </div>

          <div className="attendance-week-strip">
            {weekDates.map((day) => {
              const record =
                attendanceHistory.find(
                  (item) =>
                    item.date === day.date
                )

              const isToday =
                day.date === today

              return (
                <div
                  key={day.date}
                  className={`attendance-day-card ${
                    isToday
                      ? 'attendance-day-today'
                      : ''
                  }`}
                >
                  <span className="attendance-day-name">
                    {day.dayName}
                  </span>

                  <strong>
                    {day.dayNumber}
                  </strong>

                  <span
                    className={`attendance-day-dot ${
                      record
                        ? getStatusClass(
                            record.status
                          )
                        : 'attendance-day-empty'
                    }`}
                  >
                    {record
                      ? getStatusIcon(record.status)
                      : '—'}
                  </span>

                  <small>
                    {record
                      ? record.status
                      : 'Not marked'}
                  </small>
                </div>
              )
            })}
          </div>
        </section>

        {/* ATTENDANCE HISTORY */}

        <section className="attendance-section attendance-history-section">

          <div className="attendance-section-heading attendance-history-heading">
            <div>
              <span className="attendance-section-label">
                HISTORY
              </span>

              <h3>Attendance records</h3>

              <p>
                Review your recent attendance and recorded
                work hours.
              </p>
            </div>

            <div className="attendance-view-switcher">
              <button
                type="button"
                className={
                  viewMode === 'daily'
                    ? 'attendance-view-active'
                    : ''
                }
                onClick={() =>
                  setViewMode('daily')
                }
              >
                Recent
              </button>

              <button
                type="button"
                className={
                  viewMode === 'weekly'
                    ? 'attendance-view-active'
                    : ''
                }
                onClick={() =>
                  setViewMode('weekly')
                }
              >
                This Week
              </button>
            </div>
          </div>

          {displayedAttendance.length === 0 ? (
            <div className="attendance-empty-state">
              <div>◷</div>

              <h4>No attendance records yet</h4>

              <p>
                Your attendance history will appear here
                after you check in.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Work Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedAttendance.map(
                    (record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="attendance-date-cell">
                            <strong>
                              {formatDate(
                                record.date
                              )}
                            </strong>

                            {record.date === today && (
                              <span>
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="attendance-time-cell">
                            {formatTime(
                              record.check_in
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-time-cell">
                            {formatTime(
                              record.check_out
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`attendance-table-status ${getStatusClass(
                              record.status
                            )}`}
                          >
                            <span>
                              {getStatusIcon(
                                record.status
                              )}
                            </span>

                            {record.status ||
                              'Not marked'}
                          </span>
                        </td>

                        <td>
                          <strong className="attendance-hours-cell">
                            {calculateWorkHours(
                              record.check_in,
                              record.check_out
                            )}
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="attendance-history-footer">
            <span>
              Showing{' '}
              <strong>
                {displayedAttendance.length}
              </strong>{' '}
              record
              {displayedAttendance.length === 1
                ? ''
                : 's'}
            </span>

           
          </div>

        </section>

        {/* FOOTER */}

        <footer className="attendance-footer">
          <span>
            DayFlow Employee Portal
          </span>

          
        </footer>

      </div>
    </div>
  )
}

export default Attendance