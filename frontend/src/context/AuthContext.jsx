import { createContext, useEffect, useMemo, useState } from 'react'

/**
 * Authentication context for the React app.
 *
 * This module owns the frontend session state. It restores the Flask login
 * payload from localStorage, exposes the current user to all pages, and keeps
 * the JWT available for api.js so protected Flask endpoints receive the
 * Authorization header.
 */

const AuthContext = createContext(undefined)
const AUTH_STORAGE_KEY = 'purrfect-match-user'
const LEGACY_AUTH_STORAGE_KEY = 'purrfect-match-demo-user'

const roleDashboards = {
  customer: '/customer/dashboard',
  breeder: '/breeder/dashboard',
  admin: '/admin/dashboard',
}

/**
 * Reads the persisted authenticated user from localStorage.
 *
 * @returns {Object|null} User session object containing the Flask user payload and JWT, or null when no session exists.
 */
function getStoredUser() {
  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

/**
 * Resolves the default dashboard route for a role.
 *
 * @param {'customer'|'breeder'|'admin'} role - Role returned by Flask after login.
 * @returns {string} Dashboard URL used by redirects and UnauthorizedPage.
 */
function getRoleDashboard(role) {
  return roleDashboards[role] ?? roleDashboards.customer
}

/**
 * Normalizes the saved user shape before storing it in React state.
 *
 * Flask may return breeder verification status nested under breeder_profile.
 * The frontend copies it to breederVerificationStatus so navigation and pages
 * can read a stable property.
 *
 * @param {Object} user - User payload returned by Flask login/register/profile endpoints.
 * @returns {Object} User object normalized for frontend session use.
 */
function normalizeStoredUser(user) {
  if (user.role !== 'breeder') {
    return user
  }

  return {
    ...user,
    breederVerificationStatus: user.breederVerificationStatus ?? user.breeder_profile?.certification_status ?? 'unverified',
  }
}

/**
 * Provides authentication state and auth actions to the full React tree.
 *
 * @param {{ children: import('react').ReactNode }} props - Provider children.
 * @returns {JSX.Element} React context provider.
 */
function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser)

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser))
      window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
      return
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
  }, [currentUser])

  const value = useMemo(
    () => ({
      currentUser,
      getRoleDashboard,
      isAuthenticated: Boolean(currentUser),
      signIn: (user) => setCurrentUser(normalizeStoredUser(user)),
      signOut: () => setCurrentUser(null),
    }),
    [currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider, getRoleDashboard }
