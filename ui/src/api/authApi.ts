import { request, requestNoContent } from './httpClient'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../types/api'

export const authApi = {
  register(body: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body,
      authenticated: false,
    })
  },

  login(body: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body,
      authenticated: false,
    })
  },

  logout(refreshToken: string): Promise<void> {
    return requestNoContent('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      authenticated: false,
    })
  },

  getCurrentUser(signal?: AbortSignal): Promise<UserResponse> {
    return request<UserResponse>('/api/users/me', { signal })
  },
}
