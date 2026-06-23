import { useState } from 'react'
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
    { to: '/customer/saved', label: 'Saved' },
    { to: '/customer/messages', label: 'Messages' },
    { to: '/customer/profile', label: 'Profile' },
    { to: '/customer/settings', label: 'Settings' },
  ],
  breeder: [
    { to: '/breeder/dashboard', label: 'Breeder Dashboard' },
    { to: '/breeder/listings', label: 'My Listings' },
    { to: '/breeder/certification', label: 'Certification' },
    { to: '/breeder/messages', label: 'Breeder Messages' },
    { to: '/breeder/profile', label: 'Breeder Profile' },
    { to: '/customer/dashboard', label: 'Customer Dashboard' },
    { to: '/customer/listings', label: 'Browse Listings' },
    { to: '/customer/saved', label: 'Saved Listings' },
    { to: '/customer/messages', label: 'Customer Messages' },
    { to: '/customer/profile', label: 'Customer Profile' },
    { to: '/customer/settings', label: 'Customer Settings' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Admin Dashboard' },
    { to: '/admin/verifications', label: 'Verifications' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/users', label: 'Users' },
    { to: '/breeder/dashboard', label: 'Breeder Dashboard' },
    { to: '/breeder/listings', label: 'Breeder Listings' },
    { to: '/breeder/certification', label: 'Certification' },
    { to: '/breeder/messages', label: 'Breeder Messages' },
    { to: '/breeder/profile', label: 'Breeder Profile' },
    { to: '/customer/dashboard', label: 'Customer Dashboard' },
    { to: '/customer/listings', label: 'Customer Listings' },
    { to: '/customer/saved', label: 'Saved Listings' },
    { to: '/customer/messages', label: 'Customer Messages' },
    { to: '/customer/profile', label: 'Customer Profile' },
    { to: '/customer/settings', label: 'Customer Settings' },
  ],
}

function NavigationLinks({ navigation, onNavigate }) {
  return navigation.map((item) => (
    <NavLink
      key={item.to}
      onClick={onNavigate}
      to={item.to}
      className={({ isActive }) =>
        [
          'rounded-full border border-black bg-white px-4 py-2 text-center text-xs font-medium transition',
          isActive ? 'bg-[#6c5ce7] text-white' : 'hover:bg-[#f7f3ff]',
        ].join(' ')
      }
    >
      {item.label}
    </NavLink>
  ))
}

function MainLayout({ children }) {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const navigation = currentUser ? roleNavigation[currentUser.role] ?? roleNavigation.customer : publicNavigation
  const customerMenu = [
    { to: '/customer/profile', label: 'Profile' },
    { to: '/customer/saved', label: 'Announce liked' },
    { to: '/customer/reviews', label: 'Review' },
    { to: '/customer/messages', label: 'Message' },
  ]
  const profileMenu = currentUser?.role === 'customer' ? customerMenu : navigation

  function handleLogout() {
    signOut()
    setIsProfileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#eee7ff] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fbfbff]">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 md:px-8">
          <NavLink className="flex h-12 w-16 flex-col items-center justify-center text-[10px] font-bold leading-tight text-[#6c5ce7]" to="/">
            <span className="text-xl leading-none">♕</span>
            <span>Purrfect</span>
            <span className="text-[#ff7bac]">Match</span>
          </NavLink>
          <NavLink className="justify-self-center text-center text-xl font-medium leading-tight" to="/">
            <span className="block text-[#5c63ff]">Purrfect</span>
            <span className="block text-[#ff7bac]">Match</span>
          </NavLink>
          <div className="relative justify-self-end">
            <button
              aria-label="Open profile menu"
              className="relative h-12 w-12 rounded-full border-0 bg-transparent"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span className="absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-black bg-white" />
              <span className="absolute bottom-1 left-1/2 h-5 w-8 -translate-x-1/2 rounded-t-full border-2 border-black bg-white" />
            </button>
            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-14 z-40 w-64 rounded-lg border border-black bg-[#f8f7fb] p-4 shadow-xl">
                <nav className="grid gap-3">
                  <NavigationLinks navigation={profileMenu} onNavigate={() => setIsProfileMenuOpen(false)} />
                  {!currentUser ? null : (
                    <button
                      className="rounded-full border border-black bg-white px-4 py-2 text-xs font-medium transition hover:bg-[#fff0f6]"
                      onClick={handleLogout}
                      type="button"
                    >
                      Logout
                    </button>
                  )}
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-116px)] max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">{children}</main>
      <footer className="border-t border-black/50 bg-[#eee7ff] px-4 py-2 text-center text-xs text-slate-900">
        © 2026 Purrfect Match — Student Portfolio Project
      </footer>
    </div>
  )
}

export default MainLayout
