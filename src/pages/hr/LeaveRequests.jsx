import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './LeaveRequests.css'

function LeaveRequests() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchLeaveRequests = async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('leaves')
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        remarks,
        status,
        admin_comment,
        approved_by,
        approved_at,
        created_at,
        profiles:employee_id (
          id,
          employee_id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('FETCH ERROR:', fetchError)
      setError(fetchError.message)
      setRequests([])
    } else {
      setRequests(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const handleDecision = async (leaveId, decision) => {
    setError('')
    setSuccess('')
    setActionLoading(leaveId)

    const comment = comments[leaveId] || ''

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'HR session not found. Please log in again.'
        )
      }

      const { data, error: updateError } = await supabase
        .from('leaves')
        .update({
          status: decision,
          admin_comment: comment || null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', leaveId)
        .select()

      if (updateError) {
        throw updateError
      }

      if (!data || data.length === 0) {
        throw new Error(
          'No leave request was updated. Make sure you are logged in as HR.'
        )
      }

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: data[0].employee_id,
          title:
            decision === 'Approved'
              ? 'Leave Request Approved'
              : 'Leave Request Rejected',
          message:
            decision === 'Approved'
              ? `Your ${data[0].leave_type} leave request from ${data[0].start_date} to ${data[0].end_date} has been approved by HR.`
              : `Your ${data[0].leave_type} leave request from ${data[0].start_date} to ${data[0].end_date} has been rejected by HR.`,
          type: 'leave',
          is_read: false,
        })

      if (notificationError) {
        console.error(
          'NOTIFICATION INSERT ERROR:',
          notificationError
        )
      }

      setSuccess(
        `Leave request ${decision.toLowerCase()} successfully.`
      )

      setComments((previous) => ({
        ...previous,
        [leaveId]: '',
      }))

      await fetchLeaveRequests()
    } catch (err) {
      console.error('LEAVE DECISION ERROR:', err)

      setError(
        err.message || 'Something went wrong.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusClass = (status) => {
    if (status === 'Approved') {
      return 'leave-status-approved'
    }

    if (status === 'Rejected') {
      return 'leave-status-rejected'
    }

    return 'leave-status-pending'
  }

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return '--'
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const difference =
      Math.floor(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1

    return difference > 0 ? difference : '--'
  }

  const formatDate = (date) => {
    if (!date) {
      return '--'
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const pendingCount = requests.filter(
    (request) => request.status === 'Pending'
  ).length

  const approvedCount = requests.filter(
    (request) => request.status === 'Approved'
  ).length

  const rejectedCount = requests.filter(
    (request) => request.status === 'Rejected'
  ).length

  if (loading) {
    return (
      <div className="leave-page">
        <div className="leave-shell">
          <div className="leave-loading">
            <div className="leave-loading-icon">
              ✓
            </div>

            <div>
              <strong>Loading leave requests</strong>
              <span>
                Fetching employee leave information...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="leave-page">
      <div className="leave-shell">

        {/* HEADER */}
        <header className="leave-header">
          <div className="leave-brand">
            <span className="leave-eyebrow">
              DAYFLOW • HR MANAGEMENT
            </span>

            <h1>Leave Requests</h1>

            <p>
              Review and manage employee leave applications.
            </p>
          </div>

          <button
            type="button"
            className="leave-back-button"
            onClick={() =>
              navigate('/hr/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}
        <section className="leave-intro">
          <div>
            <span className="leave-section-label">
              LEAVE MANAGEMENT
            </span>

            <h2>Employee Leave Applications</h2>

            <p>
              Review pending requests and track previous
              leave decisions.
            </p>
          </div>

          <div className="leave-total-card">
            <strong>{requests.length}</strong>
            <span>Total Requests</span>
          </div>
        </section>

        {/* STATS */}
        <section className="leave-stats">
          <div className="leave-stat-card">
            <div className="leave-stat-icon leave-stat-icon-pending">
              ⏳
            </div>

            <div>
              <strong>{pendingCount}</strong>
              <span>Pending</span>
            </div>
          </div>

          <div className="leave-stat-card">
            <div className="leave-stat-icon leave-stat-icon-approved">
              ✓
            </div>

            <div>
              <strong>{approvedCount}</strong>
              <span>Approved</span>
            </div>
          </div>

          <div className="leave-stat-card">
            <div className="leave-stat-icon leave-stat-icon-rejected">
              ×
            </div>

            <div>
              <strong>{rejectedCount}</strong>
              <span>Rejected</span>
            </div>
          </div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="leave-alert leave-alert-error">
            <div className="leave-alert-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
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

        {success && (
          <div className="leave-alert leave-alert-success">
            <div className="leave-alert-icon">✓</div>

            <div>
              <strong>Action completed</strong>
              <p>{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess('')}
            >
              ×
            </button>
          </div>
        )}

        {/* REQUESTS */}
        <section className="leave-list-section">
          <div className="leave-section-heading">
            <div>
              <span className="leave-section-label">
                REQUESTS
              </span>

              <h3>Leave Applications</h3>
            </div>

            <span className="leave-request-count">
              {requests.length} requests
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="leave-empty">
              <div className="leave-empty-icon">
                ✓
              </div>

              <h4>No leave requests</h4>

              <p>
                There are currently no employee leave
                applications to review.
              </p>
            </div>
          ) : (
            <div className="leave-request-list">
              {requests.map((request) => (
                <article
                  className="leave-request-card"
                  key={request.id}
                >
                  {/* CARD TOP */}
                  <div className="leave-card-top">
                    <div className="leave-employee">
                      <div className="leave-avatar">
                        {(
                          request.profiles?.full_name ||
                          'E'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h4>
                          {
                            request.profiles?.full_name ||
                            'Unknown Employee'
                          }
                        </h4>

                        <p>
                          {request.profiles?.employee_id ||
                            '--'}
                          {' • '}
                          {request.profiles?.email ||
                            'No email'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`leave-status ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {/* DETAILS */}
                  <div className="leave-details-grid">
                    <div className="leave-detail">
                      <span>Leave Type</span>
                      <strong>
                        {request.leave_type || '--'}
                      </strong>
                    </div>

                    <div className="leave-detail">
                      <span>Start Date</span>
                      <strong>
                        {formatDate(
                          request.start_date
                        )}
                      </strong>
                    </div>

                    <div className="leave-detail">
                      <span>End Date</span>
                      <strong>
                        {formatDate(
                          request.end_date
                        )}
                      </strong>
                    </div>

                    <div className="leave-detail">
                      <span>Duration</span>
                      <strong>
                        {calculateDays(
                          request.start_date,
                          request.end_date
                        )}
                        {calculateDays(
                          request.start_date,
                          request.end_date
                        ) !== '--'
                          ? ' days'
                          : ''}
                      </strong>
                    </div>
                  </div>

                  {/* REMARKS */}
                  <div className="leave-remarks">
                    <span>Employee Remarks</span>

                    <p>
                      {request.remarks ||
                        'No remarks provided.'}
                    </p>
                  </div>

                  {/* DECISION AREA */}
                  {request.status === 'Pending' ? (
                    <div className="leave-decision">
                      <label>
                        HR Comment
                      </label>

                      <textarea
                        rows="3"
                        placeholder="Add an optional comment before making a decision..."
                        value={
                          comments[request.id] || ''
                        }
                        onChange={(event) => {
                          setComments(
                            (previous) => ({
                              ...previous,
                              [request.id]:
                                event.target.value,
                            })
                          )
                        }}
                        disabled={
                          actionLoading ===
                          request.id
                        }
                      />

                      <div className="leave-actions">
                        <button
                          type="button"
                          className="leave-approve-button"
                          disabled={
                            actionLoading ===
                            request.id
                          }
                          onClick={() =>
                            handleDecision(
                              request.id,
                              'Approved'
                            )
                          }
                        >
                          {actionLoading ===
                          request.id
                            ? 'Updating...'
                            : '✓ Approve'}
                        </button>

                        <button
                          type="button"
                          className="leave-reject-button"
                          disabled={
                            actionLoading ===
                            request.id
                          }
                          onClick={() =>
                            handleDecision(
                              request.id,
                              'Rejected'
                            )
                          }
                        >
                          {actionLoading ===
                          request.id
                            ? 'Updating...'
                            : '× Reject'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="leave-decision-made">
                      <div>
                        <span>
                          HR Comment
                        </span>

                        <p>
                          {request.admin_comment ||
                            'No HR comment provided.'}
                        </p>
                      </div>

                      <span className="leave-decision-label">
                        Decision completed
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="leave-footer">
          <span>
            DayFlow • Leave Management
          </span>

          <button
            type="button"
            onClick={fetchLeaveRequests}
          >
            ↻ Refresh
          </button>
        </footer>
      </div>
    </div>
  )
}

export default LeaveRequests