/**
 * The API exchanges `LocalDate` as `YYYY-MM-DD`. Passing that string to
 * `new Date()` parses it as UTC midnight, which renders as the previous day for
 * anyone west of Greenwich, so dates are parsed into explicit local components.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseLocalDate(value: string): Date | null {
  const match = ISO_DATE.exec(value)

  if (match === null) {
    return null
  }

  const [, year, month, day] = match

  if (year === undefined || month === undefined || day === undefined) {
    return null
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return Number.isNaN(date.getTime()) ? null : date
}

/** `YYYY-MM-DD` for today in the viewer's own timezone. */
export function todayAsIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

export function formatDueDate(value: string): string {
  const date = parseLocalDate(value)

  if (date === null) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

/** A due date strictly before today. Equal dates are still due, not overdue. */
export function isOverdue(dueDate: string | null): boolean {
  return dueDate !== null && dueDate < todayAsIsoDate()
}
