import { request, requestNoContent } from './httpClient'
import type {
  SubTaskCreateRequest,
  SubTaskPatchRequest,
  SubTaskResponse,
  SubTaskUpdateRequest,
} from '../types/api'

/** Subtasks are created under a task but addressed by their own id thereafter. */
export const subTasksApi = {
  list(taskId: number, signal?: AbortSignal): Promise<readonly SubTaskResponse[]> {
    return request<readonly SubTaskResponse[]>(`/api/tasks/${taskId}/subtasks`, { signal })
  },

  create(taskId: number, body: SubTaskCreateRequest): Promise<SubTaskResponse> {
    return request<SubTaskResponse>(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body,
    })
  },

  update(subTaskId: number, body: SubTaskUpdateRequest): Promise<SubTaskResponse> {
    return request<SubTaskResponse>(`/api/subtasks/${subTaskId}`, { method: 'PUT', body })
  },

  patch(subTaskId: number, body: SubTaskPatchRequest): Promise<SubTaskResponse> {
    return request<SubTaskResponse>(`/api/subtasks/${subTaskId}`, { method: 'PATCH', body })
  },

  /** Server-side flip; avoids sending a stale `completed` value. */
  toggle(subTaskId: number): Promise<SubTaskResponse> {
    return request<SubTaskResponse>(`/api/subtasks/${subTaskId}/toggle`, {
      method: 'PATCH',
    })
  },

  remove(subTaskId: number): Promise<void> {
    return requestNoContent(`/api/subtasks/${subTaskId}`, { method: 'DELETE' })
  },
}
