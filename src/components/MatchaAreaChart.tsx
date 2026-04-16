'use client'

import { useMemo, useState } from 'react'
import { toETDateKey } from '@/lib/time'

type LogEntry = { logged_at: string; grams: number }

type Props = {
  logs: LogEntry[]
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function buildDailyData(logs: LogEntry[], days: number): { date: string; grams: number }[] {
  // Build a map of date key → total grams
  const byDate: Record<string, number> = {}
  for (const log of logs) {
    const key = toETDateKey(new Date(log.logged_at))
    byDate[key] = (byDate[key] ?? 0) + log.grams
  }

  // Fill in all days in range (oldest → newest)
  const result: { date: string; grams: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = toETDateKey(d)
    result.push({ date: key, grams: byDate[key] ?? 0 })
  }
  return result
}

function formatXLabel(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`)
  if (days <= 7) {
    // "Mon", "Tue" etc
    return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' })
  }
  // "Apr 10"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
}

export default function MatchaAreaChart({ logs }: Props) {
  const [rangeIdx, setRangeIdx] = useState(0)
  const { days } = RANGES[rangeIdx]

  const data = useMemo(() => buildDailyData(logs, days), [logs, days])

  const maxGrams = Math.max(...data.map((d) => d.grams), 1)
  // Round up to nearest nice number
  const yMax = Math.ceil(maxGrams / 2) * 2 || 2

  // SVG dimensions
  const W = 320
  const H = 120
  const padL = 28
  const padR = 8
  const padT = 8
  const padB = 24

  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const n = data.length

  function xPos(i: number) {
    return padL + (i / (n - 1)) * chartW
  }
  function yPos(grams: number) {
    return padT + chartH - (grams / yMax) * chartH
  }

  // Build SVG path
  const points = data.map((d, i) => `${xPos(i)},${yPos(d.grams)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${xPos(n - 1)},${padT + chartH} L ${xPos(0)},${padT + chartH} Z`

  // X-axis tick indices — show ~5 labels regardless of range
  const tickStep = Math.max(1, Math.floor(n / 5))
  const xTicks = data
    .map((d, i) => ({ i, label: formatXLabel(d.date, days) }))
    .filter((_, i) => i % tickStep === 0 || i === n - 1)

  // Y-axis labels: 0, mid, max
  const yLabels = [0, Math.round(yMax / 2), yMax]

  // Total and avg for the period
  const totalGrams = data.reduce((s, d) => s + d.grams, 0)
  const activeDays = data.filter((d) => d.grams > 0).length

  return (
    <div className="washi-card p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="t-label">Intake over time</p>
        <div className="flex gap-2">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`text-xs font-bold transition-colors ${
                i === rangeIdx
                  ? 'text-[#1a1008]'
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4">
        <div>
          <p className="t-label">Total</p>
          <p className="t-h2">{totalGrams}g</p>
        </div>
        <div>
          <p className="t-label">Active days</p>
          <p className="t-h2">{activeDays} / {days}</p>
        </div>
        {activeDays > 0 && (
          <div>
            <p className="t-label">Avg / day</p>
            <p className="t-h2">{(totalGrams / days).toFixed(1)}g</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        aria-label="Matcha intake area chart"
      >
        {/* Y grid lines + labels */}
        {yLabels.map((g) => (
          <g key={g}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yPos(g)}
              y2={yPos(g)}
              stroke="#1a1008"
              strokeWidth={g === 0 ? 1.5 : 0.5}
              strokeDasharray={g === 0 ? undefined : '3 3'}
              opacity={g === 0 ? 0.3 : 0.15}
            />
            <text
              x={padL - 4}
              y={yPos(g)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={8}
              fill="#9ca3af"
            >
              {g}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="#1a1008" opacity={0.08} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#1a1008"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots for non-zero days */}
        {data.map((d, i) =>
          d.grams > 0 ? (
            <circle
              key={d.date}
              cx={xPos(i)}
              cy={yPos(d.grams)}
              r={2.5}
              fill="#1a1008"
            />
          ) : null
        )}

        {/* X-axis labels */}
        {xTicks.map(({ i, label }) => (
          <text
            key={i}
            x={xPos(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={8}
            fill="#9ca3af"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}
