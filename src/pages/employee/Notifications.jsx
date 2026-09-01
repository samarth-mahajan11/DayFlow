
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Notifications.css'

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (notificationId) => {
    setActionLoading(true)
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
      setActionLoading(false)
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

    setActionLoading(false)
  }

  const markAllAsRead = async () => {
    setActionLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate('/login')
      return
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error(
        'MARK ALL NOTIFICATIONS READ ERROR:',
        error
      )

      setError(error.message)
      setActionLoading(false)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )

    setActionLoading(false)
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

  const getNotificationType = (type) => {
    if (!type) {
      return 'General'
    }

    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const getNotificationIcon = (type) => {
    const normalizedType =
      String(type || '').toLowerCase()

    if (
      normalizedType.includes('leave')
    ) {
      return 'L'
    }

    if (
      normalizedType.includes('payroll') ||
      normalizedType.includes('salary')
    ) {
      return '₹'
    }

    if (
      normalizedType.includes('attendance')
    ) {
      return '✓'
    }

    if (
      normalizedType.includes('document')
    ) {
      return '▣'
    }

    if (
      normalizedType.includes('profile')
    ) {
      return 'P'
    }

    if (
      normalizedType.includes('warning') ||
      normalizedType.includes('alert')
    ) {
      return '!'
    }

    return '●'
  }

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        !notification.is_read
    ).length
  }, [notifications])

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-shell">
          <div className="notifications-loading">
            <div className="notifications-loading-mark">
              D
            </div>

            <div>
              <strong>
                Loading your notifications
              </strong>

              <span>
                Preparing your latest updates...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="notifications-shell">

        {/* HEADER */}

        <header className="notifications-header">
          <div className="notifications-brand">
            <span className="notifications-eyebrow">
              EMPLOYEE PORTAL
            </span>

            <h1>DayFlow</h1>

            <p>
              Stay updated with important workplace
              notifications.
            </p>
          </div>

          <button
            type="button"
            className="notifications-back-button"
            onClick={() =>
              navigate('/employee/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}

        

        <section className="notifications-intro">
          <div>
            <span className="notifications-section-label">
              UPDATES
            </span>

            <h2>Notifications</h2>

            <p>
              Review announcements, attendance updates,
              payroll information and other important
              messages.
            </p>
          </div>

          <div className="notifications-count">
            <strong>{unreadCount}</strong>

            <span>
              Unread
            </span>
          </div>
        </section>

        {/* ALERT */}

        {error && (
          <div className="notifications-alert">
            <span className="notifications-alert-icon">
              !
            </span>

            <div>
              <strong>
                Something needs your attention
              </strong>

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

        {/* NOTIFICATION SECTION */}

        <section className="notifications-section">
          <div className="notifications-section-heading">
            <div>
              <span className="notifications-section-label">
                INBOX
              </span>

              <h3>
                Your notifications
              </h3>

              <p>
                Your most recent workplace updates appear
                here.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-mark-all"
                onClick={markAllAsRead}
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Updating...'
                  : 'Mark all as read'}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty-state">
              <div className="notifications-empty-icon">
                ✓
              </div>

              <h4>
                You're all caught up
              </h4>

              <p>
                There are no notifications to show right
                now. New workplace updates will appear here.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(
                (notification) => (
                  <article
                    key={notification.id}
                    className={`notification-card ${
                      notification.is_read
                        ? 'notification-card-read'
                        : 'notification-card-unread'
                    }`}
                  >
                    <div
                      className={`notification-icon ${
                        notification.is_read
                          ? 'notification-icon-read'
                          : 'notification-icon-unread'
                      }`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="notification-content">
                      <div className="notification-card-heading">
                        <div>
                          <span className="notification-type">
                            {getNotificationType(
                              notification.type
                            )}
                          </span>

                          <h4>
                            {notification.title ||
                              'Notification'}
                          </h4>
                        </div>

                        {!notification.is_read && (
                          <span className="notification-new">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="notification-message">
                        {notification.message ||
                          'No message available.'}
                      </p>

                      <div className="notification-footer">
                        <span className="notification-date">
                          {formatDate(
                            notification.created_at
                          )}
                        </span>

                        {notification.is_read ? (
                          <span className="notification-read-status">
                            ✓ Read
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="notification-read-button"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            disabled={actionLoading}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}

          <div className="notifications-history-footer">
            <span>
              Showing{' '}
              <strong>
                {notifications.length}
              </strong>{' '}
              notification
              {notifications.length === 1
                ? ''
                : 's'}
            </span>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={actionLoading}
            >
              ↻ Refresh
            </button>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="notifications-footer">
          <span>
            DayFlow Employee Portal
          </span>

          
        </footer>

      </div>
    </div>
  )
}

export default Notifications
