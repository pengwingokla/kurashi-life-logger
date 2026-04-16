'use client'

import { useRouter } from 'next/navigation'

type Props = {
  logs: { logged_at: string }[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getLast84Days(): Date[] {
  const days: Date[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

function toETDateKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export default function StreakHeatmap({ logs }: Props) {
  const router = useRouter()
  const days = getLast84Days()

  const loggedDays = new Set(
    logs.map((l) => toETDateKey(new Date(l.logged_at)))
  )

  // Group into weeks (columns of 7)
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Find which week column each month label should appear above
  // A month label appears on the first week that contains the 1st of that month
  const monthLabels: (string | null)[] = weeks.map((week) => {
    const firstOfMonth = week.find((d) => d.getDate() === 1)
    return firstOfMonth ? MONTHS[firstOfMonth.getMonth()] : null
  })

  return (
    <div className="flex flex-col gap-1">
      {/* Month labels row */}
      <div className="flex gap-1">
        {weeks.map((_, wi) => (
          <div key={wi} className="w-4 text-center">
            {monthLabels[wi] && (
              <span className="text-[9px] text-stone-400 leading-none">
                {monthLabels[wi]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Heatmap grid — rotate: render by row (day of week) across all weeks */}
      {Array.from({ length: 7 }).map((_, dayIndex) => (
        <div key={dayIndex} className="flex gap-1">
          {weeks.map((week, wi) => {
            const day = week[dayIndex]
            if (!day) return <div key={wi} className="w-4 h-4" />
            const key = toETDateKey(day)
            const hasLog = loggedDays.has(key)
            const isToday = key === toETDateKey(new Date())
            return (
              <button
                key={key}
                onClick={() => router.push(`/day/${key}`)}
                title={new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                className={`w-4 h-4 rounded-sm transition-colors ${
                  hasLog
                    ? 'bg-green-500'
                    : 'bg-stone-200 dark:bg-stone-700'
                } ${isToday ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
