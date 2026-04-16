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

  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const monthLabels: (string | null)[] = weeks.map((week) => {
    const firstOfMonth = week.find((d) => d.getDate() === 1)
    return firstOfMonth ? MONTHS[firstOfMonth.getMonth()] : null
  })

  return (
    <div className="flex flex-col gap-1">
      {/* Month labels */}
      <div className="flex gap-1">
        {weeks.map((_, wi) => (
          <div key={wi} className="w-4 text-center">
            {monthLabels[wi] && (
              <span className="text-[9px] text-gray-400 leading-none">{monthLabels[wi]}</span>
            )}
          </div>
        ))}
      </div>

      {/* Grid */}
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
                title={new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
                className={`w-4 h-4 rounded-sm border transition-all ${
                  hasLog
                    ? 'bg-black border-black'
                    : 'bg-white border-gray-300 hover:border-black'
                } ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
