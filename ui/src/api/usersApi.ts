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

  /** A 401 here means the current password was wrong, not that the session died. */
  changePassword(body: ChangePasswordRequest): Promise<void> {
    return requestNoContent('/api/users/me/password', {
      method: 'PATCH',
      body,
      refreshOn401: false,
    })
  },

  /** The API requires the current password in the body of the DELETE. */
  deleteAccount(body: DeleteAccountRequest): Promise<void> {
    return requestNoContent('/api/users/me', {
      method: 'DELETE',
      body,
      refreshOn401: false,
    })
  },
}
