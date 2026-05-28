import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

// role can be 'customer' | 'breeder' | 'admin' or undefined for any authenticated user
function ProtectedRoute({ children, role }) {
  const { currentUser } = useContext(AuthContext)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (role && currentUser?.role !== role) {
    // For now, redirect to root if role mismatch. This will be extended later.
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
