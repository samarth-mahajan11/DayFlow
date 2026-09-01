import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Employees.css'

function Employees() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        employee_id,
        full_name,
        email,
        phone,
        address,
        department,
        position,
        joining_date,
        role
      `)
      .eq('role', 'employee')
      .order('employee_id', { ascending: true })

    if (fetchError) {
      console.error('EMPLOYEES FETCH ERROR:', fetchError)
      setError(fetchError.message)
      setEmployees([])
      setLoading(false)
      return
    }

    setEmployees(data || [])
    setLoading(false)
  }

  const formatDate = (date) => {
    if (!date) return 'Not available'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getInitials = (name) => {
    if (!name) return '?'

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('')
  }

  if (loading) {
    return (
      <div className="employees-page">
        <div className="employees-shell">
          <div className="employees-loading">
            <div className="employees-loading-mark">
              D
            </div>

            <div>
              <strong>Loading employees</strong>
              <span>
                Fetching workforce information...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="employees-page">
      <div className="employees-shell">

        {/* HEADER */}
        <header className="employees-header">
          <div className="employees-brand">
            <span className="employees-eyebrow">
              WORKFORCE MANAGEMENT
            </span>

            <h1>DayFlow</h1>

            <p>
              Manage employee records and workforce information.
            </p>
          </div>

          <button
            type="button"
            className="employees-back-button"
            onClick={() =>
              navigate('/hr/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}
        <section className="employees-intro">
          <div>
            <span className="employees-section-label">
              PEOPLE
            </span>

            <h2>Employees</h2>

            <p>
              View and manage employee information across the organization.
            </p>
          </div>

          <div className="employees-count">
            <strong>{employees.length}</strong>
            <span>Total Employees</span>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="employees-alert">
            <div className="employees-alert-icon">
              !
            </div>

            <div>
              <strong>Unable to load employees</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={fetchEmployees}
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPLOYEE LIST */}
        <section className="employees-section">
          <div className="employees-section-heading">
            <div>
              <span className="employees-section-label">
                DIRECTORY
              </span>

              <h3>Employee Directory</h3>

              <p>
                Select an employee to view their complete profile.
              </p>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="employees-empty">
              <div className="employees-empty-icon">
                👥
              </div>

              <h3>No employees found</h3>

              <p>
                There are currently no employee records available.
              </p>
            </div>
          ) : (
            <div className="employees-table-wrapper">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Email</th>
                    <th>Joining Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>

                      {/* EMPLOYEE */}
                      <td>
                        <div className="employee-person">
                          <div className="employee-avatar">
                            {getInitials(
                              employee.full_name
                            )}
                          </div>

                          <div className="employee-person-info">
                            <strong>
                              {employee.full_name ||
                                'Unnamed Employee'}
                            </strong>

                            <span>
                              {employee.phone ||
                                'Phone not provided'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td>
                        <span className="employee-id">
                          {employee.employee_id ||
                            '--'}
                        </span>
                      </td>

                      {/* DEPARTMENT */}
                      <td>
                        <span className="employee-department">
                          {employee.department ||
                            'Not assigned'}
                        </span>
                      </td>

                      {/* POSITION */}
                      <td>
                        <span className="employee-position">
                          {employee.position ||
                            'Not assigned'}
                        </span>
                      </td>

                      {/* EMAIL */}
                      <td>
                        <span className="employee-email">
                          {employee.email || '--'}
                        </span>
                      </td>

                      {/* JOINING DATE */}
                      <td>
                        <span className="employee-date">
                          {formatDate(
                            employee.joining_date
                          )}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td>
                        <button
                          type="button"
                          className="employee-view-button"
                          onClick={() =>
                            navigate(
                              `/hr/employees/${employee.id}`
                            )
                          }
                        >
                          View
                          <span>→</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="employees-footer">
          <span>
            DayFlow HR Employee Directory
          </span>

        </footer>

      </div>
    </div>
  )
}

export default Employees