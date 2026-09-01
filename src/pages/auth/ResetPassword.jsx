
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session && mounted) {
        setHasRecoverySession(true)
        setCheckingSession(false)
        return
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event)

          if (
            event === 'PASSWORD_RECOVERY' &&
            session &&
            mounted
          ) {
            setHasRecoverySession(true)
            setCheckingSession(false)
          }
        }
      )

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (mounted) {
        setHasRecoverySession(!!currentSession)
        setCheckingSession(false)
      }

      return () => {
        subscription.unsubscribe()
      }
    }

    checkRecoverySession()

    return () => {
      mounted = false
    }
  }, [])

  const handleUpdatePassword = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!hasRecoverySession) {
      setError(
        'Password reset session is missing. Please open the reset link from your email again.'
      )
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error('Password update error:', error)
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Password updated successfully. Redirecting to login...'
    )

    setLoading(false)

    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  if (checkingSession) {
    return (
      <div className="auth-page">
        <div className="auth-background-glow glow-one" />
        <div className="auth-background-glow glow-two" />

        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">D</div>

            <div>
              <h1>DayFlow</h1>
              <span>Employee Management System</span>
            </div>
          </div>

          <div className="auth-icon">🔐</div>

          <div className="auth-heading">
            <span className="auth-eyebrow">
              SECURITY CHECK
            </span>

            <h2>Reset Password</h2>

            <p>
              Verifying your password recovery session...
            </p>
          </div>

          <div className="auth-loading">
            <div className="large-spinner" />
            <span>Verifying secure session</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-background-glow glow-one" />
      <div className="auth-background-glow glow-two" />

      <div className="auth-card">

        {/* BRAND */}

        <div className="auth-brand">
          <div className="auth-logo">
            D
          </div>

          <div>
            <h1>DayFlow</h1>
            <span>Employee Management System</span>
          </div>
        </div>

        {/* ICON */}

        <div className="auth-icon">
          🔐
        </div>

        {/* HEADING */}

        <div className="auth-heading">
          <span className="auth-eyebrow">
            ACCOUNT SECURITY
          </span>

          <h2>
            Create a new password
          </h2>

          <p>
            Choose a strong password to keep your
            DayFlow account secure.
          </p>
        </div>

        {/* SESSION WARNING */}

        {!hasRecoverySession && (
          <div className="auth-alert auth-alert-error">
            <span>!</span>

            <p>
              Your password reset session could not be
              found. Please open the latest reset email
              again.
            </p>
          </div>
        )}

        {/* FORM */}

        <form
          className="auth-form"
          onSubmit={handleUpdatePassword}
        >

          <div className="auth-field">
            <label htmlFor="password">
              New Password
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                🔒
              </span>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your new password"
                minLength="8"
                required
                disabled={!hasRecoverySession}
              />
            </div>

            <span className="password-hint">
              Minimum 8 characters
            </span>
          </div>

          <div className="auth-field password-confirm-field">
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                ✓
              </span>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm your new password"
                minLength="8"
                required
                disabled={!hasRecoverySession}
              />
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="auth-alert auth-alert-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="auth-alert auth-alert-success">
              <span>✓</span>

              <p>{message}</p>
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="auth-primary-button"
            disabled={
              loading ||
              !hasRecoverySession
            }
          >
            {loading ? (
              <>
                <span className="button-spinner" />
                Updating Password...
              </>
            ) : (
              <>
                Update Password
                <span>→</span>
              </>
            )}
          </button>

        </form>

        {/* BACK */}

        <button
          type="button"
          className="auth-back-button"
          onClick={() => navigate('/login')}
        >
          <span>←</span>
          Back to Login
        </button>

        {/* FOOTER */}

        <div className="auth-footer">
          <span className="security-dot" />
          Secure password recovery
        </div>

      </div>
    </div>
  )
}

export default ResetPassword
