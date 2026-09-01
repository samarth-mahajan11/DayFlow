
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ForgotPassword.css'

function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetRequest = async (event) => {
    event.preventDefault()

    setMessage('')
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        )

      if (resetError) {
        console.error(
          'Password reset request failed:',
          resetError
        )

        setError(resetError.message)
        return
      }

      setMessage(
        'Password reset link has been sent to your email. Please check your inbox.'
      )
    } catch (err) {
      console.error(
        'Password reset request failed:',
        err
      )

      setError(
        err?.message ||
          'Unable to send the password reset link. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-glow forgot-password-glow-one" />
      <div className="forgot-password-glow forgot-password-glow-two" />

      <main className="forgot-password-card">
        {/* BRAND */}
        <div className="forgot-password-brand">
          <div className="forgot-password-logo">
            D
          </div>

          <div>
            <h1>DayFlow</h1>
            <span>Employee Management System</span>
          </div>
        </div>

        {/* ICON */}
        <div className="forgot-password-icon">
          🔐
        </div>

        {/* HEADING */}
        <div className="forgot-password-heading">
          <span className="forgot-password-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h2>Forgot your password?</h2>

          <p>
            No worries. Enter your registered email
            address and we'll send you a secure link
            to reset your password.
          </p>
        </div>

        {/* FORM */}
        <form
          className="forgot-password-form"
          onSubmit={handleResetRequest}
        >
          <div className="forgot-password-field">
            <label htmlFor="forgot-password-email">
              Email Address
            </label>

            <div className="forgot-password-input-wrapper">
              <span
                className="forgot-password-input-icon"
                aria-hidden="true"
              >
                ✉
              </span>

              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your registered email"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="forgot-password-alert forgot-password-alert-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="forgot-password-alert forgot-password-alert-success">
              <span>✓</span>

              <p>{message}</p>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="forgot-password-primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="forgot-password-spinner" />
                Sending reset link...
              </>
            ) : (
              <>
                Send Reset Link
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* BACK */}
        <button
          type="button"
          className="forgot-password-back-button"
          onClick={() => navigate('/login')}
        >
          <span>←</span>
          Back to Login
        </button>

        {/* FOOTER */}
        <div className="forgot-password-footer">
          <span className="forgot-password-security-dot" />
          Secure password recovery powered by DayFlow
        </div>
      </main>
    </div>
  )
}

export default ForgotPassword
