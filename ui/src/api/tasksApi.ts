import { request, requestNoContent } from './httpClient'
import type {
  PageResponse,
  TaskCreateRequest,
  TaskPatchRequest,
  TaskQuery,
  TaskResponse,
  TaskStatsResponse,
  TaskUpdateRequest,
} from '../types/api'

export interface TaskPageRequest {
  readonly query: TaskQuery
  readonly page: number
  readonly size: number
  readonly signal?: AbortSignal | undefined
}

export const tasksApi = {
  list({ query, page, size, signal }: TaskPageRequest): Promise<PageResponse<TaskResponse>> {
    return request<PageResponse<TaskResponse>>('/api/tasks', {
      query: {
        status: query.status,
        priority: query.priority,
        categoryId: query.categoryId,
        page,
        size,
        // The backend whitelists the property; the union type keeps the
        // client from ever sending one that would be rejected with a 400.
        sort: `${query.sortBy},${query.sortDirection}`,
      },
      signal,
    })
  },

  get(taskId: number, signal?: AbortSignal): Promise<TaskResponse> {
    return request<TaskResponse>(`/api/tasks/${taskId}`, { signal })
  },

  create(body: TaskCreateRequest): Promise<TaskResponse> {
    return request<TaskResponse>('/api/tasks', { method: 'POST', body })
  },

  /** Full replacement. The only way to clear a due date or detach a category. */
  update(taskId: number, body: TaskUpdateRequest): Promise<TaskResponse> {
    return request<TaskResponse>(`/api/tasks/${taskId}`, { method: 'PUT', body })
  },

  /** Partial update; the backend ignores null fields. */
  patch(taskId: number, body: TaskPatchRequest): Promise<TaskResponse> {
    return request<TaskResponse>(`/api/tasks/${taskId}`, { method: 'PATCH', body })
  },

  remove(taskId: number): Promise<void> {
    return requestNoContent(`/api/tasks/${taskId}`, { method: 'DELETE' })
  },

  /** Tasks whose due date has passed and that are not completed. */
  overdue(signal?: AbortSignal): Promise<readonly TaskResponse[]> {
    return request<readonly TaskResponse[]>('/api/tasks/overdue', { signal })
  },

  stats(signal?: AbortSignal): Promise<TaskStatsResponse> {
    return request<TaskStatsResponse>('/api/tasks/stats', { signal })
  },
}
