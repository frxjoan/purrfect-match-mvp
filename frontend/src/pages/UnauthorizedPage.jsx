import { useLocation } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import PageHero from '../components/PageHero.jsx'
import { getRoleDashboard } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'

function UnauthorizedPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const dashboard = location.state?.dashboard ?? getRoleDashboard(currentUser?.role)
  const attempted = location.state?.attempted

  return (
    <PageHero
      eyebrow="Access limited"
      title="You cannot open that area with this role"
      description={
        attempted
          ? `Your current role does not have access to ${attempted}.`
          : 'Your current role does not have access to that page.'
      }
    >
      <div className="flex flex-wrap gap-3">
        <ActionButton to={dashboard}>Go to my dashboard</ActionButton>
        <ActionButton to="/customer/listings" variant="secondary">Browse public listings</ActionButton>
      </div>
    </PageHero>
  )
}

export default UnauthorizedPage
