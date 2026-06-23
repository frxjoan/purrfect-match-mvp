import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

const publicNavigation = [
  { to: '/', label: 'Home' },
  { to: '/customer/listings', label: 'Listings' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

const roleNavigation = {
  customer: [
    { to: '/customer/dashboard', label: 'Dashboard' },
    { to: '/customer/listings', label: 'Listings' },
    { to: '/customer/messages', label: 'Messages' },
    { to: '/customer/profile', label: 'Profile' },
  ],
  breeder: [
    { to: '/breeder/dashboard', label: 'Breeder Dashboard' },
    { to: '/breeder/listings', label: 'My Listings' },
    { to: '/breeder/certification', label: 'Certification' },
    { to: '/breeder/messages', label: 'Breeder Messages' },
    { to: '/customer/listings', label: 'Browse' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Admin Dashboard' },
    { to: '/admin/verifications', label: 'Verifications' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/breeder/dashboard', label: 'Breeder Area' },
    { to: '/customer/listings', label: 'Listings' },
  ],
}

function MainLayout({ children }) {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const navigation = currentUser ? roleNavigation[currentUser.role] ?? roleNavigation.customer : publicNavigation

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-lg font-bold text-slate-950">Purrfect Match</p>
            <p className="text-sm text-slate-500">Trusted cats, breeders, and conversations.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 font-medium transition',
                    isActive ? 'bg-teal-700 text-white shadow-sm' : 'hover:bg-teal-50 hover:text-teal-800',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
            {currentUser ? (
              <>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {currentUser.role}
                </span>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  )
}

export default MainLayout
