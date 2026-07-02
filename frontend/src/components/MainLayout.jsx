import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import breederIcon from '../assets/icon/breeder-icon.png'
import customerIcon from '../assets/icon/customer-icon.png'
import useAuth from '../hooks/useAuth.js'
import { getStoredProfileImage, PROFILE_IMAGE_EVENT } from '../utils/profileImageStorage.js'

const ACTIVE_INTERFACE_STORAGE_KEY = 'purrfect-match-active-interface'

const publicNavigation = [
  { to: '/', label: 'Home' },
  { to: '/customer/listings', label: 'Listings' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

const roleNavigation = {
  customer: [
    { to: '/', label: 'Home' },
    { to: '/customer/dashboard', label: 'Dashboard' },
    { to: '/customer/listings', label: 'Listings' },
    { to: '/customer/messages', label: 'Message' },
    { to: '/customer/saved', label: 'Saved' },
    { to: '/customer/profile', label: 'Profile' },
  ],
  breeder: [
    { to: '/', label: 'Home' },
    { to: '/breeder/dashboard', label: 'Dashboard' },
    { to: '/breeder/listings', label: 'Listings' },
    { to: '/breeder/messages', label: 'Message' },
    { to: '/breeder/profile', label: 'Profile' },
    { to: '/breeder/certification', label: 'Certification' },
  ],
  admin: [
    { to: '/', label: 'Home' },
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/verifications', label: 'Certifications / Licenses' },
    { to: '/admin/users', label: 'Users' },
    { to: '/customer/profile', label: 'Profile' },
  ],
}


const interfaceOptions = {
  customer: {
    dashboard: '/customer/dashboard',
    icon: customerIcon,
    label: 'Customer',
    value: 'customer',
  },
  breeder: {
    dashboard: '/breeder/dashboard',
    icon: breederIcon,
    label: 'Breeder',
    value: 'breeder',
  },
  admin: {
    dashboard: '/admin/dashboard',
    icon: null,
    label: 'Admin Dashboard',
    value: 'admin',
  },
}

function getStoredInterface() {
  try {
    return window.localStorage.getItem(ACTIVE_INTERFACE_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistInterface(value) {
  try {
    if (value) {
      window.localStorage.setItem(ACTIVE_INTERFACE_STORAGE_KEY, value)
      return
    }

    window.localStorage.removeItem(ACTIVE_INTERFACE_STORAGE_KEY)
  } catch {
    // localStorage can be unavailable in private browsing; the UI still works for the session.
  }
}

function getBreederStatus(user) {
  return String(
    user?.breederVerificationStatus
      ?? user?.breeder_profile?.certification_status
      ?? user?.breederProfile?.certification_status
      ?? user?.certification_status
      ?? 'unverified',
  ).toLowerCase()
}

function getAllowedInterfaces(user) {
  if (!user) {
    return []
  }

  if (user.role === 'admin') {
    return [interfaceOptions.customer, interfaceOptions.breeder, interfaceOptions.admin]
  }

  if (user.role === 'breeder' && getBreederStatus(user) === 'verified') {
    return [interfaceOptions.customer, interfaceOptions.breeder]
  }

  return [interfaceOptions.customer]
}

function getDefaultInterface(user) {
  if (user?.role === 'admin') {
    return 'admin'
  }

  if (user?.role === 'breeder' && getBreederStatus(user) === 'verified') {
    return 'breeder'
  }

  return 'customer'
}

function getNavigationForInterface(activeInterface, user) {
  if (!user) {
    return publicNavigation
  }

  return roleNavigation[activeInterface] ?? roleNavigation.customer
}

function getInitials(user) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.display_name || user?.email || 'PM'
  return name
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'PM'
}

function getBackendProfileImage(user) {
  return user?.profile_picture_url ?? user?.profilePictureUrl ?? ''
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
  const [activeInterface, setActiveInterface] = useState(getStoredInterface)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const [localProfileImage, setLocalProfileImage] = useState(() => getStoredProfileImage(currentUser))
  const allowedInterfaces = currentUser ? getAllowedInterfaces(currentUser) : []
  const resolvedInterface = allowedInterfaces.some((option) => option.value === activeInterface)
    ? activeInterface
    : getDefaultInterface(currentUser)
  const activeOption = interfaceOptions[resolvedInterface] ?? interfaceOptions.customer
  const navigation = currentUser ? getNavigationForInterface(resolvedInterface, currentUser) : publicNavigation
  const profileMenu = navigation
  const avatarImage = localProfileImage || getBackendProfileImage(currentUser)
  const avatarInitials = getInitials(currentUser)

  useEffect(() => {
    if (!currentUser) {
      setLocalProfileImage('')
      return
    }

    setLocalProfileImage(getStoredProfileImage(currentUser))
  }, [currentUser])

  useEffect(() => {
    function refreshProfileImage() {
      setLocalProfileImage(getStoredProfileImage(currentUser))
    }

    window.addEventListener(PROFILE_IMAGE_EVENT, refreshProfileImage)
    window.addEventListener('storage', refreshProfileImage)

    return () => {
      window.removeEventListener(PROFILE_IMAGE_EVENT, refreshProfileImage)
      window.removeEventListener('storage', refreshProfileImage)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    if (resolvedInterface !== activeInterface) {
      setActiveInterface(resolvedInterface)
    }

    persistInterface(resolvedInterface)
  }, [activeInterface, currentUser, resolvedInterface])

  function handleLogout() {
    signOut()
    persistInterface(null)
    setActiveInterface(null)
    setIsProfileMenuOpen(false)
    setIsRoleMenuOpen(false)
    navigate('/login', { replace: true })
  }

  function switchInterface(option) {
    setActiveInterface(option.value)
    persistInterface(option.value)
    setIsRoleMenuOpen(false)
    setIsProfileMenuOpen(false)
    navigate(option.dashboard)
  }

  return (
    <div className="min-h-screen bg-[#eee7ff] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fbfbff]">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 md:px-8">
          <NavLink className="flex h-12 w-16 flex-col items-center justify-center text-[10px] font-bold leading-tight text-[#6c5ce7]" to="/">
            <span className="text-sm leading-none">PM</span>
            <span>Purrfect</span>
            <span className="text-[#ff7bac]">Match</span>
          </NavLink>
          <NavLink className="justify-self-center text-center text-xl font-medium leading-tight" to="/">
            <span className="block text-[#5c63ff]">Purrfect</span>
            <span className="block text-[#ff7bac]">Match</span>
          </NavLink>
          <div className="flex items-center gap-2 justify-self-end">
            {currentUser ? (
              <div className="relative">
                <button
                  aria-expanded={isRoleMenuOpen}
                  aria-label="Switch active interface"
                  className="flex h-11 items-center gap-2 rounded-full border border-black bg-white px-2.5 py-1.5 shadow-sm transition hover:bg-[#f7f3ff]"
                  onClick={() => {
                    setIsRoleMenuOpen((isOpen) => !isOpen)
                    setIsProfileMenuOpen(false)
                  }}
                  type="button"
                >
                  {activeOption.icon && (
                    <img alt="" className="h-7 w-7 rounded-full object-contain" src={activeOption.icon} />
                  )}
                  <span className="hidden text-xs font-semibold text-slate-800 sm:inline">{activeOption.label}</span>
                  <span className={`h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-[#6c5ce7] transition-transform ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className={[
                    'absolute right-0 top-14 z-40 w-56 origin-top-right rounded-lg border border-black bg-[#f8f7fb] p-3 shadow-xl transition duration-150',
                    isRoleMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
                  ].join(' ')}
                >
                  <div className="grid gap-2">
                    {allowedInterfaces.map((option) => (
                      <button
                        className={[
                          'flex items-center gap-3 rounded-full border border-black px-3 py-2 text-left text-xs font-semibold transition',
                          resolvedInterface === option.value ? 'bg-[#6c5ce7] text-white' : 'bg-white text-slate-900 hover:bg-[#f7f3ff]',
                        ].join(' ')}
                        key={option.value}
                        onClick={() => switchInterface(option)}
                        type="button"
                      >
                        {option.icon ? <img alt="" className="h-7 w-7 rounded-full object-contain" src={option.icon} /> : null}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="relative">
              <button
                aria-expanded={isProfileMenuOpen}
                aria-label="Open profile menu"
                className="grid h-12 w-12 place-items-center rounded-full border border-black bg-white shadow-sm transition hover:bg-[#f7f3ff]"
                onClick={() => {
                  setIsProfileMenuOpen((isOpen) => !isOpen)
                  setIsRoleMenuOpen(false)
                }}
                type="button"
              >
                {avatarImage ? (
                  <img alt="Profile" className="h-10 w-10 rounded-full object-cover" src={avatarImage} />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eee7ff] text-xs font-bold text-[#6c5ce7]">{avatarInitials}</span>
                )}
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
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-116px)] max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">{children}</main>
      <footer className="border-t border-black/50 bg-[#eee7ff] px-4 py-2 text-center text-xs text-slate-900">
        (c) 2026 Purrfect Match - Student Portfolio Project
      </footer>
    </div>
  )
}

export default MainLayout
