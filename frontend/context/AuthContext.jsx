import { createContext, useMemo, useState } from 'react'

const AuthContext = createContext(undefined)

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  const value = useMemo(
    () => ({
      currentUser,
      signIn: (user) => setCurrentUser(user),
      signOut: () => setCurrentUser(null),
    }),
    [currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
