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

// Formats a timestamp as "13:45" (24h) in ET — for <input type="time">
export function formatTimeET24h(isoString: string): string {
  const t = new Date(isoString).toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return t.startsWith('24') ? '00' + t.slice(2) : t
}

// Converts an ET date key + HH:mm time string back to a UTC ISO string
export function etTimeToUTC(dateKey: string, timeHHMM: string): string {
  // Find ET offset by checking what hour noon UTC is in ET on that date
  const noonUTC = new Date(`${dateKey}T12:00:00Z`)
  const etHourAtNoon = parseInt(
    noonUTC.toLocaleTimeString('en-US', {
      timeZone: TZ,
      hour: '2-digit',
      hour12: false,
    }).replace('24', '0')
  )
  const offsetHours = 12 - etHourAtNoon // e.g. 5 for EST, 4 for EDT
  const [h, m] = timeHHMM.split(':').map(Number)
  const result = new Date(`${dateKey}T00:00:00Z`)
  result.setUTCHours(h + offsetHours, m, 0, 0)
  return result.toISOString()
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
