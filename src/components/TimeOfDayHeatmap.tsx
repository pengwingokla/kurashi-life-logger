'use client'

import { useMemo } from 'react'

type LogEntry = { logged_at: string }

type Props = {
  logs: LogEntry[]
}

// Same shade palette as StreakHeatmap
const SHADES =        ['', '#c4bfbc', '#999492', '#6d6a69', '#41403f']
const SHADE_BORDERS = ['', '#999492', '#6d6a69', '#41403f', '#41403f']

function getIntensity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5)  return 2
  if (ratio <= 0.75) return 3
  return 4
}

// Labels shown at every 6 hours
const HOUR_LABELS: Record<number, string> = {
  0:  '00:00',
  6:  '06:00',
  12: '12:00',
  18: '18:00',
}

export default function TimeOfDayHeatmap({ logs }: Props) {
  const hourCounts = useMemo(() => {
    const counts = new Array(24).fill(0)
    for (const log of logs) {
      const hour = new Date(log.logged_at).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      })
      const h = parseInt(hour) % 24
      counts[h]++
    }
    return counts
  }, [logs])

  const max = Math.max(...hourCounts, 1)

  // Build a smooth gradient — one color stop per hour at its midpoint
  const colorStops = hourCounts.map((count, hour) => {
    const intensity = getIntensity(count, max)
    const color = intensity > 0 ? SHADES[intensity] : '#e5e2e0'
    const pct = ((hour + 0.5) / 24 * 100).toFixed(2)
    return `${color} ${pct}%`
  }).join(', ')

  return (
    <div className="flex flex-col gap-1">
      <div
        className="w-full rounded-sm"
        style={{ height: '8px', background: `linear-gradient(to right, ${colorStops})` }}
      />

      {/* Hour labels at 00, 06, 12, 18 */}
      <div className="relative h-3">
        {Object.entries(HOUR_LABELS).map(([h, label]) => (
          <span
            key={h}
            className="absolute text-[9px] text-gray-500 leading-none"
            style={{ left: `${(parseInt(h) / 24) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
