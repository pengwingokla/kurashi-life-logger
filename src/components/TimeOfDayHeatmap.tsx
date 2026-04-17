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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex w-full rounded-sm overflow-hidden">
        {hourCounts.map((count, hour) => {
          const intensity = getIntensity(count, max)
          return (
            <div
              key={hour}
              title={`${String(hour).padStart(2, '0')}:00 — ${count} log${count !== 1 ? 's' : ''}`}
              className="flex-1"
              style={{
                height: '8px',
                backgroundColor: intensity > 0 ? SHADES[intensity] : '#e5e2e0',
              }}
            />
          )
        })}
      </div>

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
