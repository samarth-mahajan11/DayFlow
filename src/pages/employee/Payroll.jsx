
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Payroll.css'

function Payroll() {
  const navigate = useNavigate()

  const [payroll, setPayroll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPayroll()
  }, [])

  const loadPayroll = async () => {
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
      data,
      error: payrollError,
    } = await supabase
      .from('payroll')
      .select(`
        id,
        employee_id,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        effective_from
      `)
      .eq('employee_id', user.id)
      .order('effective_from', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (payrollError) {
      console.error(
        'EMPLOYEE PAYROLL ERROR:',
        payrollError
      )

      setError(payrollError.message)
      setLoading(false)
      return
    }

    setPayroll(data)
    setLoading(false)
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

  const formatDate = (dateString) => {
    if (!dateString) {
      return '--'
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const grossSalary = payroll
    ? Number(payroll.basic_salary || 0) +
      Number(payroll.allowances || 0)
    : 0

  if (loading) {
    return (
      <div className="payroll-page">
        <div className="payroll-shell">
          <div className="payroll-loading">
            <div className="payroll-loading-icon">
              ₹
            </div>

            <div>
              <strong>Loading your payroll</strong>
              <span>
                Preparing your salary information...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payroll-page">
      <div className="payroll-shell">

        {/* HEADER */}

        <header className="payroll-header">
          <div className="payroll-brand">
            <span className="payroll-eyebrow">
              EMPLOYEE PORTAL
            </span>

            <h1>DayFlow</h1>

            <p>
              Your compensation and salary information.
            </p>
          </div>

          <button
            type="button"
            className="payroll-back-button"
            onClick={() =>
              navigate('/employee/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}

        <section className="payroll-intro">
          <div>
            <span className="payroll-section-label">
              FINANCIAL OVERVIEW
            </span>

            <h2>My Payroll</h2>

            <p>
              View your current salary structure and
              compensation details.
            </p>
          </div>

          <button
            type="button"
            className="payroll-refresh-button"
            onClick={loadPayroll}
          >
            ↻ Refresh
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <div className="payroll-alert">
            <span className="payroll-alert-icon">
              !
            </span>

            <div>
              <strong>
                Unable to load payroll
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* NO PAYROLL */}

        {!payroll ? (
          <section className="payroll-empty">
            <div className="payroll-empty-icon">
              ₹
            </div>

            <h3>No payroll information yet</h3>

            <p>
              Your salary information has not been
              added yet. Please contact HR if you
              believe this is incorrect.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/employee/dashboard')
              }
            >
              Return to Dashboard
            </button>
          </section>
        ) : (
          <>
            {/* NET SALARY HERO */}

            <section className="payroll-hero">
              <div className="payroll-hero-content">
                <div className="payroll-hero-top">
                  <div>
                    <span>
                      CURRENT NET SALARY
                    </span>

                    <h3>
                      {formatMoney(
                        payroll.net_salary
                      )}
                    </h3>
                  </div>

                  <div className="payroll-status">
                    <span>●</span>
                    Active
                  </div>
                </div>

                <div className="payroll-hero-bottom">
                  <div>
                    <span>
                      EFFECTIVE FROM
                    </span>

                    <strong>
                      {formatDate(
                        payroll.effective_from
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      PAYROLL STATUS
                    </span>

                    <strong>
                      Current
                    </strong>
                  </div>
                </div>
              </div>

              <div className="payroll-hero-symbol">
                ₹
              </div>
            </section>

            {/* SALARY BREAKDOWN */}

            <section className="payroll-section">
              <div className="payroll-section-heading">
                <div>
                  <span className="payroll-section-label">
                    COMPENSATION
                  </span>

                  <h3>Salary breakdown</h3>

                  <p>
                    A clear view of how your current
                    salary is structured.
                  </p>
                </div>
              </div>

              <div className="payroll-breakdown-grid">

                <div className="payroll-card payroll-basic-card">
                  <div className="payroll-card-icon">
                    ₹
                  </div>

                  <div>
                    <span>Basic Salary</span>

                    <strong>
                      {formatMoney(
                        payroll.basic_salary
                      )}
                    </strong>

                    <small>
                      Fixed salary component
                    </small>
                  </div>
                </div>

                <div className="payroll-card payroll-allowance-card">
                  <div className="payroll-card-icon">
                    +
                  </div>

                  <div>
                    <span>Allowances</span>

                    <strong>
                      {formatMoney(
                        payroll.allowances
                      )}
                    </strong>

                    <small>
                      Additional compensation
                    </small>
                  </div>
                </div>

                <div className="payroll-card payroll-deduction-card">
                  <div className="payroll-card-icon">
                    −
                  </div>

                  <div>
                    <span>Deductions</span>

                    <strong>
                      {formatMoney(
                        payroll.deductions
                      )}
                    </strong>

                    <small>
                      Total deductions
                    </small>
                  </div>
                </div>

              </div>
            </section>

            {/* GROSS VS NET */}

            <section className="payroll-section">
              <div className="payroll-section-heading">
                <div>
                  <span className="payroll-section-label">
                    SALARY SUMMARY
                  </span>

                  <h3>Compensation overview</h3>
                </div>
              </div>

              <div className="payroll-summary">

                <div className="payroll-summary-row">
                  <div>
                    <span>Gross Salary</span>

                    <small>
                      Basic salary + allowances
                    </small>
                  </div>

                  <strong>
                    {formatMoney(grossSalary)}
                  </strong>
                </div>

                <div className="payroll-summary-line" />

                <div className="payroll-summary-row payroll-deduction-row">
                  <div>
                    <span>Deductions</span>

                    <small>
                      Applied deductions
                    </small>
                  </div>

                  <strong>
                    − {formatMoney(
                      payroll.deductions
                    )}
                  </strong>
                </div>

                <div className="payroll-summary-total">
                  <div>
                    <span>Net Salary</span>

                    <small>
                      Final payable amount
                    </small>
                  </div>

                  <strong>
                    {formatMoney(
                      payroll.net_salary
                    )}
                  </strong>
                </div>

              </div>
            </section>

            {/* HR NOTICE */}

            <section className="payroll-notice">
              <div className="payroll-notice-icon">
                i
              </div>

              <div>
                <strong>
                  Payroll is managed by HR
                </strong>

                <p>
                  Your salary information is maintained
                  by the HR team. If you notice an
                  incorrect amount or have questions
                  about your compensation, please
                  contact HR.
                </p>
              </div>
            </section>
          </>
        )}

        {/* FOOTER */}

        <footer className="payroll-footer">
          <span>
            DayFlow Employee Portal
          </span>

         
        </footer>

      </div>
    </div>
  )
}

export default Payroll
