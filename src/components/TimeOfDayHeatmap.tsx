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

  // 1px lines with 5.5px gap ≈ 156px total to align with StreakHeatmap height
  const LINE_H = 1
  const LINE_GAP = 5.5
  const totalH = 24 * LINE_H + 23 * LINE_GAP

  return (
    <div className="flex flex-col gap-1 shrink-0">
      {/* Spacer matching month-label row in StreakHeatmap */}
      <div className="h-4 flex items-center">
        <span className="text-[9px] text-gray-500 leading-none">hr</span>
      </div>

      <div className="flex gap-1.5 items-start">
        {/* 24 lines */}
        <div className="flex flex-col" style={{ gap: `${LINE_GAP}px` }}>
          {hourCounts.map((count, hour) => {
            const intensity = getIntensity(count, max)
            return (
              <div
                key={hour}
                title={`${String(hour).padStart(2, '0')}:00 — ${count} log${count !== 1 ? 's' : ''}`}
                className="w-5"
                style={{
                  height: `${LINE_H}px`,
                  backgroundColor: intensity > 0 ? SHADES[intensity] : '#e5e2e0',
                }}
              />
            )
          })}
        </div>

        {/* Hour labels at 00, 06, 12, 18 */}
        <div className="relative shrink-0" style={{ height: totalH }}>
          {Object.entries(HOUR_LABELS).map(([h, label]) => (
            <span
              key={h}
              className="absolute text-[9px] text-gray-500 leading-none"
              style={{ top: parseInt(h) * (LINE_H + LINE_GAP) - 3 }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
