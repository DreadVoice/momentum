import { TaskPriority, TaskStatus, type SortableTaskProperty } from '../../types/api'

/** Column headings for the three boards. Keys are the backend enum, verbatim. */
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
