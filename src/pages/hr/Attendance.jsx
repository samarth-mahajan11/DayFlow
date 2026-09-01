import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Attendance.css'

function Attendance() {
  const navigate = useNavigate()

  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate('/login')
      return
    }

    const { data, error: attendanceError } =
      await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })

    if (attendanceError) {
      console.error(
        'ATTENDANCE LOAD ERROR:',
        attendanceError
      )

      setError(attendanceError.message)
      setLoading(false)
      return
    }

    const employeeIds = [
      ...new Set(
        (data || []).map(
          (record) => record.employee_id
        )
      ),
    ]

    let profiles = []

    if (employeeIds.length > 0) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, employee_id, full_name, email'
        )
        .in('id', employeeIds)

      if (profileError) {
        console.error(
          'ATTENDANCE PROFILE ERROR:',
          profileError
        )

        setError(profileError.message)
        setLoading(false)
        return
      }

      profiles = profileData || []
    }

    const combinedData = (data || []).map(
      (record) => {
        const profile = profiles.find(
          (item) =>
            item.id === record.employee_id
        )

        return {
          ...record,
          profile,
        }
      }
    )

    setAttendance(combinedData)
    setLoading(false)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return '--'
    }

    return new Date(timestamp).toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  const calculateWorkHours = (
    checkIn,
    checkOut
  ) => {
    if (!checkIn || !checkOut) {
      return '--'
    }

    const start = new Date(checkIn)
    const end = new Date(checkOut)

    const difference = end - start

    if (difference <= 0) {
      return '--'
    }

    const totalMinutes = Math.floor(
      difference / (1000 * 60)
    )

    const hours = Math.floor(
      totalMinutes / 60
    )

    const minutes = totalMinutes % 60

    return `${hours}h ${minutes}m`
  }

  const getInitials = (name) => {
    if (!name) {
      return '?'
    }

    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const getStatusClass = (status) => {
    if (!status) {
      return 'attendance-status-default'
    }

    const normalized =
      status.toLowerCase()

    if (
      normalized.includes('present') ||
      normalized === 'p'
    ) {
      return 'attendance-status-present'
    }

    if (
      normalized.includes('absent') ||
      normalized === 'a'
    ) {
      return 'attendance-status-absent'
    }

    if (
      normalized.includes('leave')
    ) {
      return 'attendance-status-leave'
    }

    if (
      normalized.includes('late')
    ) {
      return 'attendance-status-late'
    }

    return 'attendance-status-default'
  }

  const presentCount =
    attendance.filter((record) => {
      const status =
        record.status?.toLowerCase()

      return (
        status === 'present' ||
        status === 'p'
      )
    }).length

  const completedCount =
    attendance.filter(
      (record) =>
        record.check_in &&
        record.check_out
    ).length

  const pendingCount =
    attendance.filter(
      (record) =>
        record.check_in &&
        !record.check_out
    ).length

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-shell">
          <div className="attendance-loading">
            <div className="attendance-loading-mark">
              ✓
            </div>

            <div>
              <strong>
                Loading attendance
              </strong>

              <span>
                Fetching workforce attendance records...
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
              WORKFORCE MANAGEMENT
            </span>

            <h1>DayFlow</h1>

            <p>
              Monitor employee attendance and
              working hours.
            </p>
          </div>

          <button
            type="button"
            className="attendance-back-button"
            onClick={() =>
              navigate('/hr/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}

        <section className="attendance-intro">
          <div>
            <span className="attendance-section-label">
              TIME & ATTENDANCE
            </span>

            <h2>
              Employee Attendance
            </h2>

            <p>
              Monitor attendance, check-in,
              check-out and working hours
              across the organization.
            </p>
          </div>

          <div className="attendance-count">
            <strong>
              {attendance.length}
            </strong>

            <span>
              Total Records
            </span>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="attendance-alert">
            <div className="attendance-alert-icon">
              !
            </div>

            <div>
              <strong>
                Unable to load attendance
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* SUMMARY */}

        <section className="attendance-summary-section">
          <div className="attendance-summary-grid">

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-summary-green">
                ✓
              </div>

              <div>
                <span>Present</span>

                <strong>
                  {presentCount}
                </strong>

                <small>
                  Present attendance records
                </small>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-summary-blue">
                ◷
              </div>

              <div>
                <span>Completed</span>

                <strong>
                  {completedCount}
                </strong>

                <small>
                  Check-in and check-out completed
                </small>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon attendance-summary-orange">
                !
              </div>

              <div>
                <span>Pending Checkout</span>

                <strong>
                  {pendingCount}
                </strong>

                <small>
                  Employees without check-out
                </small>
              </div>
            </div>

          </div>
        </section>

        {/* ATTENDANCE TABLE */}

        <section className="attendance-list-section">

          <div className="attendance-section-heading">
            <div>
              <span className="attendance-section-label">
                ATTENDANCE LOG
              </span>

              <h3>
                Workforce Attendance
              </h3>

              <p>
                Recent attendance records
                across all employees.
              </p>
            </div>

            <button
              type="button"
              className="attendance-refresh-button"
              onClick={loadAttendance}
            >
              ↻ Refresh
            </button>
          </div>

          {attendance.length === 0 ? (
            <div className="attendance-empty-state">
              <div className="attendance-empty-icon">
                ◷
              </div>

              <h4>
                No attendance records
              </h4>

              <p>
                Attendance records will appear
                here when employees check in.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>EMPLOYEE ID</th>
                    <th>DATE</th>
                    <th>CHECK IN</th>
                    <th>CHECK OUT</th>
                    <th>STATUS</th>
                    <th>WORK HOURS</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map(
                    (record) => (
                      <tr key={record.id}>

                        <td>
                          <div className="attendance-employee">
                            <div className="attendance-avatar">
                              {getInitials(
                                record.profile?.full_name
                              )}
                            </div>

                            <div>
                              <strong>
                                {record.profile?.full_name ||
                                  '--'}
                              </strong>

                              <span>
                                {record.profile?.email ||
                                  '--'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="attendance-id">
                            {record.profile?.employee_id ||
                              '--'}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-date">
                            {record.date || '--'}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-time">
                            {formatTime(
                              record.check_in
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-time">
                            {formatTime(
                              record.check_out
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`attendance-status ${getStatusClass(
                              record.status
                            )}`}
                          >
                            {record.status ||
                              '--'}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-hours">
                            {calculateWorkHours(
                              record.check_in,
                              record.check_out
                            )}
                          </span>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* FOOTER */}

        <footer className="attendance-footer">
          <span>
            DayFlow HR Attendance
          </span>

          
        </footer>

      </div>
    </div>
  )
}

export default Attendance