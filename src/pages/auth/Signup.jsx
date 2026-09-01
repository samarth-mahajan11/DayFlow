
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'
import './Signup.css'

function SignUp() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (event) => {
    event.preventDefault()

    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      /*
        If email verification is enabled in Supabase,
        the user needs to verify their email first.
      */

      if (data?.user) {
        navigate('/verify-email', {
          state: {
            email: email.trim(),
          },
        })
      } else {
        setError('Account creation failed. Please try again.')
      }
    } catch (err) {
      setError(
        err?.message ||
          'Something went wrong while creating your account.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-background-shape signup-shape-one"></div>
      <div className="signup-background-shape signup-shape-two"></div>

      <main className="signup-container">

        <section className="signup-brand">
          <div className="signup-logo">
            D
          </div>

          <h1>DayFlow</h1>

          <p>
            Employee management made simple.
          </p>
        </section>

        <section className="signup-card">

          <div className="signup-heading">
            <span>GET STARTED</span>

            <h2>Create your account</h2>

            <p>
              Join DayFlow and manage your
              workplace experience.
            </p>
          </div>

          <form
            className="signup-form"
            onSubmit={handleSignUp}
          >

            <div className="signup-form-group">
              <label htmlFor="full-name">
                Full Name
              </label>

              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="signup-form-group">
              <label htmlFor="signup-email">
                Email Address
              </label>

              <input
                id="signup-email"
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

            <div className="signup-form-group">
              <label htmlFor="signup-password">
                Password
              </label>

              <div className="signup-password-wrapper">
                <input
                  id="signup-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="signup-form-group">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <div className="signup-password-wrapper">
                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-show-password"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? 'Hide'
                    : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="signup-error">
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading
                ? 'Creating account...'
                : 'Create Account'}

              {!loading && (
                <span className="signup-submit-arrow">
                  →
                </span>
              )}
            </button>

          </form>

          <div className="signup-divider">
            <span>Already have an account?</span>
          </div>

          <button
            type="button"
            className="signup-login-button"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>

        </section>

        <p className="signup-copyright">
          © 2026 DayFlow. All rights reserved.
        </p>

      </main>
    </div>
  )
}

export default SignUp
