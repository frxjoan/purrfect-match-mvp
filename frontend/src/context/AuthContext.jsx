/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useMemo, useState } from 'react'
import { logoutUser, refreshSession } from '../services/api.js'

/**
 * Authentication context for the React app.
 *
 * The access token remains private to api.js. This context restores the user
 * through the HttpOnly refresh cookie and never persists token material.
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

function getBreederVerificationStatus(user) {
  if (user?.role !== 'breeder') {
    return null
  }

  const status = String(
    user.breederVerificationStatus
      ?? user.breeder_certification_status
      ?? user.breeder_profile?.certification_status
      ?? user.breederProfile?.certification_status
      ?? 'unverified',
  ).toLowerCase()

  return status === 'approved' ? 'verified' : status
}

function needsBreederCertification(user) {
  return user?.role === 'breeder' && getBreederVerificationStatus(user) !== 'verified'
}

function getPostLoginRedirect(user) {
  if (needsBreederCertification(user)) {
    return '/breeder/certification'
  }

  if (user?.role === 'breeder') {
    return '/breeder/dashboard'
  }

  return '/'
}


function normalizeUser(user) {
  const safeUser = { ...(user ?? {}) }
  delete safeUser.access_token
  delete safeUser.token

  if (safeUser.role !== 'breeder') {
    return safeUser
  }

  return { ...safeUser, breederVerificationStatus: getBreederVerificationStatus(safeUser) }
}

/**
 * Provides authentication state and auth actions to the full React tree.
 *
 * @param {{ children: import('react').ReactNode }} props - Provider children.
 * @returns {JSX.Element} React context provider.
 */
function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    window.sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)

    async function restoreSession() {
      try {
        const data = await refreshSession()
        if (!ignore) {
          setCurrentUser(data?.user ? normalizeUser(data.user) : null)
        }
      } catch {
        if (!ignore) {
          setCurrentUser(null)
        }
      } finally {
        if (!ignore) {
          setIsAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      ignore = true
    }
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      getRoleDashboard,
      isAuthLoading,
      isAuthenticated: Boolean(currentUser),
      signIn: (user) => setCurrentUser(normalizeUser(user)),
      signOut: async () => {
        setCurrentUser(null)
        try {
          await logoutUser()
        } catch {
          // The local session is cleared even when the server is unavailable.
        }
      },
    }),
    [currentUser, isAuthLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider, getBreederVerificationStatus, getPostLoginRedirect, getRoleDashboard, needsBreederCertification }
