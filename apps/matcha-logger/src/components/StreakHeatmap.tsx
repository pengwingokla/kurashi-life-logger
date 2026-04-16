'use client'

import { useRouter } from 'next/navigation'

type Props = {
  logs: { logged_at: string }[]
}

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

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function StreakHeatmap({ logs }: Props) {
  const router = useRouter()
  const days = getLast84Days()

  const loggedDays = new Set(
    logs.map((l) => toDateKey(new Date(l.logged_at)))
  )

  // Group into weeks (columns of 7)
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => {
            const key = toDateKey(day)
            const hasLog = loggedDays.has(key)
            const isToday = key === toDateKey(new Date())
            return (
              <button
                key={key}
                onClick={() => router.push(`/day/${key}`)}
                title={key}
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
