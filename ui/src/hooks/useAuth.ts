import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/authContext'

/** Reads the session, failing loudly if used outside the provider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>.')
  }

  return context
}
