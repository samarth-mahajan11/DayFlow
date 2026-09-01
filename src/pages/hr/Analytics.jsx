import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Analytics.css'

function Analytics() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = useState([])
  const [attendance, setAttendance] = useState([])
  const [payroll, setPayroll] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
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

    const { data: hrProfile, error: hrError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (hrError) {
      setError(hrError.message)
      setLoading(false)
      return
    }

    if (hrProfile?.role !== 'hr') {
      setError('Access denied. HR access is required.')
      setLoading(false)
      return
    }

    const [
      { data: profileData, error: profileError },
      { data: attendanceData, error: attendanceError },
      { data: payrollData, error: payrollError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, employee_id, full_name, department, position, role'
        )
        .eq('role', 'employee'),

      supabase
        .from('attendance')
        .select(
          'id, employee_id, date, check_in, check_out, status'
        )
        .order('date', { ascending: false }),

      supabase
        .from('payroll')
        .select(
          'id, employee_id, basic_salary, allowances, deductions, net_salary, effective_from'
        )
        .order('effective_from', { ascending: false }),
    ])

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (attendanceError) {
      setError(attendanceError.message)
      setLoading(false)
      return
    }

    if (payrollError) {
      setError(payrollError.message)
      setLoading(false)
      return
    }

    setProfiles(profileData || [])
    setAttendance(attendanceData || [])
    setPayroll(payrollData || [])

    setLoading(false)
  }

  const getEmployee = (employeeId) => {
    return profiles.find(
      (profile) => profile.id === employeeId
    )
  }

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    )}`
  }

  const formatDate = (value) => {
    if (!value) {
      return '--'
    }

    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const totalEmployees = profiles.length

  const presentCount = attendance.filter(
    (record) => record.status === 'Present'
  ).length

  const absentCount = attendance.filter(
    (record) => record.status === 'Absent'
  ).length

  const leaveCount = attendance.filter(
    (record) => record.status === 'Leave'
  ).length

  const halfDayCount = attendance.filter(
    (record) => record.status === 'Half-day'
  ).length

  const attendanceRate =
    attendance.length > 0
      ? Math.round(
          (presentCount / attendance.length) * 100
        )
      : 0

  const totalPayroll = payroll.reduce(
    (total, record) =>
      total + Number(record.net_salary || 0),
    0
  )

  const averageSalary =
    payroll.length > 0
      ? totalPayroll / payroll.length
      : 0

  const departmentMap = {}

  profiles.forEach((employee) => {
    const department =
      employee.department || 'Unassigned'

    departmentMap[department] =
      (departmentMap[department] || 0) + 1
  })

  const departmentData = Object.entries(
    departmentMap
  ).sort((a, b) => b[1] - a[1])

  const maxDepartmentCount =
    departmentData.length > 0
      ? Math.max(
          ...departmentData.map(
            ([, count]) => count
          )
        )
      : 1

  const recentAttendance =
    attendance.slice(0, 6)

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="loading-icon">◌</div>
          <h2>Loading analytics</h2>
          <p>
            Preparing workforce and payroll insights...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <span className="eyebrow">
            WORKFORCE INSIGHTS
          </span>

          <h1>Analytics</h1>

          <p>
            Understand workforce, attendance and
            payroll trends.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate('/hr/dashboard')
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      {error && (
        <div className="analytics-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <main className="analytics-content">
        <section className="analytics-section">
          <div className="section-heading">
            <div>
              <span className="section-label">
                OVERVIEW
              </span>

              <h2>Workforce at a Glance</h2>

              <p>
                A quick overview of your
                organization.
              </p>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-icon blue">
                👥
              </div>

              <div>
                <span>Total Employees</span>
                <strong>{totalEmployees}</strong>
                <small>
                  Active employees
                </small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon green">
                ✓
              </div>

              <div>
                <span>Attendance Rate</span>
                <strong>
                  {attendanceRate}%
                </strong>
                <small>
                  Based on attendance records
                </small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon purple">
                ₹
              </div>

              <div>
                <span>Total Payroll</span>
                <strong>
                  {formatMoney(totalPayroll)}
                </strong>
                <small>
                  Current payroll records
                </small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon orange">
                ₹
              </div>

              <div>
                <span>Average Salary</span>
                <strong>
                  {formatMoney(averageSalary)}
                </strong>
                <small>
                  Average net salary
                </small>
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-two-column">
          <div className="analytics-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">
                  ATTENDANCE
                </span>

                <h2>Attendance Overview</h2>
              </div>
            </div>

            <div className="attendance-summary">
              <div className="attendance-row">
                <div className="attendance-label">
                  <span className="status-dot present" />
                  <span>Present</span>
                </div>

                <strong>{presentCount}</strong>
              </div>

              <div className="attendance-bar">
                <div
                  className="bar-fill present"
                  style={{
                    width: `${
                      attendance.length > 0
                        ? (presentCount /
                            attendance.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="attendance-row">
                <div className="attendance-label">
                  <span className="status-dot absent" />
                  <span>Absent</span>
                </div>

                <strong>{absentCount}</strong>
              </div>

              <div className="attendance-bar">
                <div
                  className="bar-fill absent"
                  style={{
                    width: `${
                      attendance.length > 0
                        ? (absentCount /
                            attendance.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="attendance-row">
                <div className="attendance-label">
                  <span className="status-dot leave" />
                  <span>Leave</span>
                </div>

                <strong>{leaveCount}</strong>
              </div>

              <div className="attendance-bar">
                <div
                  className="bar-fill leave"
                  style={{
                    width: `${
                      attendance.length > 0
                        ? (leaveCount /
                            attendance.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="attendance-row">
                <div className="attendance-label">
                  <span className="status-dot halfday" />
                  <span>Half-day</span>
                </div>

                <strong>{halfDayCount}</strong>
              </div>

              <div className="attendance-bar">
                <div
                  className="bar-fill halfday"
                  style={{
                    width: `${
                      attendance.length > 0
                        ? (halfDayCount /
                            attendance.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="analytics-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">
                  DEPARTMENTS
                </span>

                <h2>Employee Distribution</h2>
              </div>
            </div>

            {departmentData.length === 0 ? (
              <div className="empty-state">
                No department data available.
              </div>
            ) : (
              <div className="department-list">
                {departmentData.map(
                  ([department, count]) => (
                    <div
                      className="department-item"
                      key={department}
                    >
                      <div className="department-top">
                        <span>
                          {department}
                        </span>

                        <strong>
                          {count}
                        </strong>
                      </div>

                      <div className="department-bar">
                        <div
                          style={{
                            width: `${
                              (count /
                                maxDepartmentCount) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        <section className="analytics-panel payroll-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">
                PAYROLL
              </span>

              <h2>Payroll Overview</h2>

              <p>
                Current salary information across
                employees.
              </p>
            </div>

            <div className="panel-total">
              <span>Total Net Salary</span>
              <strong>
                {formatMoney(totalPayroll)}
              </strong>
            </div>
          </div>

          {payroll.length === 0 ? (
            <div className="empty-state">
              No payroll records available.
            </div>
          ) : (
            <div className="payroll-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>

                <tbody>
                  {payroll
                    .slice(0, 8)
                    .map((record) => {
                      const employee =
                        getEmployee(
                          record.employee_id
                        )

                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="employee-cell">
                              <div className="avatar">
                                {employee?.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  '?'}
                              </div>

                              <span>
                                {employee?.full_name ||
                                  'Unknown'}
                              </span>
                            </div>
                          </td>

                          <td>
                            {employee?.employee_id ||
                              '--'}
                          </td>

                          <td>
                            {formatMoney(
                              record.basic_salary
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              record.allowances
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              record.deductions
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatMoney(
                                record.net_salary
                              )}
                            </strong>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="analytics-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">
                RECENT ACTIVITY
              </span>

              <h2>Recent Attendance</h2>

              <p>
                Latest attendance activity across
                the workforce.
              </p>
            </div>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="empty-state">
              No attendance records available.
            </div>
          ) : (
            <div className="recent-list">
              {recentAttendance.map((record) => {
                const employee = getEmployee(
                  record.employee_id
                )

                return (
                  <div
                    className="recent-item"
                    key={record.id}
                  >
                    <div className="recent-avatar">
                      {employee?.full_name
                        ?.charAt(0)
                        ?.toUpperCase() || '?'}
                    </div>

                    <div className="recent-info">
                      <strong>
                        {employee?.full_name ||
                          'Unknown Employee'}
                      </strong>

                      <span>
                        {employee?.department ||
                          'Unassigned'}
                      </span>
                    </div>

                    <div className="recent-date">
                      {formatDate(record.date)}
                    </div>

                    <span
                      className={`status-badge ${
                        record.status
                          ?.toLowerCase()
                          .replace('-', '')
                          .replace(' ', '') ||
                        'unknown'
                      }`}
                    >
                      {record.status || '--'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Analytics