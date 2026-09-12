import { TaskPriority, TaskStatus, type SortableTaskProperty } from '../../types/api'

export const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  [TaskStatus.PENDING]: 'Pending',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.COMPLETED]: 'Completed',
}

export const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
}

export const SORT_LABELS: Readonly<Record<SortableTaskProperty, string>> = {
  createdAt: 'Created',
  dueDate: 'Due date',
  priority: 'Priority',
  status: 'Status',
  title: 'Title',
}

export const EMPTY_COLUMN_MESSAGES: Readonly<Record<TaskStatus, string>> = {
  [TaskStatus.PENDING]: 'Nothing waiting to be started.',
  [TaskStatus.IN_PROGRESS]: 'Nothing in progress right now.',
  [TaskStatus.COMPLETED]: 'No tasks completed yet.',
}

/**
 * Each board gets one dot colour. Status, priority and overdue deliberately use
 * different hues so no two meanings ever share a colour.
 */
export const STATUS_DOT_CLASSES: Readonly<Record<TaskStatus, string>> = {
  [TaskStatus.PENDING]: 'bg-muted-foreground/50',
  [TaskStatus.IN_PROGRESS]: 'bg-brand',
  [TaskStatus.COMPLETED]: 'bg-success',
}

/** Badge variant per priority: neutral, brand, then warning for High. */
export const PRIORITY_BADGE_VARIANTS = {
  [TaskPriority.LOW]: 'muted',
  [TaskPriority.MEDIUM]: 'brand',
  [TaskPriority.HIGH]: 'warning',
} as const
