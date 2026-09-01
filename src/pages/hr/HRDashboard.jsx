import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function HRDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    employees: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const getTodayDate = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const loadDashboardStats = async () => {
    setLoading(true)
    setError('')

    const today = getTodayDate()

    try {
      /*
       * TOTAL EMPLOYEES
       */
      const {
        count: employeeCount,
        error: employeeError,
      } = await supabase
        .from('profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('role', 'employee')

      if (employeeError) {
        throw employeeError
      }

      /*
       * TODAY'S ATTENDANCE
       */
      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select('employee_id, status')
        .eq('date', today)

      if (attendanceError) {
        throw attendanceError
      }

      /*
       * PENDING LEAVE REQUESTS
       */
      const {
        count: pendingLeaveCount,
        error: pendingLeaveError,
      } = await supabase
        .from('leaves')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'Pending')

      if (pendingLeaveError) {
        throw pendingLeaveError
      }

      /*
       * COUNT TODAY'S STATUS
       */
      const presentToday =
        attendanceData?.filter(
          (record) => record.status === 'Present'
        ).length || 0

      const onLeaveToday =
        attendanceData?.filter(
          (record) => record.status === 'Leave'
        ).length || 0

      setStats({
        employees: employeeCount || 0,
        presentToday,
        onLeaveToday,
        pendingLeaves: pendingLeaveCount || 0,
      })
    } catch (err) {
      console.error(
        'HR dashboard loading failed:',
        err.message
      )

      setError(
        'Unable to load workforce statistics.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(
        'Logout failed:',
        error.message
      )
      return
    }

    navigate('/login')
  }

  const today = new Date().toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )

  return (
    <div className="dashboard-page hr-dashboard">

      {/* ================================
          HEADER
      ================================= */}

      <header className="dashboard-header">

        <div>
          <span className="dashboard-eyebrow">
            HR MANAGEMENT PORTAL
          </span>

          <h1>DayFlow</h1>

          <p>
            Manage your workforce, operations and people data.
          </p>
        </div>

        <button
          type="button"
          className="profile-button"
          onClick={() =>
            navigate('/hr/profile')
          }
        >
          HR Profile
        </button>

      </header>


      <main className="dashboard-content">

        {/* ================================
            WELCOME
        ================================= */}

        <section className="welcome-section">

          <div>
            <span className="section-label">
              WORKFORCE OVERVIEW
            </span>

            <h2>
              HR Dashboard
            </h2>

            <p>
              Monitor employees, attendance, leave,
              payroll and organizational activity.
            </p>
          </div>

        </section>


        {/* ================================
            LIVE HR STATISTICS
        ================================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                TODAY
              </span>

              <h3>
                Workforce at a Glance
              </h3>
            </div>

            <span className="dashboard-date">
              {today}
            </span>

          </div>


          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}


          <div className="hr-stat-grid">

            {/* TOTAL EMPLOYEES */}

            <div className="hr-stat-card">

              <div className="hr-stat-top">
                <span className="hr-stat-icon employees">
                  ◎
                </span>

                <span className="hr-stat-label">
                  WORKFORCE
                </span>
              </div>

              <strong className="hr-stat-value">
                {loading ? '—' : stats.employees}
              </strong>

              <span className="hr-stat-description">
                Total employees
              </span>

            </div>


            {/* PRESENT */}

            <div className="hr-stat-card">

              <div className="hr-stat-top">
                <span className="hr-stat-icon present">
                  ✓
                </span>

                <span className="hr-stat-label">
                  ATTENDANCE
                </span>
              </div>

              <strong className="hr-stat-value">
                {loading ? '—' : stats.presentToday}
              </strong>

              <span className="hr-stat-description">
                Present today
              </span>

            </div>


            {/* ON LEAVE */}

            <div className="hr-stat-card">

              <div className="hr-stat-top">
                <span className="hr-stat-icon leave">
                  ◫
                </span>

                <span className="hr-stat-label">
                  TIME OFF
                </span>
              </div>

              <strong className="hr-stat-value">
                {loading ? '—' : stats.onLeaveToday}
              </strong>

              <span className="hr-stat-description">
                On leave today
              </span>

            </div>


            {/* PENDING LEAVES */}

            <div
              className={
                `hr-stat-card ${
                  stats.pendingLeaves > 0
                    ? 'attention'
                    : ''
                }`
              }
            >

              <div className="hr-stat-top">
                <span className="hr-stat-icon pending">
                  !
                </span>

                <span className="hr-stat-label">
                  ACTION REQUIRED
                </span>
              </div>

              <strong className="hr-stat-value">
                {loading ? '—' : stats.pendingLeaves}
              </strong>

              <span className="hr-stat-description">
                Pending leave requests
              </span>

            </div>

          </div>

        </section>


        {/* ================================
            PEOPLE & OPERATIONS
        ================================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                MANAGEMENT
              </span>

              <h3>
                People & Operations
              </h3>
            </div>

          </div>


          <div className="dashboard-card-grid">

            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/employees')
              }
            >
              <span className="card-icon">
                ◎
              </span>

              <span className="card-title">
                Employees
              </span>

              <span className="card-description">
                View, search and manage employee records.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/attendance')
              }
            >
              <span className="card-icon">
                ◷
              </span>

              <span className="card-title">
                Attendance
              </span>

              <span className="card-description">
                Monitor attendance across the workforce.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/leave-requests')
              }
            >
              <span className="card-icon">
                ◫
              </span>

              <span className="card-title">
                Leave Requests
              </span>

              <span className="card-description">
                Review, approve and reject employee leave.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/payroll')
              }
            >
              <span className="card-icon">
                ₹
              </span>

              <span className="card-title">
                Payroll
              </span>

              <span className="card-description">
                Manage salary structures and payroll records.
              </span>
            </button>

          </div>

        </section>


        {/* ================================
            INSIGHTS
        ================================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                INSIGHTS
              </span>

              <h3>
                Reports & Analytics
              </h3>
            </div>

          </div>


          <div className="dashboard-card-grid">

            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/reports')
              }
            >
              <span className="card-icon">
                ▤
              </span>

              <span className="card-title">
                Reports
              </span>

              <span className="card-description">
                Attendance, payroll, leave and employee reports.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/analytics')
              }
            >
              <span className="card-icon">
                ◒
              </span>

              <span className="card-title">
                Analytics
              </span>

              <span className="card-description">
                Understand workforce and payroll trends.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/documents')
              }
            >
              <span className="card-icon">
                ▧
              </span>

              <span className="card-title">
                Documents
              </span>

              <span className="card-description">
                Manage documents associated with employees.
              </span>
            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/hr/notifications')
              }
            >
              <span className="card-icon">
                ♢
              </span>

              <span className="card-title">
                Notifications
              </span>

              <span className="card-description">
                Stay informed about HR actions and alerts.
              </span>
            </button>

          </div>

        </section>


        {/* ================================
            PENDING ACTION
        ================================= */}

        {stats.pendingLeaves > 0 && (
          <section className="hr-action-panel">

            <div className="hr-action-icon">
              !
            </div>

            <div className="hr-action-content">

              <span className="section-label">
                REQUIRES ATTENTION
              </span>

              <h3>
                Leave requests are waiting for review
              </h3>

              <p>
                There are {stats.pendingLeaves}{' '}
                pending leave request
                {stats.pendingLeaves === 1
                  ? ''
                  : 's'} waiting for an HR decision.
              </p>

            </div>

            <button
              type="button"
              className="hr-action-button"
              onClick={() =>
                navigate('/hr/leave-requests')
              }
            >
              Review Requests
            </button>

          </section>
        )}

      </main>


      {/* ================================
          FOOTER
      ================================= */}

      <footer className="dashboard-footer">

        <span>
          DayFlow HR Management Portal
        </span>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </footer>

    </div>
  )
}

export default HRDashboard