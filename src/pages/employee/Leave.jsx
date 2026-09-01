
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Leave.css'

function Leave() {
  const navigate = useNavigate()

  const [leaveType, setLeaveType] = useState('Paid')
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [remarks, setRemarks] = useState('')

  const [leaveHistory, setLeaveHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadLeaveHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('You are not logged in.')
        return
      }

      const { data, error: leaveError } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })

      if (leaveError) {
        console.error('Leave loading failed:', leaveError)
        setError(leaveError.message)
        return
      }

      setLeaveHistory(data || [])
    } catch (err) {
      console.error('Leave loading failed:', err)
      setError(err?.message || 'Unable to load leave requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaveHistory()
  }, [])

  const calculateDays = (start, end) => {
    if (!start || !end) return 0

    const startTime = new Date(`${start}T00:00:00`)
    const endTime = new Date(`${end}T00:00:00`)

    if (endTime < startTime) return 0

    return (
      Math.floor(
        (endTime.getTime() - startTime.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    )
  }

  const requestedDays = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  )

  const stats = useMemo(() => {
    const pending = leaveHistory.filter(
      (leave) =>
        String(leave.status || '').toLowerCase() === 'pending'
    )

    const approved = leaveHistory.filter(
      (leave) =>
        String(leave.status || '').toLowerCase() === 'approved'
    )

    const rejected = leaveHistory.filter(
      (leave) =>
        String(leave.status || '').toLowerCase() === 'rejected'
    )

    const approvedDays = approved.reduce(
      (total, leave) =>
        total +
        calculateDays(leave.start_date, leave.end_date),
      0
    )

    const pendingDays = pending.reduce(
      (total, leave) =>
        total +
        calculateDays(leave.start_date, leave.end_date),
      0
    )

    return {
      total: leaveHistory.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      approvedDays,
      pendingDays,
    }
  }, [leaveHistory])

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!startDate || !endDate) {
      setError('Please select both the start date and end date.')
      return
    }

    if (endDate < startDate) {
      setError('End date cannot be before the start date.')
      return
    }

    if (requestedDays <= 0) {
      setError('Please select a valid leave period.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('You are not logged in.')
      }

      const validLeaveTypes = ['Paid', 'Sick', 'Unpaid']

      const selectedLeaveType = validLeaveTypes.includes(leaveType)
        ? leaveType
        : 'Paid'

      const { error: insertError } = await supabase
        .from('leaves')
        .insert([
          {
            employee_id: user.id,
            leave_type: selectedLeaveType,
            start_date: startDate,
            end_date: endDate,
            remarks: remarks.trim(),
            status: 'Pending',
          },
        ])

      if (insertError) {
        console.error('Leave submission failed:', insertError)
        throw new Error(insertError.message)
      }

      setMessage(
        'Your leave request has been submitted successfully.'
      )

      setLeaveType('Paid')
      setLeaveTypeOpen(false)
      setStartDate('')
      setEndDate('')
      setRemarks('')

      await loadLeaveHistory()
    } catch (err) {
      console.error('Leave submission failed:', err)

      setError(
        err?.message || 'Unable to submit leave request.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '--'

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const formatDateTime = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const getStatus = (status) => {
    const value = String(status || '').toLowerCase()

    if (value === 'approved') return 'approved'
    if (value === 'rejected') return 'rejected'

    return 'pending'
  }

  const getStatusLabel = (status) => {
    const value = getStatus(status)

    if (value === 'approved') return 'Approved'
    if (value === 'rejected') return 'Rejected'

    return 'Pending'
  }

  const getLeaveIcon = (type) => {
    if (type === 'Sick') return '✚'
    if (type === 'Unpaid') return '◈'
    return '✓'
  }

  const getLeaveLabel = (type) => {
    if (type === 'Sick') return 'Sick Leave'
    if (type === 'Unpaid') return 'Unpaid Leave'

    return 'Paid Leave'
  }

  return (
    <div className="leave-page">
      <div className="leave-shell">

        {/* TOP NAVIGATION */}
        <header className="leave-topbar">
          <div className="leave-brand">
            <div className="leave-brand-mark">D</div>

            <div>
              <div className="leave-brand-name">
                DayFlow
              </div>

              <div className="leave-brand-subtitle">
                Employee Portal
              </div>
            </div>
          </div>

          <button
            type="button"
            className="leave-back-button"
            onClick={() =>
              navigate('/employee/dashboard')
            }
          >
            <span>←</span>
            Back to Dashboard
          </button>
        </header>

        {/* HERO */}
        <section className="leave-hero">
          <div>
            <div className="leave-eyebrow">
              TIME OFF MANAGEMENT
            </div>

            <h1>Leave Requests</h1>

            <p>
              Plan your time away, submit requests and
              monitor approvals from one place.
            </p>
          </div>

          <div className="leave-hero-badge">
            <span className="hero-badge-dot" />
            Employee Leave Center
          </div>
        </section>

        {/* STATS */}
        <section className="leave-stats">

          <div className="leave-stat-card">
            <div className="stat-icon blue">◉</div>

            <div>
              <span className="stat-label">
                Total Requests
              </span>

              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="leave-stat-card">
            <div className="stat-icon orange">◷</div>

            <div>
              <span className="stat-label">
                Pending
              </span>

              <strong>{stats.pending}</strong>

              <small>
                {stats.pendingDays}{' '}
                {stats.pendingDays === 1 ? 'day' : 'days'}
              </small>
            </div>
          </div>

          <div className="leave-stat-card">
            <div className="stat-icon green">✓</div>

            <div>
              <span className="stat-label">
                Approved
              </span>

              <strong>{stats.approved}</strong>

              <small>
                {stats.approvedDays}{' '}
                {stats.approvedDays === 1 ? 'day' : 'days'}
              </small>
            </div>
          </div>

          <div className="leave-stat-card">
            <div className="stat-icon red">!</div>

            <div>
              <span className="stat-label">
                Rejected
              </span>

              <strong>{stats.rejected}</strong>
            </div>
          </div>

        </section>

        {/* MAIN CONTENT */}
        <main className="leave-content">

          {/* APPLY PANEL */}
          <section className="leave-card apply-card">

            <div className="card-heading">
              <div>
                <span className="section-kicker">
                  NEW REQUEST
                </span>

                <h2>Apply for Leave</h2>

                <p>
                  Select your leave type and dates.
                  Your request will be sent directly to HR.
                </p>
              </div>

              <div className="heading-icon">
                +
              </div>
            </div>

            {error && (
              <div className="leave-alert error">
                <span className="alert-icon">!</span>

                <div>
                  <strong>Something went wrong</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {message && (
              <div className="leave-alert success">
                <span className="alert-icon">✓</span>

                <div>
                  <strong>Request submitted</strong>
                  <p>{message}</p>
                </div>
              </div>
            )}

            <form
              className="leave-form"
              onSubmit={handleSubmit}
            >

              {/* LEAVE TYPE */}
              <div className="form-group">
                <label>Leave Type</label>

                <div className="leave-select-wrapper">

                  <button
                    type="button"
                    className={`leave-select ${
                      leaveTypeOpen ? 'active' : ''
                    }`}
                    onClick={() =>
                      setLeaveTypeOpen(
                        (current) => !current
                      )
                    }
                  >
                    <span className="select-left">
                      <span
                        className={`type-mini-icon ${leaveType.toLowerCase()}`}
                      >
                        {getLeaveIcon(leaveType)}
                      </span>

                      <span>
                        <strong>
                          {getLeaveLabel(leaveType)}
                        </strong>

                        <small>
                          {leaveType === 'Paid'
                            ? 'Use your available paid leave'
                            : leaveType === 'Sick'
                            ? 'For illness or medical reasons'
                            : 'Leave without paid benefits'}
                        </small>
                      </span>
                    </span>

                    <span className="select-arrow">
                      {leaveTypeOpen ? '⌃' : '⌄'}
                    </span>
                  </button>

                  {leaveTypeOpen && (
                    <div className="leave-options">

                      {[
                        {
                          value: 'Paid',
                          icon: '✓',
                          title: 'Paid Leave',
                          description:
                            'Use your available paid leave',
                        },
                        {
                          value: 'Sick',
                          icon: '✚',
                          title: 'Sick Leave',
                          description:
                            'For illness or medical reasons',
                        },
                        {
                          value: 'Unpaid',
                          icon: '◈',
                          title: 'Unpaid Leave',
                          description:
                            'Leave without paid benefits',
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={
                            leaveType === option.value
                              ? 'selected'
                              : ''
                          }
                          onClick={() => {
                            setLeaveType(option.value)
                            setLeaveTypeOpen(false)
                          }}
                        >
                          <span
                            className={`option-icon ${option.value.toLowerCase()}`}
                          >
                            {option.icon}
                          </span>

                          <span className="option-copy">
                            <strong>
                              {option.title}
                            </strong>

                            <small>
                              {option.description}
                            </small>
                          </span>

                          {leaveType === option.value && (
                            <span className="option-check">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* DATES */}
              <div className="date-grid">

                <div className="form-group">
                  <label htmlFor="startDate">
                    Start Date
                  </label>

                  <div className="date-input">
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">
                    End Date
                  </label>

                  <div className="date-input">
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) =>
                        setEndDate(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>

              </div>

              {/* DURATION */}
              <div className="duration-card">

                <div className="duration-icon">
                  ◷
                </div>

                <div>
                  <span>Requested duration</span>

                  <strong>
                    {requestedDays > 0
                      ? `${requestedDays} ${
                          requestedDays === 1
                            ? 'day'
                            : 'days'
                        }`
                      : 'Select your dates'}
                  </strong>
                </div>

                {requestedDays > 0 && (
                  <div className="duration-ready">
                    ✓ Ready
                  </div>
                )}
              </div>

              {/* REMARKS */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="remarks">
                    Remarks
                  </label>

                  <span>Optional</span>
                </div>

                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  placeholder="Briefly tell HR why you need this leave..."
                  rows="4"
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="leave-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="button-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Leave Request
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="form-note">
                Your request will be reviewed by HR before
                the leave is approved.
              </div>

            </form>
          </section>

          {/* HISTORY PANEL */}
          <section className="leave-card history-card">

            <div className="history-heading">

              <div>
                <span className="section-kicker">
                  REQUEST HISTORY
                </span>

                <h2>My Leave Requests</h2>

                <p>
                  Track all your submitted leave requests
                  and their current status.
                </p>
              </div>

              <div className="request-counter">
                {stats.total}
                <span>
                  {stats.total === 1
                    ? 'request'
                    : 'requests'}
                </span>
              </div>

            </div>

            {loading ? (
              <div className="leave-loading">
                <div className="loading-spinner" />

                <strong>
                  Loading your requests
                </strong>

                <span>
                  Please wait a moment...
                </span>
              </div>
            ) : leaveHistory.length === 0 ? (
              <div className="leave-empty">

                <div className="empty-circle">
                  ✓
                </div>

                <h3>No leave requests yet</h3>

                <p>
                  Your submitted requests will appear
                  here with their approval status.
                </p>
              </div>
            ) : (
              <div className="request-list">

                {leaveHistory.map((leave) => {
                  const days = calculateDays(
                    leave.start_date,
                    leave.end_date
                  )

                  const status = getStatus(
                    leave.status
                  )

                  return (
                    <article
                      className="request-item"
                      key={leave.id}
                    >

                      <div className="request-main">

                        <div
                          className={`request-type-icon ${leave.leave_type?.toLowerCase()}`}
                        >
                          {getLeaveIcon(
                            leave.leave_type
                          )}
                        </div>

                        <div className="request-info">

                          <div className="request-title-row">
                            <h3>
                              {getLeaveLabel(
                                leave.leave_type
                              )}
                            </h3>

                            <span
                              className={`request-status ${status}`}
                            >
                              <span />
                              {getStatusLabel(
                                leave.status
                              )}
                            </span>
                          </div>

                          <div className="request-meta">

                            <span>
                              <b>Period</b>
                              {formatDate(
                                leave.start_date
                              )}
                              <em>→</em>
                              {formatDate(
                                leave.end_date
                              )}
                            </span>

                            <span>
                              <b>Duration</b>
                              {days}{' '}
                              {days === 1
                                ? 'day'
                                : 'days'}
                            </span>

                          </div>

                        </div>

                      </div>

                      {leave.remarks && (
                        <div className="request-remarks">
                          <span>Remark</span>
                          <p>{leave.remarks}</p>
                        </div>
                      )}

                      {leave.admin_comment && (
                        <div className="request-comment">
                          <span>HR response</span>
                          <p>{leave.admin_comment}</p>
                        </div>
                      )}

                      {leave.created_at && (
                        <div className="request-footer">
                          Submitted on{' '}
                          {formatDateTime(
                            leave.created_at
                          )}
                        </div>
                      )}

                    </article>
                  )
                })}

              </div>
            )}
          </section>

        </main>

        {/* FOOTER */}
        <footer className="leave-footer">
          <span>
            <strong>DayFlow</strong>
            {' '}· Employee Leave Management
          </span>

          <span>
            Manage your time. Stay in flow.
          </span>
        </footer>

      </div>
    </div>
  )
}

export default Leave
