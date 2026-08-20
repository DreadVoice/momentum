import { request, requestNoContent } from './httpClient'
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
} from '../types/api'

export const categoriesApi = {
  list(signal?: AbortSignal): Promise<readonly CategoryResponse[]> {
    return request<readonly CategoryResponse[]>('/api/categories', { signal })
  },

  create(body: CategoryCreateRequest): Promise<CategoryResponse> {
    return request<CategoryResponse>('/api/categories', { method: 'POST', body })
  },

  update(categoryId: number, body: CategoryUpdateRequest): Promise<CategoryResponse> {
    return request<CategoryResponse>(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body,
    })
  },


  remove(categoryId: number): Promise<void> {
    return requestNoContent(`/api/categories/${categoryId}`, { method: 'DELETE' })
  },
}
