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

  /**
   * Only safe when the category holds no tasks: `tasks.category_id` is a
   * RESTRICT foreign key with no JPA cascade, so deleting a category that is
   * still referenced fails in the database and surfaces as a 500.
   */
  remove(categoryId: number): Promise<void> {
    return requestNoContent(`/api/categories/${categoryId}`, { method: 'DELETE' })
  },
}
