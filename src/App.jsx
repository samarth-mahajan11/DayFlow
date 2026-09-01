import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import VerifyEmail from './pages/auth/VerifyEmail'

import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import HRDashboard from './pages/hr/HRDashboard'
import Profile from './pages/employee/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Attendance from './pages/employee/Attendance'
import Leave from './pages/employee/Leave'
import LeaveRequests from './pages/hr/LeaveRequests'
import Employees from './pages/hr/Employees'
import EmployeeDetails from './pages/hr/EmployeeDetails'
import HRAttendance from './pages/hr/Attendance'
import EmployeePayroll from './pages/employee/Payroll'
import HRPayroll from './pages/hr/Payroll'
import EmployeeDocuments from './pages/employee/Documents'
import EmployeeNotifications from './pages/employee/Notifications'
import Reports from './pages/hr/Reports'
import Analytics from './pages/hr/Analytics'
import HRDocuments from './pages/hr/Documents'
import HRNotifications from './pages/hr/Notifications'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Employee */}

        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRole="employee">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/payroll"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeePayroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRole="employee">
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/leave"
          element={
            <ProtectedRoute allowedRole="employee">
              <Leave />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/notifications"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeNotifications />
            </ProtectedRoute>  
          }
        />

        {/* HR */}

        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRole="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/profile"
          element={
            <ProtectedRoute allowedRole="hr">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute allowedRole="hr">
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees/:id"
          element={
            <ProtectedRoute allowedRole="hr">
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute allowedRole="hr">
              <HRPayroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/leave-requests"
          element={
            <ProtectedRoute allowedRole="hr">
              <LeaveRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute allowedRole="hr">
              <HRAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/documents"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeDocuments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/reports"
          element={
           <ProtectedRoute allowedRole="hr">
              <Reports />
            </ProtectedRoute>
        }
        />

        {/* Default */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/hr/analytics"
          element={
           <ProtectedRoute allowedRole="hr">
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/documents"
          element={
             <ProtectedRoute allowedRole="hr">
              <HRDocuments />
            </ProtectedRoute>
        }
        />

        <Route
          path="/hr/notifications"
          element={
           <ProtectedRoute allowedRole="hr">
              <HRNotifications />
            </ProtectedRoute>
        }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App