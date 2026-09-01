
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Payroll.css'

function Payroll() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [payroll, setPayroll] = useState([])

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employeeDropdownOpen, setEmployeeDropdownOpen] =
    useState(false)

  const [basicSalary, setBasicSalary] = useState('')
  const [allowances, setAllowances] = useState('')
  const [deductions, setDeductions] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = async () => {
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
      data: employeeData,
      error: employeeError,
    } = await supabase
      .from('profiles')
      .select(
        'id, employee_id, full_name, email, role'
      )
      .eq('role', 'employee')
      .order('employee_id')

    if (employeeError) {
      console.error(
        'EMPLOYEE FETCH ERROR:',
        employeeError
      )

      setError(employeeError.message)
      setLoading(false)
      return
    }

    const {
      data: payrollData,
      error: payrollError,
    } = await supabase
      .from('payroll')
      .select(
        'id, employee_id, basic_salary, allowances, deductions, net_salary, effective_from, created_at, updated_at'
      )
      .order('effective_from', {
        ascending: false,
      })

    if (payrollError) {
      console.error(
        'PAYROLL FETCH ERROR:',
        payrollError
      )

      setError(payrollError.message)
      setLoading(false)
      return
    }

    setEmployees(employeeData || [])
    setPayroll(payrollData || [])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId)
    setEmployeeDropdownOpen(false)

    setError('')
    setMessage('')

    const existingPayroll = payroll.find(
      (record) =>
        record.employee_id === employeeId
    )

    if (existingPayroll) {
      setBasicSalary(
        existingPayroll.basic_salary ?? ''
      )

      setAllowances(
        existingPayroll.allowances ?? ''
      )

      setDeductions(
        existingPayroll.deductions ?? ''
      )

      setEffectiveFrom(
        existingPayroll.effective_from || ''
      )
    } else {
      setBasicSalary('')
      setAllowances('')
      setDeductions('')
      setEffectiveFrom('')
    }
  }

  const selectedEmployeeData = employees.find(
    (employee) =>
      employee.id === selectedEmployee
  )

  const estimatedNetSalary =
    Number(basicSalary || 0) +
    Number(allowances || 0) -
    Number(deductions || 0)

  const handleSave = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!selectedEmployee) {
      setError('Please select an employee.')
      return
    }

    if (!effectiveFrom) {
      setError('Please select an effective date.')
      return
    }

    const basic = Number(basicSalary || 0)
    const allowance = Number(allowances || 0)
    const deduction = Number(deductions || 0)

    if (
      basic < 0 ||
      allowance < 0 ||
      deduction < 0
    ) {
      setError(
        'Salary values cannot be negative.'
      )
      return
    }

    setSaving(true)

    const existingPayroll = payroll.find(
      (record) =>
        record.employee_id === selectedEmployee
    )

    let result

    if (existingPayroll) {
      result = await supabase
        .from('payroll')
        .update({
          basic_salary: basic,
          allowances: allowance,
          deductions: deduction,
          effective_from: effectiveFrom,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayroll.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('payroll')
        .insert({
          employee_id: selectedEmployee,
          basic_salary: basic,
          allowances: allowance,
          deductions: deduction,
          effective_from: effectiveFrom,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error(
        'PAYROLL SAVE ERROR:',
        result.error
      )

      setError(result.error.message)
      setSaving(false)
      return
    }

    setMessage(
      existingPayroll
        ? 'Payroll updated successfully.'
        : 'Payroll created successfully.'
    )

    await loadData()

    setSaving(false)
  }

  const handleDelete = async (payrollId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this payroll record?'
    )

    if (!confirmed) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } =
      await supabase
        .from('payroll')
        .delete()
        .eq('id', payrollId)

    if (deleteError) {
      console.error(
        'PAYROLL DELETE ERROR:',
        deleteError
      )

      setError(deleteError.message)
      return
    }

    setMessage(
      'Payroll deleted successfully.'
    )

    setSelectedEmployee('')
    setEmployeeDropdownOpen(false)
    setBasicSalary('')
    setAllowances('')
    setDeductions('')
    setEffectiveFrom('')

    await loadData()
  }

  const formatMoney = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  const formatDate = (date) => {
    if (!date) {
      return '--'
    }

    const parsedDate = new Date(`${date}T00:00:00`)

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="payroll-page">
        <div className="payroll-loading">
          <div className="payroll-loading-icon">
            ₹
          </div>

          <h2>Loading Payroll</h2>

          <p>
            Please wait while payroll records are
            being loaded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="payroll-page">
      <header className="payroll-header">
        <div>
          <span className="payroll-eyebrow">
            SALARY MANAGEMENT
          </span>

          <h1>DayFlow</h1>

          <p>
            Manage employee compensation and payroll
            records.
          </p>
        </div>

        <button
          type="button"
          className="payroll-back-button"
          onClick={() =>
            navigate('/hr/dashboard')
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="payroll-content">
        <section className="payroll-page-heading">
          <div>
            <span className="payroll-section-label">
              SALARY SETUP
            </span>

            <h2>
              Add / Update Employee Salary
            </h2>

            <p>
              Select an employee and configure their
              compensation.
            </p>
          </div>
        </section>

        {error && (
          <div className="payroll-alert payroll-alert-error">
            <span>!</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {message && (
          <div className="payroll-alert payroll-alert-success">
            <span>✓</span>
            <div>
              <strong>Success</strong>
              <p>{message}</p>
            </div>
          </div>
        )}

        <section className="payroll-form-card">
          <div className="payroll-card-heading">
            <div className="payroll-card-icon">
              ₹
            </div>

            <div>
              <h3>Employee Compensation</h3>

              <p>
                Salary information is securely stored
                in DayFlow.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="payroll-form-group payroll-full-width">
              <label htmlFor="employeeDropdown">
                Employee <span>*</span>
              </label>

              <div className="employee-dropdown">
                <button
                  id="employeeDropdown"
                  type="button"
                  className={`employee-dropdown-button ${
                    employeeDropdownOpen
                      ? 'is-open'
                      : ''
                  }`}
                  onClick={() =>
                    setEmployeeDropdownOpen(
                      (previous) => !previous
                    )
                  }
                  aria-expanded={
                    employeeDropdownOpen
                  }
                >
                  <span
                    className={
                      selectedEmployee
                        ? 'selected-value'
                        : 'placeholder-value'
                    }
                  >
                    {selectedEmployeeData
                      ? `${selectedEmployeeData.employee_id} - ${selectedEmployeeData.full_name}`
                      : 'Select Employee'}
                  </span>

                  <span className="employee-dropdown-arrow">
                    {employeeDropdownOpen
                      ? '▲'
                      : '▼'}
                  </span>
                </button>

                {employeeDropdownOpen && (
                  <div className="employee-dropdown-menu">
                    <div className="employee-dropdown-title">
                      Select Employee
                    </div>

                    {employees.length === 0 ? (
                      <div className="employee-dropdown-empty">
                        No employees available
                      </div>
                    ) : (
                      employees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className={`employee-dropdown-option ${
                            selectedEmployee ===
                            employee.id
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            handleEmployeeChange(
                              employee.id
                            )
                          }
                        >
                          <span className="employee-option-avatar">
                            {employee.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || 'E'}
                          </span>

                          <span className="employee-option-info">
                            <strong>
                              {employee.full_name}
                            </strong>

                            <small>
                              {employee.employee_id}
                              {employee.department
                                ? ` • ${employee.department}`
                                : ''}
                            </small>
                          </span>

                          {selectedEmployee ===
                            employee.id && (
                            <span className="employee-option-check">
                              ✓
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="payroll-form-grid">
              <div className="payroll-form-group">
                <label htmlFor="basicSalary">
                  Basic Salary <span>₹</span>
                </label>

                <div className="payroll-input-wrapper">
                  <span>₹</span>

                  <input
                    id="basicSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    onChange={(event) =>
                      setBasicSalary(
                        event.target.value
                      )
                    }
                    placeholder="Enter basic salary"
                  />
                </div>
              </div>

              <div className="payroll-form-group">
                <label htmlFor="allowances">
                  Allowances <span>₹</span>
                </label>

                <div className="payroll-input-wrapper">
                  <span>₹</span>

                  <input
                    id="allowances"
                    type="number"
                    min="0"
                    step="0.01"
                    value={allowances}
                    onChange={(event) =>
                      setAllowances(
                        event.target.value
                      )
                    }
                    placeholder="Enter allowances"
                  />
                </div>
              </div>

              <div className="payroll-form-group">
                <label htmlFor="deductions">
                  Deductions <span>₹</span>
                </label>

                <div className="payroll-input-wrapper">
                  <span>₹</span>

                  <input
                    id="deductions"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions}
                    onChange={(event) =>
                      setDeductions(
                        event.target.value
                      )
                    }
                    placeholder="Enter deductions"
                  />
                </div>
              </div>

              <div className="payroll-form-group">
                <label htmlFor="effectiveFrom">
                  Effective From
                </label>

                <input
                  id="effectiveFrom"
                  className="payroll-input"
                  type="date"
                  value={effectiveFrom}
                  onChange={(event) =>
                    setEffectiveFrom(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="payroll-net-salary">
              <div>
                <span>
                  Estimated Net Salary
                </span>

                <small>
                  Basic salary + allowances -
                  deductions
                </small>
              </div>

              <strong>
                {formatMoney(
                  estimatedNetSalary
                )}
              </strong>
            </div>

            <div className="payroll-form-actions">
              <button
                type="submit"
                className="payroll-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Payroll'}
              </button>
            </div>
          </form>
        </section>

        <section className="payroll-records-section">
          <div className="payroll-section-heading-row">
            <div>
              <span className="payroll-section-label">
                PAYROLL RECORDS
              </span>

              <h2>Employee Payroll</h2>

              <p>
                View and manage existing compensation
                records.
              </p>
            </div>

            <div className="payroll-record-count">
              {payroll.length}
              <span>Records</span>
            </div>
          </div>

          {payroll.length === 0 ? (
            <div className="payroll-empty-state">
              <div>₹</div>

              <h3>No payroll records yet</h3>

              <p>
                Select an employee above to create
                their first payroll record.
              </p>
            </div>
          ) : (
            <div className="payroll-table-wrapper">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Effective From</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {payroll.map((record) => {
                    const employee =
                      employees.find(
                        (item) =>
                          item.id ===
                          record.employee_id
                      )

                    return (
                      <tr key={record.id}>
                        <td>
                          <div className="payroll-employee-cell">
                            <div className="payroll-employee-avatar">
                              {employee?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                'E'}
                            </div>

                            <div>
                              <strong>
                                {employee?.full_name ||
                                  '--'}
                              </strong>

                              <small>
                                {employee?.employee_id ||
                                  '--'}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="payroll-email">
                            {employee?.email ||
                              '--'}
                          </span>
                        </td>

                        <td>
                          {formatMoney(
                            record.basic_salary
                          )}
                        </td>

                        <td className="payroll-positive">
                          +{formatMoney(
                            record.allowances
                          )}
                        </td>

                        <td className="payroll-negative">
                          -{formatMoney(
                            record.deductions
                          )}
                        </td>

                        <td>
                          <strong className="payroll-net-value">
                            {formatMoney(
                              record.net_salary
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            record.effective_from
                          )}
                        </td>

                        <td>
                          <div className="payroll-actions">
                            <button
                              type="button"
                              className="payroll-edit-button"
                              onClick={() =>
                                handleEmployeeChange(
                                  record.employee_id
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="payroll-delete-button"
                              onClick={() =>
                                handleDelete(
                                  record.id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="payroll-footer">
        <span>
          DayFlow HR Payroll Management
        </span>

        <span>
          {payroll.length}{' '}
          {payroll.length === 1
            ? 'record'
            : 'records'}
        </span>
      </footer>
    </div>
  )
}

export default Payroll
