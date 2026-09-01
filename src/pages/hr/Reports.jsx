import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Reports.css'

function Reports() {
  const navigate = useNavigate()

  const [attendance, setAttendance] = useState([])
  const [payroll, setPayroll] = useState([])
  const [profiles, setProfiles] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = async () => {
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

    const {
      data: hrProfile,
      error: hrProfileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (hrProfileError) {
      setError(hrProfileError.message)
      setLoading(false)
      return
    }

    if (hrProfile.role !== 'hr') {
      setError('Access denied. HR access is required.')
      setLoading(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        employee_id,
        full_name,
        email,
        department,
        position
      `)
      .eq('role', 'employee')
      .order('full_name', { ascending: true })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    const {
      data: attendanceData,
      error: attendanceError,
    } = await supabase
      .from('attendance')
      .select(`
        id,
        employee_id,
        date,
        check_in,
        check_out,
        status,
        created_at,
        updated_at
      `)
      .order('date', { ascending: false })

    if (attendanceError) {
      setError(attendanceError.message)
      setLoading(false)
      return
    }

    const {
      data: payrollData,
      error: payrollError,
    } = await supabase
      .from('payroll')
      .select(`
        id,
        employee_id,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        effective_from,
        created_at,
        updated_at
      `)
      .order('effective_from', { ascending: false })

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

  useEffect(() => {
    loadReports()
  }, [])

  const getEmployee = (employeeId) => {
    return profiles.find(
      (profile) => profile.id === employeeId
    )
  }

  const formatDate = (value) => {
    if (!value) {
      return '--'
    }

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value) => {
    if (!value) {
      return '--'
    }

    return new Date(value).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMoney = (value) => {
    if (value === null || value === undefined) {
      return '--'
    }

    return `₹${Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const presentCount = attendance.filter(
    (record) => record.status === 'Present'
  ).length

  const absentCount = attendance.filter(
    (record) => record.status === 'Absent'
  ).length

  const halfDayCount = attendance.filter(
    (record) => record.status === 'Half-day'
  ).length

  const leaveCount = attendance.filter(
    (record) => record.status === 'Leave'
  ).length

  const totalPayroll = payroll.reduce(
    (total, record) =>
      total + Number(record.net_salary || 0),
    0
  )

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="reports-loading-icon">R</div>

          <h2>Loading reports...</h2>

          <p>
            Preparing workforce and payroll reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">

      {/* Header */}
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">
            INSIGHTS
          </span>

          <h1>Reports</h1>

          <p>
            Review attendance, payroll and workforce
            information across your organization.
          </p>
        </div>

        <button
          type="button"
          className="reports-back-button"
          onClick={() =>
            navigate('/hr/dashboard')
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className="reports-alert reports-alert-error">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      {/* Attendance Overview */}
      <section className="reports-section">

        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              ATTENDANCE
            </span>

            <h2>Attendance Overview</h2>

            <p>
              Workforce attendance summary based on
              recorded attendance entries.
            </p>
          </div>
        </div>

        <div className="summary-grid">

          <div className="summary-card">
            <div className="summary-icon summary-icon-present">
              ✓
            </div>

            <div>
              <span className="summary-label">
                Present
              </span>

              <strong className="summary-value">
                {presentCount}
              </strong>

              <span className="summary-description">
                Attendance records
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon summary-icon-absent">
              !
            </div>

            <div>
              <span className="summary-label">
                Absent
              </span>

              <strong className="summary-value">
                {absentCount}
              </strong>

              <span className="summary-description">
                Attendance records
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon summary-icon-half">
              ½
            </div>

            <div>
              <span className="summary-label">
                Half-day
              </span>

              <strong className="summary-value">
                {halfDayCount}
              </strong>

              <span className="summary-description">
                Attendance records
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon summary-icon-leave">
              L
            </div>

            <div>
              <span className="summary-label">
                Leave
              </span>

              <strong className="summary-value">
                {leaveCount}
              </strong>

              <span className="summary-description">
                Attendance records
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Attendance Report */}
      <section className="reports-section">

        <div className="section-heading section-heading-row">
          <div>
            <span className="section-eyebrow">
              ATTENDANCE REPORT
            </span>

            <h2>Employee Attendance</h2>

            <p>
              Detailed attendance activity across employees.
            </p>
          </div>

          <div className="record-count">
            {attendance.length} records
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              A
            </div>

            <h3>No attendance records</h3>

            <p>
              Attendance information will appear here
              once employees start recording attendance.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map((record) => {
                    const employee = getEmployee(
                      record.employee_id
                    )

                    return (
                      <tr key={record.id}>

                        <td>
                          <div className="employee-cell">
                            <div className="employee-avatar">
                              {employee?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || 'E'}
                            </div>

                            <div>
                              <strong>
                                {employee?.full_name ||
                                  'Unknown'}
                              </strong>

                              <span>
                                {employee?.email ||
                                  '--'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="id-badge">
                            {employee?.employee_id ||
                              '--'}
                          </span>
                        </td>

                        <td>
                          {employee?.department ||
                            'Not assigned'}
                        </td>

                        <td>
                          {formatDate(record.date)}
                        </td>

                        <td>
                          {formatTime(record.check_in)}
                        </td>

                        <td>
                          {formatTime(record.check_out)}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${(
                              record.status || 'unknown'
                            )
                              .toLowerCase()
                              .replace(/\s+/g, '-')}`}
                          >
                            {record.status || '--'}
                          </span>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Payroll Overview */}
      <section className="reports-section">

        <div className="section-heading section-heading-row">
          <div>
            <span className="section-eyebrow">
              PAYROLL
            </span>

            <h2>Payroll Overview</h2>

            <p>
              Current salary information recorded for employees.
            </p>
          </div>

          <div className="payroll-total-card">
            <span>Total Net Salary</span>

            <strong>
              {formatMoney(totalPayroll)}
            </strong>
          </div>
        </div>

        <div className="payroll-mini-grid">

          <div className="payroll-mini-card">
            <span>Payroll Records</span>

            <strong>
              {payroll.length}
            </strong>
          </div>

          <div className="payroll-mini-card">
            <span>Total Net Salary</span>

            <strong>
              {formatMoney(totalPayroll)}
            </strong>
          </div>

        </div>

      </section>

      {/* Payroll Report */}
      <section className="reports-section">

        <div className="section-heading section-heading-row">
          <div>
            <span className="section-eyebrow">
              PAYROLL REPORT
            </span>

            <h2>Employee Payroll</h2>

            <p>
              Detailed compensation records for employees.
            </p>
          </div>

          <div className="record-count">
            {payroll.length} records
          </div>
        </div>

        {payroll.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ₹
            </div>

            <h3>No payroll records</h3>

            <p>
              Payroll information will appear here
              once salary records are created.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="reports-table payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Effective From</th>
                  </tr>
                </thead>

                <tbody>
                  {payroll.map((record) => {
                    const employee = getEmployee(
                      record.employee_id
                    )

                    return (
                      <tr key={record.id}>

                        <td>
                          <div className="employee-cell">
                            <div className="employee-avatar">
                              {employee?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || 'E'}
                            </div>

                            <div>
                              <strong>
                                {employee?.full_name ||
                                  'Unknown'}
                              </strong>

                              <span>
                                {employee?.email ||
                                  '--'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="id-badge">
                            {employee?.employee_id ||
                              '--'}
                          </span>
                        </td>

                        <td>
                          {formatMoney(
                            record.basic_salary
                          )}
                        </td>

                        <td className="money-positive">
                          +{formatMoney(
                            record.allowances
                          )}
                        </td>

                        <td className="money-negative">
                          -{formatMoney(
                            record.deductions
                          )}
                        </td>

                        <td>
                          <strong className="net-salary">
                            {formatMoney(
                              record.net_salary
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            record.effective_from
                          )}
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="reports-footer">
        <span>
          DayFlow HR Reports
        </span>

       
      </footer>

    </div>
  )
}

export default Reports