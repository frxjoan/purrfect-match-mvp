import { Navigate, useLocation } from 'react-router-dom'
import { getRoleDashboard } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'

const roleAccess = {
  customer: ['customer', 'breeder', 'admin'],
  breeder: ['breeder', 'admin'],
  admin: ['admin'],
}

function ProtectedRoute({ allowedRole = 'customer', children }) {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  const allowedRoles = roleAccess[allowedRole] ?? roleAccess.customer

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate replace to={getRoleDashboard(currentUser.role)} />
  }

  // TODO: Replace demo role checks with backend-backed auth once /api/v1/auth/me is wired.
  return children
}

export default ProtectedRoute
