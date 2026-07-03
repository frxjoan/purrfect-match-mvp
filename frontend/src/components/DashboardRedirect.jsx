import { Navigate } from 'react-router-dom'
import { getRoleDashboard } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'

function DashboardRedirect() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate replace state={{ from: '/dashboard' }} to="/login" />
  }

  return <Navigate replace to={getRoleDashboard(currentUser.role)} />
}

export default DashboardRedirect
