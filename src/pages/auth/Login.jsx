
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        setError('Unable to load your profile.')
        setLoading(false)
        return
      }

      if (profile.role === 'employee') {
        navigate('/employee/dashboard')
      } else if (profile.role === 'hr') {
        navigate('/hr/dashboard')
      } else {
        setError('Invalid user role.')
      }
    }

    setLoading(false)
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  return (
    <div className="login-page">
      <div className="login-background-shape shape-one"></div>
      <div className="login-background-shape shape-two"></div>

      <main className="login-container">
        <section className="login-brand">
          <div className="login-logo">
            D
          </div>

          <h1>DayFlow</h1>

          <p>
            Employee management made simple.
          </p>
        </section>

        <section className="login-card">
          <div className="login-heading">
            <span>WELCOME BACK</span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your credentials to continue
              to DayFlow.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <div className="login-form-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-form-group">
              <div className="login-password-label">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="login-forgot-link"
                >
                  Forgot password?
                </button>
              </div>

              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}

              {!loading && (
                <span className="login-submit-arrow">
                  →
                </span>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>Secure access</span>
          </div>

          <p className="login-footer-text">
            DayFlow securely manages your
            employee information and workplace
            operations.
          </p>
        </section>

        <p className="login-copyright">
          © 2026 DayFlow. All rights reserved.
        </p>
      </main>
    </div>
  )
}

export default Login
