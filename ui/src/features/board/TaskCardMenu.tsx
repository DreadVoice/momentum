import { useCallback, useRef, useState } from 'react'
import { useDismissable } from '../../hooks/useDismissable'
import { TASK_STATUSES, type TaskResponse, type TaskStatus } from '../../types/api'
import { STATUS_LABELS } from './boardConfig'

interface TaskCardMenuProps {
  readonly task: TaskResponse
  readonly disabled: boolean
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

export function TaskCardMenu({ task, disabled, onEdit, onMove, onDelete }: TaskCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  useDismissable(containerRef, isOpen, close)

  const handleToggle = useCallback(() => {
    setIsOpen((current) => !current)
  }, [])

  const handleEdit = useCallback(() => {
    setIsOpen(false)
    onEdit(task)
  }, [onEdit, task])

  const handleDelete = useCallback(() => {
    setIsOpen(false)
    onDelete(task)
  }, [onDelete, task])

  return (
    <div className="task-menu" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="icon-btn"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Actions for ${task.title}`}
      >
        &#8942;
      </button>

      {isOpen && (
        <div className="task-menu__panel" role="menu">
          <button type="button" role="menuitem" className="task-menu__item" onClick={handleEdit}>
            Edit task
          </button>

          <div className="task-menu__group" role="group" aria-label="Move to">
            <p className="task-menu__group-label">Move to</p>
            {TASK_STATUSES.filter((candidate) => candidate !== task.status).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="menuitem"
                className="task-menu__item"
                onClick={() => {
                  setIsOpen(false)
                  onMove(task.id, candidate)
                }}
              >
                {STATUS_LABELS[candidate]}
              </button>
            ))}
          </div>

          <button
            type="button"
            role="menuitem"
            className="task-menu__item task-menu__item--danger"
            onClick={handleDelete}
          >
            Delete task
          </button>
        </div>
      )}
    </div>
  )
}
