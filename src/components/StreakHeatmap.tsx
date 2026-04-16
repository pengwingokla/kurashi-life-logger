'use client'

import { useRouter } from 'next/navigation'

type Props = {
  logs: { logged_at: string }[]
  selectedDate?: string
  onDayClick?: (date: string) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Rows 0–6 = Sun–Sat. Only label Mon (1), Wed (3), Fri (5).
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function toETDateKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function buildWeeks(): (Date | null)[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDow = today.getDay() // 0 = Sunday

  // Sunday that starts the earliest of our 12 weeks
  const startSunday = new Date(today)
  startSunday.setDate(today.getDate() - todayDow - 11 * 7)

  const weeks: (Date | null)[][] = []
  for (let w = 0; w < 12; w++) {
    const week: (Date | null)[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(startSunday)
      day.setDate(startSunday.getDate() + w * 7 + d)
      week.push(day <= today ? day : null)
    }
    weeks.push(week)
  }
  return weeks
}

export default function StreakHeatmap({ logs, selectedDate, onDayClick }: Props) {
  const router = useRouter()
  const weeks = buildWeeks()
  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))
  const todayKey = toETDateKey(new Date())

  const monthLabels: (string | null)[] = weeks.map((week) => {
    const firstOfMonth = week.find((d) => d && d.getDate() === 1)
    return firstOfMonth ? MONTHS[firstOfMonth.getMonth()] : null
  })

  return (
    <div className="flex gap-1">
      {/* Day label column — same h-4 + gap-1 rhythm as grid rows */}
      <div className="flex flex-col gap-1">
        {/* Spacer matching month-label row */}
        <div className="h-4" />
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="h-4 flex items-center justify-end pr-1">
            {label && (
              <span className="text-[9px] text-gray-500 leading-none">{label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1">
        {/* Month labels row */}
        <div className="flex gap-1">
          {weeks.map((_, wi) => (
            <div key={wi} className="w-4 h-4 flex items-center justify-center">
              {monthLabels[wi] && (
                <span className="text-[9px] text-gray-500 leading-none">{monthLabels[wi]}</span>
              )}
            </div>
          ))}
        </div>

        {/* 7 rows: Sun → Sat */}
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div key={dayIndex} className="flex gap-1">
            {weeks.map((week, wi) => {
              const day = week[dayIndex]
              if (!day) return <div key={wi} className="w-4 h-4" />
              const key = toETDateKey(day)
              const hasLog = loggedDays.has(key)
              const isToday = key === todayKey
              return (
                <button
                  key={key}
                  onClick={() => onDayClick ? onDayClick(key) : router.push(`/day/${key}`)}
                  title={new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                  className={`w-4 h-4 rounded-sm border transition-all ${
                    hasLog
                      ? 'bg-black border-black'
                      : 'bg-white border-gray-300 hover:border-black'
                  } ${isToday ? 'ring-2 ring-black ring-offset-1' : ''} ${
                    selectedDate === key && !isToday ? 'ring-2 ring-black ring-offset-1' : ''
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
