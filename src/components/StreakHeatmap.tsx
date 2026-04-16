'use client'

import { useRouter } from 'next/navigation'

type Props = {
  logs: { logged_at: string; grams: number }[]
  selectedDate?: string
  onDayClick?: (date: string) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Rows 0–6 = Sun–Sat. Only label Mon (1), Wed (3), Fri (5).
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

// Intensity thresholds in grams → background color
// 0 = no log, 1 = 1–4g, 2 = 5–8g, 3 = 9–12g, 4 = 13g+
// 4 shades of #dad4d1 from light → dark
const SHADES =        ['', '#c4bfbc', '#999492', '#6d6a69', '#41403f']
const SHADE_BORDERS = ['', '#999492', '#6d6a69', '#41403f', '#41403f']

function getIntensity(grams: number): number {
  if (grams <= 0) return 0
  if (grams <= 4) return 1
  if (grams <= 8) return 2
  if (grams <= 12) return 3
  return 4
}

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
  const todayKey = toETDateKey(new Date())

  // Aggregate grams per ET date key
  const gramsByDay: Record<string, number> = {}
  for (const log of logs) {
    const key = toETDateKey(new Date(log.logged_at))
    gramsByDay[key] = (gramsByDay[key] ?? 0) + log.grams
  }

  const monthLabels: (string | null)[] = weeks.map((week) => {
    const firstOfMonth = week.find((d) => d && d.getDate() === 1)
    return firstOfMonth ? MONTHS[firstOfMonth.getMonth()] : null
  })

  return (
    <div className="flex flex-col gap-2">
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
                const grams = gramsByDay[key] ?? 0
                const intensity = getIntensity(grams)
                const isToday = key === todayKey
                const isSelected = selectedDate === key
                return (
                  <button
                    key={key}
                    onClick={() => onDayClick ? onDayClick(key) : router.push(`/day/${key}`)}
                    title={`${new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}${grams > 0 ? ` · ${grams}g` : ''}`}
                    style={intensity > 0 ? { backgroundColor: SHADES[intensity], borderColor: SHADE_BORDERS[intensity] } : undefined}
                    className={`w-4 h-4 rounded-sm border transition-all ${
                      intensity === 0
                        ? 'bg-transparent border-[#c4bfbc] hover:border-[#999492]'
                        : ''
                    } ${isToday || isSelected ? 'ring-2 ring-black ring-offset-1' : ''}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 self-end">
        <span className="text-[9px] text-gray-500">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm border"
            style={level > 0
              ? { backgroundColor: SHADES[level], borderColor: 'transparent' }
              : { backgroundColor: 'transparent', borderColor: '#c4bfbc' }
            }
          />
        ))}
        <span className="text-[9px] text-gray-500">More</span>
      </div>
    </div>
  )
}
