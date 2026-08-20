import { request } from './httpClient'
import type { CategoryResponse } from '../types/api'

export const categoriesApi = {
  list(signal?: AbortSignal): Promise<readonly CategoryResponse[]> {
    return request<readonly CategoryResponse[]>('/api/categories', { signal })
  },
}
