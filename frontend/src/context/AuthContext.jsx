import { createContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(undefined)
const AUTH_STORAGE_KEY = 'purrfect-match-user'
const LEGACY_AUTH_STORAGE_KEY = 'purrfect-match-demo-user'

const roleDashboards = {
  customer: '/customer/dashboard',
  breeder: '/breeder/dashboard',
  admin: '/admin/dashboard',
}

function getStoredUser() {
  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

function getRoleDashboard(role) {
  return roleDashboards[role] ?? roleDashboards.customer
}

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

function normalizeStoredUser(user) {
  if (user.role !== 'breeder') {
    return user
  }

  return {
    ...user,
    breederVerificationStatus: getBreederVerificationStatus(user),
  }
}

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

export { AuthContext, AuthProvider, getBreederVerificationStatus, getPostLoginRedirect, getRoleDashboard, needsBreederCertification }