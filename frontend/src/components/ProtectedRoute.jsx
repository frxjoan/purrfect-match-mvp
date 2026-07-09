import { Navigate, useLocation } from 'react-router-dom'
import { getRoleDashboard } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'

/**
 * Frontend route permission matrix.
 *
 * The backend still enforces real security with JWT and role checks. This map
 * keeps users out of screens they should not be able to navigate to from the
 * React app.
 */
const roleAccess = {
  customer: ['customer', 'breeder', 'admin'],
  breeder: ['breeder', 'admin'],
  admin: ['admin'],
}

/**
 * Guards a route based on the authenticated user's role.
 *
 * When no user is logged in, the attempted URL is stored in router state and
 * the user is sent to Login. When the role is insufficient, the user is sent
 * to Unauthorized with the attempted route and their role dashboard.
 *
 * @param {{ allowedRole?: 'customer'|'breeder'|'admin', children: import('react').ReactNode }} props - Route guard props.
 * @returns {JSX.Element} Protected content or a redirect.
 */
function ProtectedRoute({ allowedRole = 'customer', children }) {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  const allowedRoles = roleAccess[allowedRole] ?? roleAccess.customer

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Navigate
        replace
        state={{
          attempted: location.pathname,
          dashboard: getRoleDashboard(currentUser.role),
        }}
        to="/unauthorized"
      />
    )
  }
  return children
}

export default ProtectedRoute
