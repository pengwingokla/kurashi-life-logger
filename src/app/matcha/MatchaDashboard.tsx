'use client'

import { useState } from 'react'
import Link from 'next/link'
import StreakHeatmap from '@/components/StreakHeatmap'
import LogActions from '@/app/day/[date]/LogActions'
import { MatchaLog, MatchaCollection } from '@/lib/supabase'
import { toETDateKey, todayET, formatTimeET, formatDateLabel } from '@/lib/time'

type Props = {
  logs: MatchaLog[]
  collection: Pick<MatchaCollection, 'id' | 'name' | 'brand' | 'grade'>[]
}

function calcStreak(logs: MatchaLog[]): number {
  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (loggedDays.has(toETDateKey(d))) streak++
    else break
  }
  return streak
}

export default function MatchaDashboard({ logs, collection }: Props) {
  const today = todayET()
  const [selectedDate, setSelectedDate] = useState(today)

  const isToday = selectedDate === today
  const selectedLogs = logs.filter((l) => toETDateKey(new Date(l.logged_at)) === selectedDate)
  const todayLogs = logs.filter((l) => toETDateKey(new Date(l.logged_at)) === today)
  const todayGrams = todayLogs.reduce((s, l) => s + l.grams, 0)
  const streak = calcStreak(logs)

  const dateLabel = isToday
    ? "Today's Logs"
    : formatDateLabel(selectedDate)

  return (
    <div className="flex flex-col gap-6">
      {/* Heatmap */}
      <div className="washi-card p-4 overflow-x-auto">
        <StreakHeatmap logs={logs} selectedDate={selectedDate} onDayClick={setSelectedDate} />
      </div>

      {/* Stats (always today) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="washi-card p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400">Today</p>
          <p className="text-4xl font-bold mt-1">
            {todayLogs.length}
            <span className="text-lg font-normal text-gray-400 ml-1">
              {todayLogs.length === 1 ? 'cup' : 'cups'}
            </span>
          </p>
          {todayGrams > 0 && (
            <p className="text-sm text-gray-400 mt-1">{todayGrams}g total</p>
          )}
        </div>
        <div className="washi-card p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400">Streak</p>
          <p className="text-4xl font-bold mt-1">
            {streak}
            <span className="text-lg font-normal text-gray-400 ml-1">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </p>
        </div>
      </div>

      {/* Log button */}
      <Link
        href="/log"
        className="bg-black text-white text-center font-bold text-xl py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#666] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        + Log Matcha
      </Link>

      {/* Selected day logs */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">{dateLabel}</p>
        {selectedLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No matcha logged.</p>
        ) : (
          selectedLogs.map((log) => (
            <div key={log.id} className="washi-card px-4 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">
                    {log.matcha_collection?.name ?? 'Unknown matcha'}
                  </p>
                  {log.matcha_collection?.brand && (
                    <p className="text-sm text-gray-400">{log.matcha_collection.brand}</p>
                  )}
                  {log.notes && (
                    <p className="text-sm text-gray-400 italic mt-0.5">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{log.grams}g</p>
                  <p className="text-sm text-gray-400">{formatTimeET(log.logged_at)}</p>
                </div>
              </div>
              <LogActions log={log} collection={collection} date={selectedDate} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
