import { createContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(undefined)
const AUTH_STORAGE_KEY = 'purrfect-match-demo-user'

const roleDashboards = {
  customer: '/customer/dashboard',
  breeder: '/breeder/dashboard',
  admin: '/admin/dashboard',
}

function getStoredUser() {
  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

function getRoleDashboard(role) {
  return roleDashboards[role] ?? roleDashboards.customer
}

function normalizeDemoUser(user) {
  if (user.role !== 'breeder') {
    return user
  }

  return {
    ...user,
    breederVerificationStatus: user.breederVerificationStatus ?? 'unverified',
  }
}

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser)

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser))
      return
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [currentUser])

  const value = useMemo(
    () => ({
      currentUser,
      getRoleDashboard,
      isAuthenticated: Boolean(currentUser),
      signIn: (user) => setCurrentUser(normalizeDemoUser(user)),
      signOut: () => setCurrentUser(null),
    }),
    [currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider, getRoleDashboard }
