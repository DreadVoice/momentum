import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UserResponse } from '../types/api'

/**
 * Discriminated union rather than a bag of booleans, so an impossible pairing
 * such as "restoring and authenticated" cannot be represented.
 */
export type AuthState =
  | { readonly kind: 'restoring' }
  | { readonly kind: 'anonymous'; readonly sessionExpired: boolean }
  | { readonly kind: 'authenticated'; readonly user: UserResponse }

export interface AuthContextValue {
  readonly state: AuthState
  readonly login: (credentials: LoginRequest) => Promise<void>
  readonly register: (details: RegisterRequest) => Promise<void>
  readonly logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
