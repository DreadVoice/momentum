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

export function isOverdue(dueDate: string | null): boolean {
  return dueDate !== null && dueDate < todayAsIsoDate()
}

export function formatTimestamp(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)

  if (match === null) {
    return value
  }

  const [, year, month, day, hour, minute] = match

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return value
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
