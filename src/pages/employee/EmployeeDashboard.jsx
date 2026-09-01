
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function EmployeeDashboard() {
  const navigate = useNavigate()

  const [employee, setEmployee] = useState(null)

  const [stats, setStats] = useState({
    attendanceStatus: 'Not marked',
    pendingLeaves: 0,
    approvedLeaves: 0,
    netSalary: null,
    unreadNotifications: 0,
  })

  const [notifications, setNotifications] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmployeeDashboard()
  }, [])

  const getTodayDate = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const loadEmployeeDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Unable to identify the logged-in employee.')
      }

      const today = getTodayDate()

      /* =========================================
         EMPLOYEE PROFILE
      ========================================= */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error(
          'Profile loading failed:',
          profileError.message
        )
      }

      setEmployee(
        profileData || {
          email: user.email,
        }
      )


      /* =========================================
         TODAY'S ATTENDANCE
      ========================================= */

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (attendanceError) {
        console.error(
          'Attendance loading failed:',
          attendanceError.message
        )
      }


      /* =========================================
         LEAVE REQUESTS
      ========================================= */

      const {
        data: leaveData,
        error: leaveError,
      } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(10)

      if (leaveError) {
        console.error(
          'Leave loading failed:',
          leaveError.message
        )
      }


      /* =========================================
         PAYROLL
      ========================================= */

      const {
        data: payrollData,
        error: payrollError,
      } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', user.id)
        .order('effective_from', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (payrollError) {
        console.error(
          'Payroll loading failed:',
          payrollError.message
        )
      }


      /* =========================================
         NOTIFICATIONS
      ========================================= */

      const {
        data: notificationData,
        error: notificationError,
      } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(5)

      if (notificationError) {
        console.error(
          'Notification loading failed:',
          notificationError.message
        )
      }

      const allNotifications =
        notificationData || []

      const unreadNotifications =
        allNotifications.filter(
          (notification) =>
            notification.is_read === false
        ).length


      /* =========================================
         CALCULATE PERSONAL STATS
      ========================================= */

      const pendingLeaves =
        (leaveData || []).filter(
          (leave) =>
            String(leave.status).toLowerCase() ===
            'pending'
        ).length

      const approvedLeaves =
        (leaveData || []).filter(
          (leave) =>
            String(leave.status).toLowerCase() ===
            'approved'
        ).length


      setStats({
        attendanceStatus:
          attendanceData?.status || 'Not marked',

        pendingLeaves,

        approvedLeaves,

        netSalary:
          payrollData?.net_salary ?? null,

        unreadNotifications,
      })

      setNotifications(allNotifications)
    } catch (err) {
      console.error(
        'Employee dashboard loading failed:',
        err.message
      )

      setError(
        'Unable to load your dashboard information.'
      )
    } finally {
      setLoading(false)
    }
  }


  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = async () => {
    const { error: logoutError } =
      await supabase.auth.signOut()

    if (logoutError) {
      console.error(
        'Logout failed:',
        logoutError.message
      )
      return
    }

    navigate('/login')
  }


  /* =========================================
     DISPLAY VALUES
  ========================================= */

  const employeeName =
    employee?.full_name ||
    employee?.name ||
    employee?.employee_name ||
    'Employee'

  const today = new Date().toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )

  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return '—'
    }

    return `₹${Number(value).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 2,
      }
    )}`
  }


  return (
    <div className="dashboard-page employee-dashboard">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="dashboard-header">

        <div>

          <span className="dashboard-eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h1>
            DayFlow
          </h1>

          <p>
            Everything you need for your workday,
            in one place.
          </p>

        </div>

        <button
          type="button"
          className="profile-button"
          onClick={() =>
            navigate('/employee/profile')
          }
        >
          My Profile
        </button>

      </header>


      <main className="dashboard-content">


        {/* ========================================
            PERSONAL WELCOME
        ======================================== */}

        <section className="welcome-section employee-welcome">

          <div>

            <span className="section-label">
              YOUR WORKSPACE
            </span>

            <h2>
              Welcome back, {employeeName}
            </h2>

            <p>
              Here's your personal workday overview.
            </p>

          </div>

          <span className="dashboard-date">
            {today}
          </span>

        </section>


        {/* ========================================
            PERSONAL SNAPSHOT
        ======================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                MY DAY
              </span>

              <h3>
                Personal Snapshot
              </h3>

            </div>

          </div>


          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}


          <div className="employee-stat-grid">


            {/* ATTENDANCE */}

            <div className="employee-stat-card">

              <div className="employee-stat-icon attendance">
                ✓
              </div>

              <span className="employee-stat-label">
                TODAY'S ATTENDANCE
              </span>

              <strong>
                {loading
                  ? '—'
                  : stats.attendanceStatus}
              </strong>

              <span>
                Your attendance status today
              </span>

            </div>


            {/* PENDING LEAVE */}

            <div className="employee-stat-card">

              <div className="employee-stat-icon leave">
                ◫
              </div>

              <span className="employee-stat-label">
                LEAVE REQUESTS
              </span>

              <strong>
                {loading
                  ? '—'
                  : stats.pendingLeaves}
              </strong>

              <span>
                Pending requests
              </span>

            </div>


            {/* APPROVED LEAVE */}

            <div className="employee-stat-card">

              <div className="employee-stat-icon approved">
                ✓
              </div>

              <span className="employee-stat-label">
                APPROVED
              </span>

              <strong>
                {loading
                  ? '—'
                  : stats.approvedLeaves}
              </strong>

              <span>
                Approved requests
              </span>

            </div>


            {/* PAYROLL */}

            <div className="employee-stat-card">

              <div className="employee-stat-icon payroll">
                ₹
              </div>

              <span className="employee-stat-label">
                PAYROLL
              </span>

              <strong>
                {loading
                  ? '—'
                  : formatCurrency(
                      stats.netSalary
                    )}
              </strong>

              <span>
                Latest net salary
              </span>

            </div>

          </div>

        </section>


        {/* ========================================
            MY WORK
        ======================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                QUICK ACCESS
              </span>

              <h3>
                My Work
              </h3>

            </div>

          </div>


          <div className="dashboard-card-grid employee-card-grid">


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/attendance')
              }
            >

              <span className="card-icon">
                ◷
              </span>

              <span className="card-title">
                Attendance
              </span>

              <span className="card-description">
                Check in, check out and view your attendance.
              </span>

            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/leave')
              }
            >

              <span className="card-icon">
                ◫
              </span>

              <span className="card-title">
                Leave Requests
              </span>

              <span className="card-description">
                Apply for leave and track your requests.
              </span>

            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/payroll')
              }
            >

              <span className="card-icon">
                ₹
              </span>

              <span className="card-title">
                Payroll
              </span>

              <span className="card-description">
                View your salary and payroll information.
              </span>

            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/documents')
              }
            >

              <span className="card-icon">
                ▧
              </span>

              <span className="card-title">
                Documents
              </span>

              <span className="card-description">
                Access your important employee documents.
              </span>

            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/notifications')
              }
            >

              <span className="card-icon">
                ♢
              </span>

              <span className="card-title">
                Notifications
              </span>

              <span className="card-description">
                View leave, attendance and payroll alerts.
              </span>

              {stats.unreadNotifications > 0 && (
                <span className="notification-badge">
                  {stats.unreadNotifications} unread
                </span>
              )}

            </button>


            <button
              type="button"
              className="dashboard-card"
              onClick={() =>
                navigate('/employee/profile')
              }
            >

              <span className="card-icon">
                ◎
              </span>

              <span className="card-title">
                My Profile
              </span>

              <span className="card-description">
                View and update your personal information.
              </span>

            </button>

          </div>

        </section>


        {/* ========================================
            RECENT ACTIVITY
        ======================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                PERSONAL ACTIVITY
              </span>

              <h3>
                Recent Activity & Alerts
              </h3>

            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                className="text-action"
                onClick={() =>
                  navigate('/employee/notifications')
                }
              >
                View all
              </button>
            )}

          </div>


          <div className="activity-panel">

            {loading ? (

              <div className="activity-empty">
                Loading your recent activity...
              </div>

            ) : notifications.length === 0 ? (

              <div className="activity-empty">

                <span className="activity-empty-icon">
                  ✓
                </span>

                <strong>
                  You're all caught up
                </strong>

                <span>
                  No recent notifications or alerts.
                </span>

              </div>

            ) : (

              notifications.map(
                (notification) => (

                  <div
                    className={
                      `activity-item ${
                        notification.is_read
                          ? ''
                          : 'unread'
                      }`
                    }
                    key={notification.id}
                  >

                    <span className="activity-dot" />

                    <div className="activity-content">

                      <strong>
                        {notification.title ||
                          'Notification'}
                      </strong>

                      <p>
                        {notification.message || ''}
                      </p>

                      <small>
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ''}
                      </small>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>


      </main>


      {/* ========================================
          FOOTER
      ======================================== */}

      <footer className="dashboard-footer">

        <span>
          DayFlow Employee Portal
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

export default EmployeeDashboard
