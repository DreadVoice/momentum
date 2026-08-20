/**
 * Hand-written mirror of the Spring Boot DTOs in `app/src/main/java/com/momentum/app/dto`.
 * Any change to a backend record must be reflected here.
 */

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
]

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
]

/** Properties the backend whitelists in TaskController#validateSort. */
export const SORTABLE_TASK_PROPERTIES = [
  'createdAt',
  'dueDate',
  'priority',
  'status',
  'title',
] as const

export type SortableTaskProperty = (typeof SORTABLE_TASK_PROPERTIES)[number]

export type SortDirection = 'asc' | 'desc'

/** `com.momentum.app.exception.ErrorResponse` */
export interface ApiErrorBody {
  readonly status: number
  readonly error: string
  readonly message: string
  readonly timestamp: string
  readonly fieldErrors: Readonly<Record<string, string>> | null
}

/** `com.momentum.app.dto.common.PageResponse` */
export interface PageResponse<T> {
  readonly content: readonly T[]
  readonly page: number
  readonly size: number
  readonly totalElements: number
  readonly totalPages: number
}

/** `com.momentum.app.dto.auth.AuthResponse` */
export interface AuthResponse {
  readonly accessToken: string
  readonly refreshToken: string
  readonly username: string
}

export interface LoginRequest {
  readonly usernameOrEmail: string
  readonly password: string
}

export interface RegisterRequest {
  readonly username: string
  readonly email: string
  readonly password: string
}

export interface RefreshTokenRequest {
  readonly refreshToken: string
}

/** `com.momentum.app.dto.user.UserResponse` */
export interface UserResponse {
  readonly id: number
  readonly username: string
  readonly email: string
  readonly profilePhoto: string | null
  /** ISO-8601 local date-time, e.g. `2026-08-20T09:41:00`. */
  readonly createdAt: string
}

/** `com.momentum.app.dto.subtask.SubTaskResponse` */
export interface SubTaskResponse {
  readonly id: number
  readonly title: string
  readonly completed: boolean
}

/** `com.momentum.app.dto.task.TaskResponse` */
export interface TaskResponse {
  readonly id: number
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly categoryName: string | null
  /** ISO-8601 local date, e.g. `2026-08-20`. */
  readonly dueDate: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly subTasks: readonly SubTaskResponse[]
  readonly subTaskCount: number
  readonly completedSubTaskCount: number
}

export interface TaskCreateRequest {
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly categoryId: number | null
  readonly dueDate: string | null
}

/**
 * Full replacement (PUT). Unlike PATCH, null values are applied, so this is the
 * only way to clear a due date or detach a category.
 */
export interface TaskUpdateRequest {
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly categoryId: number | null
  readonly dueDate: string | null
}

/** Partial update (PATCH). The backend ignores every null field. */
export interface TaskPatchRequest {
  readonly title?: string
  readonly description?: string
  readonly priority?: TaskPriority
  readonly status?: TaskStatus
  readonly categoryId?: number
  readonly dueDate?: string
}

/** `com.momentum.app.dto.category.CategoryResponse` */
export interface CategoryResponse {
  readonly id: number
  readonly name: string
  readonly taskCount: number
}

/** `com.momentum.app.dto.task.TaskStatsResponse` */
export interface TaskStatsResponse {
  readonly countsByStatus: Readonly<Record<TaskStatus, number>>
  readonly total: number
}

export interface TaskQuery {
  readonly status: TaskStatus | null
  readonly priority: TaskPriority | null
  readonly categoryId: number | null
  readonly sortBy: SortableTaskProperty
  readonly sortDirection: SortDirection
}
