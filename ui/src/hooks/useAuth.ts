import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/authContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>.')
  }

  return context
}
