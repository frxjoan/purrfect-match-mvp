import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import breederIcon from '../assets/icon/breeder-icon.png'
import customerIcon from '../assets/icon/customer-icon.png'
import logoImage from '../../assets/logo/logo-purrfect-match.png'
import { getBreederVerificationStatus } from '../context/AuthContext.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchConversation, fetchConversations } from '../services/api.js'
import { getStoredProfileImage, PROFILE_IMAGE_EVENT } from '../utils/profileImageStorage.js'

const ACTIVE_INTERFACE_STORAGE_KEY = 'purrfect-match-active-interface'

/**
 * Navigation displayed when there is no authenticated user.
 */
const publicNavigation = [
  { to: '/', label: 'Home' },
  { to: '/customer/listings', label: 'Listings' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

/**
 * Navigation displayed after login, keyed by the role returned by Flask.
 *
 * Admin receives links to every section, breeder receives breeder and customer
 * workflows, and customer receives only customer workflows.
 */
const roleNavigation = {
  customer: [
    { to: '/', label: 'Home' },
    { to: '/customer/dashboard', label: 'Dashboard' },
    { to: '/customer/listings', label: 'Listings' },
    { to: '/customer/messages', label: 'Message' },
    { to: '/customer/saved', label: 'Saved' },
    { to: '/customer/reviews', label: 'Reviews' },
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
    { to: '/admin/messages', label: 'Message' },
    { to: '/admin/verifications', label: 'Certifications / Licenses' },
    { to: '/admin/users', label: 'Users' },
    { to: '/customer/profile', label: 'Profile' },
  ],
}

/**
 * Renders a group of NavLink buttons and closes the active menu after click.
 *
 * @param {{ navigation: { to: string, label: string }[], onNavigate?: Function }} props - Navigation render props.
 * @returns {JSX.Element[]} Menu links.
 */
function NavigationLinks({ navigation, onNavigate }) {

const interfaceOptions = {
  customer: {
    dashboard: '/',
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

function getInterfaceDashboard(option, user) {
  if (option.value === 'breeder' && user?.role === 'breeder' && getBreederVerificationStatus(user) !== 'verified') {
    return '/breeder/certification'
  }

  return option.dashboard
}

function getAllowedInterfaces(user) {
  if (!user) {
    return []
  }

  if (user.role === 'admin') {
    return [interfaceOptions.customer, interfaceOptions.breeder, interfaceOptions.admin]
  }

  if (user.role === 'breeder') {
    return [interfaceOptions.customer, interfaceOptions.breeder]
  }

  return [interfaceOptions.customer]
}

function getDefaultInterface(user) {
  if (user?.role === 'admin') {
    return 'admin'
  }

  if (user?.role === 'breeder') {
    return 'breeder'
  }

  return 'customer'
}

function getNavigationForInterface(activeInterface, user) {
  if (!user) {
    return publicNavigation
  }

  if (activeInterface === 'breeder' && user.role === 'breeder' && getBreederVerificationStatus(user) !== 'verified') {
    return [
      { to: '/', label: 'Home' },
      { to: '/breeder/certification', label: 'Certification' },
      { to: '/breeder/profile', label: 'Profile' },
    ]
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

function getProfileImageFromUser(user) {
  return user?.profile_picture_url ?? user?.profilePictureUrl ?? ''
}
function NavigationLinks({ hasUnreadMessages = false, navigation, onNavigate }) {
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
      <span className="inline-flex items-center justify-center gap-2">
        <span>{item.label}</span>
        {item.label === 'Message' && hasUnreadMessages ? <span className="h-2 w-2 rounded-full bg-rose-500" aria-label="Unread messages" /> : null}
      </span>
    </NavLink>
  ))
}

/**
 * Shared application shell used around every route.
 *
 * This component chooses the correct navigation menu from AuthContext, renders
 * the profile dropdown, and performs logout by clearing the frontend session
 * before redirecting back to Login.
 *
 * @param {{ children: import('react').ReactNode }} props - Active route content.
 * @returns {JSX.Element} Page layout with header, main content, and footer.
 */
function MainLayout({ children }) {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeInterface, setActiveInterface] = useState(getStoredInterface)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const [localProfileImage, setLocalProfileImage] = useState(() => getStoredProfileImage(currentUser))
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const allowedInterfaces = currentUser ? getAllowedInterfaces(currentUser) : []
  const resolvedInterface = allowedInterfaces.some((option) => option.value === activeInterface)
    ? activeInterface
    : getDefaultInterface(currentUser)
  const activeOption = interfaceOptions[resolvedInterface] ?? interfaceOptions.customer
  const navigation = currentUser ? getNavigationForInterface(resolvedInterface, currentUser) : publicNavigation
  const profileMenu = navigation
  const avatarImage = localProfileImage || getProfileImageFromUser(currentUser)
  const avatarInitials = getInitials(currentUser)

  useEffect(() => {
    let ignore = false

    async function loadUnreadMessages() {
      if (!currentUser?.token) {
        setHasUnreadMessages(false)
        return
      }

      try {
        const data = await fetchConversations()
        const conversations = data.conversations ?? []
        const details = await Promise.allSettled(conversations.map((conversation) => fetchConversation(conversation.id)))
        const hasUnread = details.some((result) => {
          if (result.status !== 'fulfilled') {
            return false
          }

          const messages = result.value.conversation?.messages ?? []
          return messages.some((message) => message.sender_id !== currentUser.id && message.is_read === false)
        })

        if (!ignore) {
          setHasUnreadMessages(hasUnread)
        }
      } catch {
        if (!ignore) {
          setHasUnreadMessages(false)
        }
      }
    }

    function handleUnreadChange(event) {
      setHasUnreadMessages(Boolean(event.detail?.hasUnread))
    }

    loadUnreadMessages()
    window.addEventListener('purrfect-match-messages-unread-change', handleUnreadChange)

    return () => {
      ignore = true
      window.removeEventListener('purrfect-match-messages-unread-change', handleUnreadChange)
    }
  }, [currentUser?.id, currentUser?.token])
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
    navigate(getInterfaceDashboard(option, currentUser))
  }

  return (
    <div className="min-h-screen bg-[#eee7ff] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fbfbff]">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-8">
          <NavLink className="relative z-10 flex h-24 w-44 items-center justify-start sm:h-28 sm:w-52" to="/" aria-label="Purrfect Match home">
            <img alt="Purrfect Match" className="h-24 w-auto object-contain sm:h-28" src={logoImage} />
          </NavLink>
          <NavLink className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl font-medium leading-tight" to="/">
            <span className="block text-[#5c63ff]">Purrfect</span>
            <span className="block text-[#ff7bac]">Match</span>
          </NavLink>
          <div className="relative z-10 flex items-center gap-2">
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
                ) : currentUser ? (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eee7ff] text-xs font-bold text-[#6c5ce7]">{avatarInitials}</span>
                ) : (
                  <img alt="Customer" className="h-10 w-10 rounded-full object-contain" src={customerIcon} />
                )}
              </button>
              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-14 z-40 w-64 rounded-lg border border-black bg-[#f8f7fb] p-4 shadow-xl">
                  <nav className="grid gap-3">
                    <NavigationLinks hasUnreadMessages={hasUnreadMessages} navigation={profileMenu} onNavigate={() => setIsProfileMenuOpen(false)} />
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