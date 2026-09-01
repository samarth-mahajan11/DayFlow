
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [profileImageError, setProfileImageError] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Unable to identify your account.')
      setLoading(false)
      return
    }

    const {
      data,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(
        `
        id,
        employee_id,
        full_name,
        email,
        phone,
        address,
        profile_picture,
        role,
        department,
        position,
        joining_date
        `
      )
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Profile loading failed:',
        profileError.message
      )

      setError('Unable to load your profile.')
      setLoading(false)
      return
    }

    if (!data) {
      setError('Profile information was not found.')
      setLoading(false)
      return
    }

    setProfile(data)
    setProfileImageError(false)

    setPhone(data.phone || '')
    setAddress(data.address || '')
    setProfilePicture(data.profile_picture || '')

    setLoading(false)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!profile) return

    setSaving(true)
    setMessage('')
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Your session has expired. Please login again.')
      setSaving(false)
      return
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from('profiles')
      .update({
        phone: phone.trim(),
        address: address.trim(),
        profile_picture: profilePicture.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error(
        'Profile update failed:',
        updateError.message
      )

      setError(
        'Unable to save your changes. Please try again.'
      )

      setSaving(false)
      return
    }

    setProfile(data)

    setPhone(data.phone || '')
    setAddress(data.address || '')
    setProfilePicture(data.profile_picture || '')

    setMessage('Profile updated successfully.')

    setSaving(false)
  }

  const formatJoiningDate = (date) => {
    if (!date) return 'Not available'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const getInitials = (name) => {
    if (!name) return 'U'

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="profile-page employee-profile-page">

        <div className="profile-loading-card">
          <div className="profile-loading-circle" />

          <div>
            <div className="profile-loading-line large" />
            <div className="profile-loading-line" />
          </div>
        </div>

      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page employee-profile-page">

        <div className="profile-error-card">

          <span className="profile-error-icon">
            !
          </span>

          <h2>
            Profile unavailable
          </h2>

          <p>
            {error || 'We could not load your profile.'}
          </p>

          <button
            type="button"
            className="profile-primary-button"
            onClick={() =>
              navigate('/employee/dashboard')
            }
          >
           ← Back to Dashboard
          </button>

        </div>

      </div>
    )
  }

  return (
    <div className="profile-page employee-profile-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="profile-page-header">

        <div>

          <span className="profile-eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal information and view
            your employment details.
          </p>

        </div>

        <button
          type="button"
          className="profile-back-button"
          onClick={() =>
            navigate('/employee/dashboard')
          }
        >
          ← Back to Dashboard
        </button>

      </header>


      <main className="profile-content">


        {/* =====================================
            PROFILE HERO
        ===================================== */}

        <section className="profile-hero-card">

          <div className="profile-avatar-wrapper">

           {profile.profile_picture && !profileImageError ? (
              <img
                src={profile.profile_picture}
                alt={profile.full_name || 'Employee'}
                className="profile-avatar-image"
                onError={() => setProfileImageError(true)}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {getInitials(profile.full_name)}
              </div>
            )}

          </div>


          <div className="profile-hero-info">

            <span className="profile-status">
              ACTIVE EMPLOYEE
            </span>

            <h2>
              {profile.full_name || 'Employee'}
            </h2>

            <p className="profile-position">
              {profile.position || 'Employee'}
              {profile.department
                ? ` · ${profile.department}`
                : ''}
            </p>

            <div className="profile-meta-row">

              <span>
                Employee ID
                <strong>
                  {profile.employee_id || '—'}
                </strong>
              </span>

              <span>
                Role
                <strong>
                  {profile.role || 'Employee'}
                </strong>
              </span>

            </div>

          </div>


          <div className="profile-hero-side">

            <span>
              Joined
            </span>

            <strong>
              {formatJoiningDate(
                profile.joining_date
              )}
            </strong>

          </div>

        </section>


        {/* =====================================
            PERSONAL INFORMATION
        ===================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div>

              <span className="profile-section-label">
                PERSONAL
              </span>

              <h3>
                Personal Information
              </h3>

              <p>
                Your basic account and contact details.
              </p>

            </div>

            <span className="read-only-label">
              Some fields are read-only
            </span>

          </div>


          <div className="profile-information-grid">


            <div className="profile-information-card">

              <span className="information-label">
                FULL NAME
              </span>

              <strong>
                {profile.full_name || '—'}
              </strong>

              <span className="information-note">
                Managed by HR
              </span>

            </div>


            <div className="profile-information-card">

              <span className="information-label">
                EMAIL
              </span>

              <strong>
                {profile.email || '—'}
              </strong>

              <span className="information-note">
                Account email
              </span>

            </div>


            <div className="profile-information-card editable-information">

              <label htmlFor="phone">
                PHONE NUMBER
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Enter phone number"
              />

              <span>
                Editable
              </span>

            </div>


            <div className="profile-information-card editable-information address-card">

              <label htmlFor="address">
                ADDRESS
              </label>

              <textarea
                id="address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Enter your address"
                rows={3}
              />

              <span>
                Editable
              </span>

            </div>

          </div>

        </section>


        {/* =====================================
            JOB INFORMATION
        ===================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div>

              <span className="profile-section-label">
                EMPLOYMENT
              </span>

              <h3>
                Job Information
              </h3>

              <p>
                Your current role and organizational details.
              </p>

            </div>

            <span className="read-only-label">
              Read only
            </span>

          </div>


          <div className="job-information-grid">

            <div className="job-information-item">

              <span>
                POSITION
              </span>

              <strong>
                {profile.position || 'Not assigned'}
              </strong>

            </div>


            <div className="job-information-item">

              <span>
                DEPARTMENT
              </span>

              <strong>
                {profile.department || 'Not assigned'}
              </strong>

            </div>


            <div className="job-information-item">

              <span>
                EMPLOYEE ID
              </span>

              <strong>
                {profile.employee_id || '—'}
              </strong>

            </div>


            <div className="job-information-item">

              <span>
                JOINING DATE
              </span>

              <strong>
                {formatJoiningDate(
                  profile.joining_date
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =====================================
            PROFILE PICTURE
        ===================================== */}

        <section className="profile-section">

          <div className="profile-section-heading">

            <div>

              <span className="profile-section-label">
                APPEARANCE
              </span>

              <h3>
                Profile Picture
              </h3>

              <p>
                Add a profile image that will appear
                across your employee portal.
              </p>

            </div>

          </div>


          <div className="profile-picture-editor">

            <div className="picture-preview">

              {profilePicture ? (

                <img
                  src={profilePicture}
                  alt="Profile preview"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />

              ) : (

                <span>
                  {getInitials(profile.full_name)}
                </span>

              )}

            </div>


            <div className="picture-editor-content">

              <label htmlFor="profilePicture">
                PROFILE IMAGE URL
              </label>

              <input
                id="profilePicture"
                type="url"
                value={profilePicture}
                onChange={(event) =>
                  setProfilePicture(
                    event.target.value
                  )
                }
                placeholder="https://example.com/photo.jpg"
              />

              <small>
                Use a publicly accessible image URL.
              </small>

            </div>

          </div>

        </section>


        {/* =====================================
            SAVE AREA
        ===================================== */}

        <section className="profile-save-section">

          <div>

            {message && (
              <div className="profile-success">
                ✓ {message}
              </div>
            )}

            {error && (
              <div className="profile-error">
                ! {error}
              </div>
            )}

          </div>


          <div className="profile-save-actions">

            <button
              type="button"
              className="profile-secondary-button"
              onClick={() =>
                navigate('/employee/dashboard')
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="profile-primary-button"
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </div>

        </section>

      </main>

    </div>
  )
}

export default Profile