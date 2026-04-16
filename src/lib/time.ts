const TZ = 'America/New_York'

// Returns YYYY-MM-DD in ET for a given date
export function toETDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ })
}

// Returns today's date key in ET
export function todayET(): string {
  return toETDateKey(new Date())
}

// Formats a timestamp as "9:04 AM" in ET
export function formatTimeET(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formats a date key as "Thursday, April 10" in ET
export function formatDateLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
