import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function ProtectedRoute({ children, allowedRole }) {
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Unable to load user profile:', error)
        setLoading(false)
        return
      }

      setUserRole(profile.role)
      setLoading(false)
    }

    checkUser()
  }, [])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'employee') {
      return <Navigate to="/employee/dashboard" replace />
    }

    if (userRole === 'hr') {
      return <Navigate to="/hr/dashboard" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute