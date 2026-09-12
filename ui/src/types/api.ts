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

export const SORTABLE_TASK_PROPERTIES = [
  'createdAt',
  'dueDate',
  'priority',
  'status',
  'title',
] as const

export type SortableTaskProperty = (typeof SORTABLE_TASK_PROPERTIES)[number]

export type SortDirection = 'asc' | 'desc'

export interface ApiErrorBody {
  readonly status: number
  readonly error: string
  readonly message: string
  readonly timestamp: string
  readonly fieldErrors: Readonly<Record<string, string>> | null
}

export interface PageResponse<T> {
  readonly content: readonly T[]
  readonly page: number
  readonly size: number
  readonly totalElements: number
  readonly totalPages: number
}

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

export interface UserResponse {
  readonly id: number
  readonly username: string
  readonly email: string
  readonly profilePhoto: string | null
  readonly createdAt: string
}

export interface SubTaskResponse {
  readonly id: number
  readonly title: string
  readonly completed: boolean
}

export interface TaskResponse {
  readonly id: number
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly categoryName: string | null
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

export interface TaskUpdateRequest {
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly categoryId: number | null
  readonly dueDate: string | null
}

export interface TaskPatchRequest {
  readonly title?: string
  readonly description?: string
  readonly priority?: TaskPriority
  readonly status?: TaskStatus
  readonly categoryId?: number
  readonly dueDate?: string
}

export interface CategoryCreateRequest {
  readonly name: string
}

export interface CategoryUpdateRequest {
  readonly name: string
}

export interface CategoryResponse {
  readonly id: number
  readonly name: string
  readonly taskCount: number
}

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

export interface SubTaskCreateRequest {
  readonly title: string
}

export interface SubTaskUpdateRequest {
  readonly title: string
  readonly completed: boolean
}

export interface SubTaskPatchRequest {
  readonly title?: string
  readonly completed?: boolean
}

export interface UserUpdateRequest {
  readonly username: string
  readonly email: string
  readonly profilePhoto: string | null
}

export interface ChangePasswordRequest {
  readonly currentPassword: string
  readonly newPassword: string
}

export interface DeleteAccountRequest {
  readonly password: string
}

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 50,
  passwordMin: 8,
  passwordMax: 100,
  taskTitleMax: 255,
  taskDescriptionMax: 1000,
  subTaskTitleMax: 50,
  categoryNameMax: 255,
  profilePhotoMax: 512,
} as const

export const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/
