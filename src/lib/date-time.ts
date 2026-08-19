export const APP_TIME_ZONE = 'Asia/Dhaka'

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeDateTimeParts(parts: Intl.DateTimeFormatPart[]) {
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.day} ${values.month} ${values.year}, ${values.hour}:${values.minute} ${values.dayPeriod.toUpperCase()}`
}

export function formatDateTime(value: string | Date | null | undefined) {
  const date = parseDate(value)
  return date ? normalizeDateTimeParts(dateTimeFormatter.formatToParts(date)) : 'Unknown date'
}

export function formatDate(value: string | Date | null | undefined) {
  const date = parseDate(value)
  return date ? dateFormatter.format(date) : 'Unknown date'
}

export function formatTime(value: string | Date | null | undefined) {
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
    const [hourValue, minuteValue] = value.split(':').map(Number)
    if (Number.isFinite(hourValue) && Number.isFinite(minuteValue)) {
      const hour = hourValue % 12 || 12
      const period = hourValue >= 12 ? 'PM' : 'AM'
      return `${hour}:${String(minuteValue).padStart(2, '0')} ${period}`
    }
  }

  const date = parseDate(value)
  return date ? timeFormatter.format(date) : 'Unknown time'
}

export function formatRelativeTime(value: string | Date | null | undefined, now = new Date()) {
  const date = parseDate(value)
  if (!date) return 'Unknown time'

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'Scheduled'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`

  return formatDate(date)
}

export function getExactDateTimeLabel(value: string | Date | null | undefined) {
  return formatDateTime(value)
}
