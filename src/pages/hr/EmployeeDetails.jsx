
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './EmployeeDetails.css'

function EmployeeDetails() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [employee, setEmployee] = useState(null)

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [joiningDate, setJoiningDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(`
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
      `)
      .eq('id', id)
      .eq('role', 'employee')
      .single()

    if (fetchError) {
      console.error('EMPLOYEE DETAILS ERROR:', fetchError)
      setError('Unable to load employee details.')
      setEmployee(null)
      setLoading(false)
      return
    }

    setEmployee(data)

    setPhone(data.phone || '')
    setAddress(data.address || '')
    setDepartment(data.department || '')
    setPosition(data.position || '')
    setJoiningDate(data.joining_date || '')

    setLoading(false)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: phone.trim(),
        address: address.trim(),
        department: department.trim(),
        position: position.trim(),
        joining_date: joiningDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('role', 'employee')
      .select(`
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
      `)
      .single()

    if (updateError) {
      console.error('EMPLOYEE UPDATE ERROR:', updateError)
      setError(updateError.message)
      setSaving(false)
      return
    }

    setEmployee(data)

    setPhone(data.phone || '')
    setAddress(data.address || '')
    setDepartment(data.department || '')
    setPosition(data.position || '')
    setJoiningDate(data.joining_date || '')

    setSuccess('Employee details updated successfully.')
    setSaving(false)
  }

  const formatDate = (date) => {
    if (!date) {
      return 'Not available'
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const getInitials = (name) => {
    if (!name) {
      return 'E'
    }

    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="employee-details-shell">
          <div className="employee-details-loading">
            <div className="employee-loading-mark">
              DF
            </div>

            <div>
              <strong>Loading employee</strong>
              <span>
                Fetching employee information...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !employee) {
    return (
      <div className="employee-details-page">
        <div className="employee-details-shell">
          <header className="employee-details-header">
            <div className="employee-details-brand">
              <span className="employee-details-eyebrow">
                WORKFORCE MANAGEMENT
              </span>

              <h1>DayFlow</h1>

              <p>
                Manage employee records and workforce
                information.
              </p>
            </div>
          </header>

          <main className="employee-details-error-page">
            <div className="employee-error-icon">
              !
            </div>

            <h2>Unable to load employee</h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                navigate('/hr/employees')
              }
            >
              ← Back to Employees
            </button>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="employee-details-page">
      <div className="employee-details-shell">

        {/* HEADER */}

        <header className="employee-details-header">
          <div className="employee-details-brand">
            <span className="employee-details-eyebrow">
              WORKFORCE MANAGEMENT
            </span>

            <h1>DayFlow</h1>

            <p>
              Manage employee records and workforce
              information.
            </p>
          </div>

          <button
            type="button"
            className="employee-back-button"
            onClick={() =>
              navigate('/hr/employees')
            }
          >
            ← Back to Employees
          </button>
        </header>

        {/* PAGE INTRO */}

        <section className="employee-details-intro">
          <div>
            <span className="employee-section-label">
              EMPLOYEE PROFILE
            </span>

            <h2>Employee Details</h2>

            <p>
              View and manage information for this
              employee.
            </p>
          </div>

          <div className="employee-status-badge">
            <span className="employee-status-dot" />
            Active Employee
          </div>
        </section>

        {/* ALERTS */}

        {error && (
          <div className="employee-alert employee-alert-error">
            <div className="employee-alert-icon">
              !
            </div>

            <div>
              <strong>Update failed</strong>
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
          <div className="employee-alert employee-alert-success">
            <div className="employee-alert-icon">
              ✓
            </div>

            <div>
              <strong>Changes saved</strong>
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

        <main className="employee-details-content">

          {/* EMPLOYEE SUMMARY */}

          <section className="employee-summary-card">
            <div className="employee-avatar">
              {getInitials(employee.full_name)}
            </div>

            <div className="employee-summary-main">
              <span className="employee-summary-label">
                EMPLOYEE
              </span>

              <h3>{employee.full_name}</h3>

              <p>{employee.email}</p>
            </div>

            <div className="employee-summary-meta">
              <div>
                <span>Employee ID</span>
                <strong>
                  {employee.employee_id}
                </strong>
              </div>

              <div>
                <span>Department</span>
                <strong>
                  {employee.department ||
                    'Not assigned'}
                </strong>
              </div>

              <div>
                <span>Position</span>
                <strong>
                  {employee.position ||
                    'Not assigned'}
                </strong>
              </div>
            </div>
          </section>

          {/* INFORMATION */}

          <section className="employee-info-section">
            <div className="employee-section-heading">
              <div>
                <span className="employee-section-label">
                  PROFILE INFORMATION
                </span>

                <h3>Employee Information</h3>

                <p>
                  Basic information associated with
                  this employee account.
                </p>
              </div>
            </div>

            <div className="employee-info-grid">

              <div className="employee-info-item">
                <span>Employee ID</span>
                <strong>
                  {employee.employee_id}
                </strong>
              </div>

              <div className="employee-info-item">
                <span>Full Name</span>
                <strong>
                  {employee.full_name}
                </strong>
              </div>

              <div className="employee-info-item">
                <span>Email Address</span>
                <strong>
                  {employee.email}
                </strong>
              </div>

              <div className="employee-info-item">
                <span>Account Role</span>
                <strong className="role-badge">
                  {employee.role}
                </strong>
              </div>

            </div>
          </section>

          {/* EDIT FORM */}

          <section className="employee-edit-section">
            <div className="employee-section-heading">
              <div>
                <span className="employee-section-label">
                  MANAGEMENT
                </span>

                <h3>Edit Employee Details</h3>

                <p>
                  Update contact and organizational
                  information for this employee.
                </p>
              </div>
            </div>

            <form
              className="employee-edit-card"
              onSubmit={handleSave}
            >
              <div className="employee-form-grid">

                <div className="employee-field">
                  <label htmlFor="phone">
                    Phone Number
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
                </div>

                <div className="employee-field">
                  <label htmlFor="department">
                    Department
                  </label>

                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(event) =>
                      setDepartment(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div className="employee-field">
                  <label htmlFor="position">
                    Position
                  </label>

                  <input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(event) =>
                      setPosition(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div className="employee-field">
                  <label htmlFor="joiningDate">
                    Joining Date
                  </label>

                  <input
                    id="joiningDate"
                    type="date"
                    value={joiningDate}
                    onChange={(event) =>
                      setJoiningDate(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="employee-field employee-field-full">
                  <label htmlFor="address">
                    Address
                  </label>

                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="Enter employee address"
                    rows="4"
                  />
                </div>

              </div>

              <div className="employee-form-footer">
                <p>
                  Changes will be saved to the employee
                  profile.
                </p>

                <button
                  type="submit"
                  className="employee-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving Changes...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* CURRENT DETAILS */}

          <section className="employee-current-section">
            <div className="employee-section-heading">
              <div>
                <span className="employee-section-label">
                  CURRENT RECORD
                </span>

                <h3>Current Employee Details</h3>

                <p>
                  Latest information stored in the
                  employee profile.
                </p>
              </div>
            </div>

            <div className="employee-current-grid">

              <div className="employee-current-item">
                <span>Phone</span>
                <strong>
                  {employee.phone ||
                    'Not provided'}
                </strong>
              </div>

              <div className="employee-current-item">
                <span>Department</span>
                <strong>
                  {employee.department ||
                    'Not assigned'}
                </strong>
              </div>

              <div className="employee-current-item">
                <span>Position</span>
                <strong>
                  {employee.position ||
                    'Not assigned'}
                </strong>
              </div>

              <div className="employee-current-item">
                <span>Joining Date</span>
                <strong>
                  {formatDate(
                    employee.joining_date
                  )}
                </strong>
              </div>

              <div className="employee-current-item employee-current-full">
                <span>Address</span>
                <strong>
                  {employee.address ||
                    'Not provided'}
                </strong>
              </div>

            </div>
          </section>

        </main>

        {/* FOOTER */}

        <footer className="employee-details-footer">
          <span>
            DayFlow HR Employee Management
          </span>

          <button
            type="button"
            onClick={() =>
              navigate('/hr/dashboard')
            }
          >
            HR Dashboard
          </button>
        </footer>

      </div>
    </div>
  )
}

export default EmployeeDetails
