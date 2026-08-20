import { request, requestNoContent } from './httpClient'
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  UserResponse,
  UserUpdateRequest,
} from '../types/api'

export const usersApi = {
  me(signal?: AbortSignal): Promise<UserResponse> {
    return request<UserResponse>('/api/users/me', { signal })
  },

  update(body: UserUpdateRequest): Promise<UserResponse> {
    return request<UserResponse>('/api/users/me', { method: 'PUT', body })
  },

  changePassword(body: ChangePasswordRequest): Promise<void> {
    return requestNoContent('/api/users/me/password', {
      method: 'PATCH',
      body,
      refreshOn401: false,
    })
  },

  deleteAccount(body: DeleteAccountRequest): Promise<void> {
    return requestNoContent('/api/users/me', {
      method: 'DELETE',
      body,
      refreshOn401: false,
    })
  },
}
