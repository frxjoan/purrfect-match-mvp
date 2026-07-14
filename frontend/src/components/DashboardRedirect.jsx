import { Navigate } from 'react-router-dom'
import { getPostLoginRedirect } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'

function DashboardRedirect() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate replace state={{ from: '/dashboard' }} to="/login" />
  }

  return <Navigate replace to={getPostLoginRedirect(currentUser)} />
}

export default DashboardRedirect