
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Notifications.css'

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
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
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (profile.role !== 'hr') {
      setError(
        'Access denied. HR access is required.'
      )
      setLoading(false)
      return
    }

    const {
      data,
      error: notificationError,
    } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        is_read,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (notificationError) {
      console.error(
        'NOTIFICATIONS LOAD ERROR:',
        notificationError
      )

      setError(notificationError.message)
      setNotifications([])
      setLoading(false)
      return
    }

    setNotifications(data || [])
    setLoading(false)
  }

  const markAsRead = async (notificationId) => {
    setActionLoading(notificationId)
    setError('')

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('id', notificationId)

    if (error) {
      console.error(
        'MARK NOTIFICATION READ ERROR:',
        error
      )

      setError(error.message)
      setActionLoading(null)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification
      )
    )

    setActionLoading(null)
  }

  const markAllAsRead = async () => {
    setError('')
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate('/login')
      return
    }

    setActionLoading('all')

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error(
        'MARK ALL NOTIFICATIONS ERROR:',
        error
      )

      setError(error.message)
      setActionLoading(null)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )

    setMessage(
      'All HR notifications marked as read.'
    )

    setActionLoading(null)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return '--'
    }

    return new Date(timestamp).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  const getNotificationIcon = (type) => {
    if (type === 'leave') {
      return '📅'
    }

    if (type === 'payroll') {
      return '₹'
    }

    if (type === 'attendance') {
      return '✓'
    }

    return '🔔'
  }

  const unreadCount =
    notifications.filter(
      (notification) => !notification.is_read
    ).length

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="notifications-loading-icon">
          🔔
        </div>

        <h2>Loading HR notifications</h2>

        <p>
          Checking your latest HR activities and alerts...
        </p>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <span className="notifications-eyebrow">
            HR OPERATIONS
          </span>

          <h1>HR Notifications</h1>

          <p>
            Stay informed about employee activities,
            approvals, payroll, attendance, and other
            HR operations.
          </p>
        </div>

        <button
          type="button"
          className="notifications-back-button"
          onClick={() =>
            navigate('/hr/dashboard')
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="notifications-content">
        {error && (
          <div className="notification-message error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {message && (
          <div className="notification-message success">
            {message}
          </div>
        )}

        <section className="notification-summary">
          <div className="notification-summary-icon">
            🔔
          </div>

          <div>
            <span>HR NOTIFICATION CENTER</span>

            <h2>
              You have {unreadCount} unread HR{' '}
              {unreadCount === 1
                ? 'notification'
                : 'notifications'}
            </h2>

            <p>
              Review important employee updates,
              leave requests, attendance alerts,
              payroll updates, and other HR activities.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-button"
              disabled={
                actionLoading === 'all'
              }
              onClick={markAllAsRead}
            >
              {actionLoading === 'all'
                ? 'Updating...'
                : 'Mark All as Read'}
            </button>
          )}
        </section>

        <section className="notifications-list-card">
          <div className="notifications-list-header">
            <div>
              <span>RECENT HR ACTIVITY</span>

              <h2>All HR Notifications</h2>
            </div>

            <div className="notification-count">
              {notifications.length} Total
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <div>🔔</div>

              <h3>No HR notifications</h3>

              <p>
                There are no new HR activities or
                alerts right now.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(
                (notification) => (
                  <article
                    className={`notification-item ${
                      notification.is_read
                        ? 'read'
                        : 'unread'
                    }`}
                    key={notification.id}
                  >
                    <div
                      className={`notification-icon ${
                        notification.is_read
                          ? 'read'
                          : 'unread'
                      }`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="notification-main">
                      <div className="notification-title-row">
                        <h3>
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="unread-dot" />
                        )}
                      </div>

                      <p>
                        {notification.message}
                      </p>

                      <div className="notification-meta">
                        <span>
                          {notification.type ||
                            'HR activity'}
                        </span>

                        <span>
                          {formatDate(
                            notification.created_at
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="notification-action">
                      {notification.is_read ? (
                        <span className="read-label">
                          Read
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            notification.id
                          }
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          {actionLoading ===
                          notification.id
                            ? 'Updating...'
                            : 'Mark as Read'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Notifications
